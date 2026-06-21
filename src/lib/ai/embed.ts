import { google } from "@ai-sdk/google";
import { embed, embedMany } from "ai";

const EMBEDDING_MODEL = google.embedding("gemini-embedding-001");
// Pin to 768 dims to match the vector(768) pgvector column
const PROVIDER_OPTIONS = { google: { outputDimensionality: 768 } };

export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: EMBEDDING_MODEL,
    value: text,
    providerOptions: PROVIDER_OPTIONS,
  });
  return embedding;
}

// Gemini's batch embedding endpoint caps at 100 requests per call
const GEMINI_BATCH_LIMIT = 100;

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const embeddings: number[][] = [];
  for (let i = 0; i < texts.length; i += GEMINI_BATCH_LIMIT) {
    const slice = texts.slice(i, i + GEMINI_BATCH_LIMIT);
    const { embeddings: batchEmbeddings } = await embedMany({
      model: EMBEDDING_MODEL,
      values: slice,
      providerOptions: PROVIDER_OPTIONS,
    });
    embeddings.push(...batchEmbeddings);
  }
  return embeddings;
}
