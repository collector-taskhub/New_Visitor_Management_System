import { NextResponse } from "next/server";
import { saveFile } from "@/lib/storage";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only PDF, JPG, PNG, WEBP files are allowed" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File must be under 8 MB" }, { status: 400 });
    }

    const filename = `applications/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const saved = await saveFile(filename, file, file.type);

    return NextResponse.json({
      url: saved.url,
      type: file.type, // exact MIME type (e.g. "application/pdf", "image/jpeg") - used both for
      // display and, in the AI classifier, as the mime_type Gemini needs to read the file directly
    });
  } catch (err: any) {
    console.error("Upload failed:", err);
    return NextResponse.json(
      { error: err.message || "File upload failed. You can still submit the registration without an attachment." },
      { status: 500 }
    );
  }
}
