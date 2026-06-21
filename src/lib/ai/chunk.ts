const CHUNK_SIZE    = 1_800; // characters (~450 tokens)
const CHUNK_OVERLAP = 200;

export function chunkText(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= CHUNK_SIZE) return cleaned ? [cleaned] : [];

  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    const end = Math.min(start + CHUNK_SIZE, cleaned.length);
    // Try to break at a sentence boundary within the last 20% of the chunk
    let breakAt = end;
    if (end < cleaned.length) {
      const window  = cleaned.slice(end - Math.floor(CHUNK_SIZE * 0.2), end);
      const lastDot = Math.max(window.lastIndexOf(". "), window.lastIndexOf(".\n"));
      if (lastDot !== -1) {
        breakAt = end - Math.floor(CHUNK_SIZE * 0.2) + lastDot + 2;
      }
    }
    chunks.push(cleaned.slice(start, breakAt).trim());

    // This chunk already reaches the end of the text — there's no next chunk to
    // overlap with. Stop here; stepping back by CHUNK_OVERLAP can otherwise land
    // exactly back on the same `start` and loop forever.
    if (breakAt >= cleaned.length) break;

    start = breakAt - CHUNK_OVERLAP;
    if (start < 0) start = 0;
  }

  return chunks.filter(Boolean);
}
