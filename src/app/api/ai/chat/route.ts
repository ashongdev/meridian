import { embedText } from "@/lib/ai/embed";
import { searchChunks } from "@/lib/ai/ingest";
import { auth } from "@/lib/auth/config";
import { db, ensureDb } from "@/lib/db/aurora-dsql";
import {
	aiSessions,
	courseMemberships,
	courses,
	universities,
} from "@/lib/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { convertToModelMessages, streamText } from "ai";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const google = createGoogleGenerativeAI({
	apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

const bodySchema = z.object({
	// UIMessage[] sent by DefaultChatTransport — loose schema, we extract text manually
	messages: z.array(z.any()).min(1),
	courseId: z.string().uuid(),
});

// POST /api/ai/chat — streaming RAG chat
export async function POST(req: NextRequest) {
	await ensureDb();
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userId = session.user.id;
	const isPro = session.user.isPro ?? false;

	if (!isPro) {
		const { limited, retryAfter } = rateLimit(
			`ai:${userId}`,
			20,
			60 * 60 * 1000,
		);
		if (limited) {
			return NextResponse.json(
				{
					error: "Hourly AI limit reached. Upgrade to Pro for unlimited tutoring.",
				},
				{ status: 429, headers: { "Retry-After": String(retryAfter) } },
			);
		}
	}

	const body = await req.json().catch(() => null);
	const parsed = bodySchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "Invalid input", issues: parsed.error.issues },
			{ status: 400 },
		);
	}

	const { messages, courseId } = parsed.data;

	try {
		const [membership] = await db
			.select({ id: courseMemberships.id })
			.from(courseMemberships)
			.where(
				and(
					eq(courseMemberships.userId, userId),
					eq(courseMemberships.courseId, courseId),
				),
			)
			.limit(1);
		if (!membership) {
			return NextResponse.json(
				{ error: "You must be enrolled to use the AI tutor" },
				{ status: 403 },
			);
		}

		const [courseRow] = await db
			.select({
				title: courses.title,
				code: courses.code,
				uniName: universities.name,
			})
			.from(courses)
			.leftJoin(universities, eq(universities.id, courses.universityId))
			.where(eq(courses.id, courseId))
			.limit(1);

		// Extract text from the latest user UIMessage (parts array in v6)
		const lastUserMsg = [...messages]
			.reverse()
			.find((m: { role: string }) => m.role === "user");
		const lastUserText: string =
			lastUserMsg?.parts
				?.filter((p: { type: string }) => p.type === "text")
				?.map((p: { text: string }) => p.text)
				?.join("") ?? "";

		// RAG: embed question → find similar chunks
		const [queryEmbedding] = await Promise.all([embedText(lastUserText)]);
		const relevantChunks = await searchChunks(
			courseId,
			queryEmbedding,
			6,
		).catch(() => []);

		const contextBlock =
			relevantChunks.length > 0
				? relevantChunks
						.map(
							(c, i) =>
								`[${i + 1}] From "${c.materialTitle}":\n${c.content}`,
						)
						.join("\n\n---\n\n")
				: "No course materials have been indexed yet. Answer from general knowledge but note the lack of course-specific context.";

		const systemPrompt = `You are Meridian, an AI tutor for ${courseRow?.code ?? "this course"} — ${courseRow?.title ?? ""} at ${courseRow?.uniName ?? "university"}.

Your job is to help students understand course material deeply. You are patient, encouraging, and academically rigorous.

COURSE MATERIALS CONTEXT:
${contextBlock}

INSTRUCTIONS:
- Ground your answers in the course materials above when relevant.
- If materials don't cover the question, say so and answer from general academic knowledge.
- Cite sources naturally (e.g. "According to the lecture notes on X...").
- Be concise but thorough. Use examples. Format with markdown when it helps.
- Never copy-paste — synthesise and explain.`;

		// Persist messages fire-and-forget
		db.select({ id: aiSessions.id })
			.from(aiSessions)
			.where(
				and(
					eq(aiSessions.userId, userId),
					eq(aiSessions.courseId, courseId),
				),
			)
			.limit(1)
			.then(([existing]) => {
				if (existing) {
					return db
						.update(aiSessions)
						.set({
							messages: JSON.stringify(messages),
							updatedAt: new Date(),
						})
						.where(eq(aiSessions.id, existing.id));
				}
				return db
					.insert(aiSessions)
					.values({
						userId,
						courseId,
						messages: JSON.stringify(messages),
					});
			})
			.catch((err) =>
				console.error("[ai/chat] session persist failed:", err),
			);

		const result = streamText({
			model: google("gemini-3.1-flash-lite"),
			system: systemPrompt,
			messages: await convertToModelMessages(messages),
		});

		return result.toUIMessageStreamResponse();
	} catch (err) {
		console.error("[POST /api/ai/chat]", err);
		return NextResponse.json(
			{ error: "AI tutor unavailable" },
			{ status: 500 },
		);
	}
}
