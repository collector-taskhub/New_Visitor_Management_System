import fs from "fs";
import path from "path";

export interface SavedFile {
  url: string;
  type: string;
}

/**
 * Saves a file and returns a public URL.
 * - If BLOB_READ_WRITE_TOKEN is set (Vercel deployment), uploads to Vercel Blob.
 * - Otherwise, if running locally (not on Vercel), writes to /public/uploads -
 *   zero cloud account needed to try the system on your own computer.
 * - If running ON Vercel WITHOUT a Blob token configured, throws a clear,
 *   friendly error instead of crashing - Vercel's servers don't allow writing
 *   files to disk the way a local computer does.
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
      allowOverwrite: true,
    });
    return { url: blob.url, type: contentType };
  }

  // Running on Vercel (or any serverless host) with no Blob token configured -
  // local disk writes are not allowed there, so fail clearly instead of crashing.
  if (process.env.VERCEL) {
    throw new Error(
      "File storage is not set up yet. Ask your administrator to add Vercel Blob storage (see DEPLOYMENT_GUIDE.md, Step 6) - until then, registrations work fine without an attached file."
    );
  }

  // Local prototype fallback (your own computer, `npm run dev`)
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(uploadsDir, { recursive: true });

  const filename = relativePath.replace(/\//g, "_");
  const filePath = path.join(uploadsDir, filename);

  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(await (data as Blob).arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  return { url: `/uploads/${filename}`, type: contentType };
}
