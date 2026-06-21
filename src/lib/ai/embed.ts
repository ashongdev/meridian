import type { FeatureExtractionPipeline } from "@huggingface/transformers";

// Local embedding model — no API key, no billing, no quota. Runs in-process.
// 384 dims (matches vector(384) in material_chunks). Swap for a hosted provider
// with upfront free credits before a real deploy, if cold-start latency matters.
const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

let _extractor: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!_extractor) {
    _extractor = import("@huggingface/transformers").then(({ pipeline }) =>
      pipeline("feature-extraction", MODEL_ID),
    );
  }
  return _extractor;
}

export async function embedText(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

// Local inference has no API-imposed batch cap, but running hundreds of sequences
// through the model in one call pads them all to the longest sequence length and
// allocates one giant tensor — on modest hardware this can exhaust RAM+swap badly
// enough to freeze the whole machine, not just crash the Node process. Keep batches
// small and sequential so peak memory stays bounded regardless of document size.
const LOCAL_BATCH_SIZE = 8;

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const extractor = await getExtractor();

  const embeddings: number[][] = [];
  for (let i = 0; i < texts.length; i += LOCAL_BATCH_SIZE) {
    const slice = texts.slice(i, i + LOCAL_BATCH_SIZE);
    const output = await extractor(slice, { pooling: "mean", normalize: true });
    const dims = output.dims[1];
    for (let j = 0; j < slice.length; j++) {
      embeddings.push(Array.from(output.data.slice(j * dims, (j + 1) * dims) as Float32Array));
    }
  }
  return embeddings;
}
