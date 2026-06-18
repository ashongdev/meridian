import { readFile } from "fs/promises";
import { join, normalize, extname } from "path";
import { NextRequest, NextResponse } from "next/server";

const UPLOADS_DIR = join(process.cwd(), "local-uploads");

const MIME: Record<string, string> = {
  ".pdf":  "application/pdf",
  ".doc":  "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".ppt":  "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".txt":  "text/plain",
  ".md":   "text/markdown",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
};

// GET /api/uploads/[...path] — serves files saved to local-uploads/ in dev
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  // Prevent path traversal
  const safe = normalize(path.join("/")).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = join(UPLOADS_DIR, safe);
  if (!filePath.startsWith(UPLOADS_DIR)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const buf = await readFile(filePath);
    const filename = path[path.length - 1];
    const mimeType = MIME[extname(filename).toLowerCase()] ?? "application/octet-stream";
    return new NextResponse(buf, {
      headers: {
        "Content-Type":        mimeType,
        "Content-Length":      String(buf.length),
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control":       "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
