import fs from "fs";
import path from "path";

/**
 * Reads an uploaded attachment (from Vercel Blob URL or local /uploads/ fallback)
 * and returns it base64-encoded, ready to send to Gemini as inline multimodal input.
 * Returns null if the file can't be read (e.g. storage misconfigured) - callers
 * should treat that as "no attachment available" rather than failing the whole request.
 */
export async function fetchAttachmentBase64(url: string): Promise<string | null> {
  try {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const res = await fetch(url);
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      return buf.toString("base64");
    }

    // Local dev fallback: relative path like /uploads/xyz.pdf saved on local disk
    const filePath = path.join(process.cwd(), "public", url.replace(/^\//, ""));
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath).toString("base64");
    }
    return null;
  } catch (e) {
    console.error("Failed to fetch attachment for AI classification:", e);
    return null;
  }
}
