import { buildTutorSystemPrompt } from "@/lib/ai/tutor-prompt";
import { getAiTutorUserId } from "@/lib/ai/ai-tutor-user";
import { db } from "@/lib/db/aurora-dsql";
import { groupMessages } from "@/lib/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

const MENTION_PATTERN = /@ai\b/i;

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

export function mentionsAiTutor(content: string): boolean {
  return MENTION_PATTERN.test(content);
}

/**
 * Generates a RAG-grounded reply to an "@AI" mention in a study group chat and
 * inserts it as a new group_messages row. The existing SSE poll loop in
 * /api/study-groups/[id]/live picks up the new row and broadcasts it to everyone
 * in the group within one poll tick — no separate delivery mechanism needed.
 *
 * Call this fire-and-forget after the mentioning message is already saved and
 * the POST response has been sent; the reply arrives a few seconds later via SSE.
 */
export async function replyToAiMention(opts: {
  groupId: string;
  courseId: string;
  mentionerUserId: string;
  isPro: boolean;
  content: string;
}): Promise<void> {
  const { groupId, courseId, mentionerUserId, isPro, content } = opts;

  // Shares the same hourly bucket as the 1-on-1 AI tutor — group mentions
  // shouldn't be a way to bypass that limit.
  if (!isPro) {
    const { limited } = rateLimit(`ai:${mentionerUserId}`, 20, 60 * 60 * 1000);
    if (limited) {
      console.warn(`[group-mention] AI rate limit reached for user ${mentionerUserId}`);
      return;
    }
  }

  const question = content.replace(/@ai\b/gi, "").replace(/\s+/g, " ").trim() || content;

  const systemPrompt = await buildTutorSystemPrompt(courseId, question);
  const { text } = await generateText({
    model: google("gemini-3.1-flash-lite"),
    system: `${systemPrompt}\n\nYou are replying inside a group chat with multiple students watching, not a 1-on-1 session — keep your answer focused and not overly long.`,
    prompt: question,
  });

  const aiTutorUserId = await getAiTutorUserId();
  await db.insert(groupMessages).values({ groupId, userId: aiTutorUserId, content: text });
}
