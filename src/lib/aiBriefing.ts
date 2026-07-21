import { prisma } from "./prisma";
import { subDays } from "date-fns";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Generates a short Marathi executive briefing for the Collector/PA summarizing
 * a given day's visitor registrations - total count, urgent cases, recurring
 * themes, and any backlog of old pending applications. Meant to be generated
 * once per day and cached (see the /api/dashboard/briefing route), not on
 * every dashboard page load.
 */
export async function generateDailyBriefing(dateKey: string): Promise<string> {
  const start = new Date(`${dateKey}T00:00:00`);
  const end = new Date(`${dateKey}T23:59:59`);

  const [todayVisitors, urgentToday, overduePending] = await Promise.all([
    prisma.visitor.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { assignedDepartment: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.visitor.count({
      where: { createdAt: { gte: start, lte: end }, aiUrgency: "URGENT" },
    }),
    prisma.visitor.count({
      where: {
        status: { in: ["PENDING", "ASSIGNED", "IN_PROGRESS"] },
        createdAt: { lt: subDays(new Date(), 7) },
      },
    }),
  ]);

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return `आज एकूण ${todayVisitors.length} अभ्यागत नोंदणीकृत झाले, त्यापैकी ${urgentToday} तातडीचे आहेत. सविस्तर AI सारांशासाठी GEMINI_API_KEY सेट करा.`;
  }

  if (todayVisitors.length === 0) {
    return `आज (${dateKey}) कोणत्याही अभ्यागताची नोंदणी झालेली नाही.${
      overduePending > 0 ? ` सूचना: ${overduePending} जुने अर्ज ७ दिवसांपेक्षा जास्त काळ प्रलंबित आहेत.` : ""
    }`;
  }

  const subjectList = todayVisitors
    .slice(0, 40)
    .map((v) => `- ${v.subject} (विभाग: ${v.assignedDepartment?.nameMarathi || "अद्याप नियुक्त नाही"}${v.aiUrgency === "URGENT" ? ", तातडीचे" : ""})`)
    .join("\n");

  const prompt = `You are writing a short daily briefing in MARATHI for the District Collector of Jalna, summarizing today's visitor registrations at the Collector's office.

Data for ${dateKey}:
- Total visitors today: ${todayVisitors.length}
- Flagged urgent today: ${urgentToday}
- Applications pending more than 7 days (all-time backlog, not just today): ${overduePending}
- Today's subjects and their assigned departments:
${subjectList}

Write a concise 3-5 sentence executive briefing in MARATHI for the Collector. Cover: total visitors today, how many need urgent attention and briefly why (if apparent), any notable recurring theme among today's visitors (e.g. many complaints about one topic or area), and a gentle note if there is a backlog of old pending applications worth reviewing. Plain professional sentences only, no markdown, no bullet points, no headings - just flowing Marathi prose a busy Collector can read in 15 seconds.`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!res.ok) {
      console.error("Briefing generation failed", res.status, await res.text());
      return `आज एकूण ${todayVisitors.length} अभ्यागत नोंदणीकृत झाले, त्यापैकी ${urgentToday} तातडीचे आहेत.`;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text || `आज एकूण ${todayVisitors.length} अभ्यागत नोंदणीकृत झाले, त्यापैकी ${urgentToday} तातडीचे आहेत.`;
  } catch (err) {
    console.error("Briefing generation error", err);
    return `आज एकूण ${todayVisitors.length} अभ्यागत नोंदणीकृत झाले, त्यापैकी ${urgentToday} तातडीचे आहेत.`;
  }
}
