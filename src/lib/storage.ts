import fs from "fs";
import path from "path";

export interface SavedFile {
  url: string;
  type: string;
}

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

  if (process.env.VERCEL) {
    throw new Error(
      "File storage is not set up yet. Ask your administrator to add Vercel Blob storage (see DEPLOYMENT_GUIDE.md, Step 6) - until then, registrations work fine without an attached file."
    );
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(uploadsDir, { recursive: true });

  const filename = relativePath.replace(/\//g, "_");
  const filePath = path.join(uploadsDir, filename);

  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(await (data as Blob).arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  return { url: `/uploads/${filename}`, type: contentType };
}