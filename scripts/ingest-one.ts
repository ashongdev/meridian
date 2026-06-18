import { readFile } from "fs/promises";
import { ingestMaterial } from "../src/lib/ai/ingest";

const MATERIAL_ID = process.argv[2];
const FILE_PATH   = process.argv[3];
const COURSE_ID   = process.argv[4];
const MIME        = process.argv[5] ?? "application/pdf";

async function main() {
  if (!MATERIAL_ID || !FILE_PATH || !COURSE_ID) {
    console.error("Usage: ingest-one <materialId> <filePath> <courseId> [mimeType]");
    process.exit(1);
  }

  const buffer = await readFile(FILE_PATH);
  console.log(`Loaded ${buffer.length} bytes from ${FILE_PATH}`);

  const result = await ingestMaterial({
    id:       MATERIAL_ID,
    courseId: COURSE_ID,
    fileUrl:  "local:" + FILE_PATH,
    mimeType: MIME,
    buffer,
  });

  console.log("Done:", result);
}

main().catch((err) => { console.error("Failed:", err); process.exit(1); });
