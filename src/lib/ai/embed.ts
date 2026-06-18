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

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const { embeddings } = await embedMany({
    model: EMBEDDING_MODEL,
    values: texts,
    providerOptions: PROVIDER_OPTIONS,
  });
  return embeddings;
}
