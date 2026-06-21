import { embedText } from "@/lib/ai/embed";
import { searchChunks } from "@/lib/ai/ingest";
import { db } from "@/lib/db/aurora-dsql";
import { courses, universities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Shared RAG context + system prompt builder, used by both the 1-on-1 AI tutor
 * chat (streaming) and the group-chat @AI mention handler (non-streaming).
 */
export async function buildTutorSystemPrompt(courseId: string, question: string): Promise<string> {
  const [courseRow] = await db
    .select({ title: courses.title, code: courses.code, uniName: universities.name })
    .from(courses)
    .leftJoin(universities, eq(universities.id, courses.universityId))
    .where(eq(courses.id, courseId))
    .limit(1);

  const queryEmbedding = await embedText(question);
  const relevantChunks = await searchChunks(courseId, queryEmbedding, 6).catch(() => []);

  const contextBlock =
    relevantChunks.length > 0
      ? relevantChunks
          .map((c, i) => `[${i + 1}] From "${c.materialTitle}":\n${c.content}`)
          .join("\n\n---\n\n")
      : "No course materials have been indexed yet. Answer from general knowledge but note the lack of course-specific context.";

  return `You are Meridian, an AI tutor for ${courseRow?.code ?? "this course"} — ${courseRow?.title ?? ""} at ${courseRow?.uniName ?? "university"}.

Your job is to help students understand course material deeply. You are patient, encouraging, and academically rigorous.

COURSE MATERIALS CONTEXT:
${contextBlock}

INSTRUCTIONS:
- Ground your answers in the course materials above when relevant.
- If materials don't cover the question, say so and answer from general academic knowledge.
- Cite sources naturally (e.g. "According to the lecture notes on X...").
- Be concise but thorough. Use examples. Format with markdown when it helps.
- Never copy-paste — synthesise and explain.`;
}
