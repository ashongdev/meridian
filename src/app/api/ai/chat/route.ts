import { buildTutorSystemPrompt } from "@/lib/ai/tutor-prompt";
import { auth } from "@/lib/auth/config";
import { db, ensureDb } from "@/lib/db/aurora-dsql";
import { aiSessions, courseMemberships } from "@/lib/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
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

		// Extract text from the latest user UIMessage (parts array in v6)
		const lastUserMsg = [...messages]
			.reverse()
			.find((m: { role: string }) => m.role === "user");
		const lastUserText: string =
			lastUserMsg?.parts
				?.filter((p: { type: string }) => p.type === "text")
				?.map((p: { text: string }) => p.text)
				?.join("") ?? "";

		const systemPrompt = await buildTutorSystemPrompt(courseId, lastUserText);

		const result = streamText({
			model: google("gemini-3.1-flash-lite"),
			system: systemPrompt,
			messages: await convertToModelMessages(messages),
		});

		return result.toUIMessageStreamResponse({
			// Fires once the full response is ready — `messages` is the complete
			// conversation including the new assistant reply, ready to persist verbatim.
			onFinish: ({ messages: finalMessages }) => {
				persistSession(userId, courseId, finalMessages).catch((err) =>
					console.error("[ai/chat] session persist failed:", err),
				);
			},
		});
	} catch (err) {
		console.error("[POST /api/ai/chat]", err);
		return NextResponse.json(
			{ error: "AI tutor unavailable" },
			{ status: 500 },
		);
	}
}

async function persistSession(userId: string, courseId: string, messages: UIMessage[]) {
	const [existing] = await db
		.select({ id: aiSessions.id })
		.from(aiSessions)
		.where(and(eq(aiSessions.userId, userId), eq(aiSessions.courseId, courseId)))
		.limit(1);

	if (existing) {
		await db
			.update(aiSessions)
			.set({ messages: JSON.stringify(messages), updatedAt: new Date() })
			.where(eq(aiSessions.id, existing.id));
	} else {
		await db.insert(aiSessions).values({ userId, courseId, messages: JSON.stringify(messages) });
	}
}
