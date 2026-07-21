import { NextResponse } from "next/server";
import { anonymizeOldRecords } from "@/lib/dataRetention";

// Called automatically once a day by Vercel Cron (free on the Hobby plan -
// see vercel.json). Protected by CRON_SECRET so a random visitor can't
// trigger it - Vercel automatically sends this header for cron-triggered
// requests when CRON_SECRET is set in environment variables.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await anonymizeOldRecords();
    console.log(`Data retention run: anonymized ${result.anonymizedCount} record(s)`);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error("Data retention job failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
