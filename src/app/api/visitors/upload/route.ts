import { NextResponse } from "next/server";
import { saveFile } from "@/lib/storage";
import { verifyFileSignature, checkVirusTotal } from "@/lib/fileValidation";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

export async function POST(req: Request) {
  try {
    // 20 uploads per hour per IP - generous for legitimate counter use,
    // enough to blunt automated abuse without needing a paid CAPTCHA service.
    const ip = getClientIp(req);
    const limit = await checkRateLimit("file-upload", ip, { maxAttempts: 20, windowMinutes: 60 });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many uploads from this location. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const claimedType = file.type === "image/jpg" ? "image/jpeg" : file.type;
    if (!ALLOWED_TYPES.includes(claimedType)) {
      return NextResponse.json({ error: "Only PDF, JPG, PNG, WEBP files are allowed" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File must be under 8 MB" }, { status: 400 });
    }

    const signatureCheck = await verifyFileSignature(file, claimedType);
    if (!signatureCheck.valid) {
      return NextResponse.json({ error: signatureCheck.reason }, { status: 400 });
    }

    // Optional (only runs if VIRUSTOTAL_API_KEY is set) - see fileValidation.ts
    const vtResult = await checkVirusTotal(file);
    if (vtResult.checked && vtResult.malicious) {
      console.error("Blocked malicious file upload:", vtResult.detail);
      return NextResponse.json({ error: "This file was flagged as unsafe and cannot be uploaded." }, { status: 400 });
    }

    const filename = `applications/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const saved = await saveFile(filename, file, claimedType);

    return NextResponse.json({ url: saved.url, type: claimedType });
  } catch (err: any) {
    console.error("Upload failed:", err);
    return NextResponse.json(
      { error: err.message || "File upload failed. You can still submit the registration without an attachment." },
      { status: 500 }
    );
  }
}
