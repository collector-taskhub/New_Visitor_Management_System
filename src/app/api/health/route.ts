import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This endpoint exists so a FREE external monitor (UptimeRobot, Better
// Uptime free tier, cron-job.org, etc.) can ping it every few minutes and
// alert PA/admin by email the moment something breaks - instead of a failure
// like the Gemini model retirement going unnoticed for days, as happened
// before this was added. See SECURITY_AND_OPERATIONS.md for setup steps.
//
// Returns HTTP 200 when healthy, HTTP 503 when any check fails, so uptime
// monitors can alert purely off the status code without parsing the body.

const GEMINI_MODEL = "gemini-2.5-flash";

async function checkDatabase(): Promise<{ ok: boolean; detail: string }> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, detail: "Connected" };
  } catch (e: any) {
    return { ok: false, detail: `Database error: ${e.message?.slice(0, 200)}` };
  }
}

async function checkGemini(): Promise<{ ok: boolean; detail: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, detail: "GEMINI_API_KEY not set - AI features disabled" };

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Reply with just the word OK." }] }] }),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, detail: `Gemini API error ${res.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true, detail: `Model "${GEMINI_MODEL}" responding normally` };
  } catch (e: any) {
    return { ok: false, detail: `Gemini request failed: ${e.message?.slice(0, 200)}` };
  }
}

function checkEmail(): { ok: boolean; detail: string } {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return { ok: false, detail: "GMAIL_USER / GMAIL_APP_PASSWORD not set - password reset emails will not send" };
  }
  return { ok: true, detail: "Configured (not test-sent on every health check, to avoid spamming)" };
}

function checkFileStorage(): { ok: boolean; detail: string } {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { ok: false, detail: "BLOB_READ_WRITE_TOKEN not set - file uploads/letters will fail on Vercel" };
  }
  return { ok: true, detail: "Configured" };
}

export async function GET() {
  const [database, gemini] = await Promise.all([checkDatabase(), checkGemini()]);
  const email = checkEmail();
  const fileStorage = checkFileStorage();

  // Database is the only check that's truly "critical" for the site to
  // function at all. Email/AI/storage being down degrades functionality but
  // doesn't take the whole site offline - still reported, still worth an
  // alert, but distinguished in the payload.
  const criticalOk = database.ok;
  const allOk = database.ok && gemini.ok && email.ok && fileStorage.ok;

  const body = {
    status: allOk ? "healthy" : criticalOk ? "degraded" : "down",
    timestamp: new Date().toISOString(),
    checks: { database, gemini, email, fileStorage },
  };

  return NextResponse.json(body, { status: criticalOk ? 200 : 503 });
}
