import fs from "fs";
import path from "path";

export interface SavedFile {
  url: string;
  type: string;
}

/**
 * Saves a file and returns a public URL.
 * - If BLOB_READ_WRITE_TOKEN is set (Vercel deployment), uploads to Vercel Blob.
 * - Otherwise (local prototype), writes to /public/uploads and returns a relative URL
 *   that Next.js serves automatically - zero cloud account needed to try the system.
 */
export async function saveFile(
  relativePath: string,
  data: Buffer | Blob,
  contentType: string
): Promise<SavedFile> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(relativePath, data as any, {
      access: "public",
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { url: blob.url, type: contentType };
  }

  // Local fallback
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(uploadsDir, { recursive: true });

  const filename = relativePath.replace(/\//g, "_");
  const filePath = path.join(uploadsDir, filename);

  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(await (data as Blob).arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  return { url: `/uploads/${filename}`, type: contentType };
}
