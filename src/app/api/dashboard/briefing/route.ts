import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/apiAuth";
import { generateDailyBriefing } from "@/lib/aiBriefing";
import { format } from "date-fns";

// Cached per day - regenerating the briefing on every dashboard visit would
// waste Gemini calls for no benefit, since the underlying data (and the
// summary of it) only meaningfully changes a few times a day at most.
// Pass ?refresh=true to force regeneration (used by the Refresh button).
export async function GET(req: Request) {
  const { user, response } = await requireRole(["PA", "COLLECTOR", "ADMIN"]);
  if (!user) return response;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");
  const forceRefresh = searchParams.get("refresh") === "true";

  if (!forceRefresh) {
    const cached = await prisma.dailyBriefing.findUnique({ where: { date } });
    if (cached) {
      return NextResponse.json({ content: cached.content, generatedAt: cached.generatedAt, cached: true });
    }
  }

  const content = await generateDailyBriefing(date);
  const saved = await prisma.dailyBriefing.upsert({
    where: { date },
    update: { content, generatedAt: new Date() },
    create: { date, content },
  });

  return NextResponse.json({ content: saved.content, generatedAt: saved.generatedAt, cached: false });
}
