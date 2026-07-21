import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateTokenNo } from "@/lib/tokenGenerator";
import { classifyVisitorApplication } from "@/lib/aiClassify";
import { fetchAttachmentBase64 } from "@/lib/fetchAttachment";
import { requireRole } from "@/lib/apiAuth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const registerSchema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(10).max(13),
  subject: z.string().min(5),
  address: z.string().min(3),
  village: z.string().min(1),
  taluka: z.string().min(1),
  district: z.string().min(1),
  attachmentUrl: z.string().optional(),
  attachmentType: z.string().optional(),
});

// PUBLIC: visitor self-registration counter
export async function POST(req: Request) {
  try {
    // Generous limit (60/hour per IP) because a real counter computer shares
    // one office IP and may register many genuine visitors in a busy hour -
    // this is meant to catch automated abuse, not slow down real staff.
    const ip = getClientIp(req);
    const limit = await checkRateLimit("visitor-register", ip, { maxAttempts: 60, windowMinutes: 60 });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many registrations from this location right now. Please wait a few minutes and try again." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const body = await req.json();
    const data = registerSchema.parse(body);

    const tokenNo = await generateTokenNo();

    const visitor = await prisma.visitor.create({
      data: {
        tokenNo,
        name: data.name,
        mobile: data.mobile,
        subject: data.subject,
        address: data.address,
        village: data.village,
        taluka: data.taluka,
        district: data.district,
        attachmentUrl: data.attachmentUrl,
        attachmentType: data.attachmentType,
        status: "PENDING",
      },
    });

    await prisma.statusLog.create({
      data: { visitorId: visitor.id, status: "PENDING", remark: "Visitor registered at counter" },
    });
    await prisma.auditLog.create({
      data: { visitorId: visitor.id, action: "REGISTERED", details: `Token ${tokenNo} issued` },
    });

    try {
      await classifyAndAssign(visitor.id, data.subject, data.attachmentUrl, data.attachmentType);
    } catch (e) {
      console.error("AI classification failed for", visitor.id, e);
    }

    return NextResponse.json({ success: true, tokenNo, visitorId: visitor.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Registration failed" }, { status: 400 });
  }
}

async function classifyAndAssign(
  visitorId: string,
  subject: string,
  attachmentUrl?: string,
  attachmentType?: string
) {
  let attachment = null;
  if (attachmentUrl && attachmentType) {
    const base64 = await fetchAttachmentBase64(attachmentUrl);
    if (base64) {
      attachment = { base64, mimeType: attachmentType };
    }
  }

  const result = await classifyVisitorApplication(subject, attachment);

  const dept = await prisma.department.findFirst({ where: { name: result.departmentName } });

  await prisma.visitor.update({
    where: { id: visitorId },
    data: {
      aiDepartmentGuess: result.departmentName,
      aiConfidence: result.confidence,
      aiSummary: result.summary,
      aiRawResponse: result.raw,
      aiUrgency: result.urgency,
      aiUrgencyReason: result.urgencyReason || null,
      assignedDepartmentId: dept?.id,
      status: dept ? "ASSIGNED" : "PENDING",
    },
  });

  if (dept) {
    await prisma.statusLog.create({
      data: {
        visitorId,
        status: "ASSIGNED",
        remark: `AI auto-assigned to ${result.departmentName} (confidence ${(result.confidence * 100).toFixed(0)}%)`,
      },
    });
    await prisma.auditLog.create({
      data: { visitorId, action: "AI_ASSIGNED", details: result.departmentName },
    });
  }

  if (result.urgency === "URGENT") {
    await prisma.auditLog.create({
      data: { visitorId, action: "AI_FLAGGED_URGENT", details: result.urgencyReason || undefined },
    });
  }
}

// STAFF: list visitors with filters - PA, Collector see all; Department officer sees only their department
export async function GET(req: Request) {
  const { user, response } = await requireRole(["PA", "COLLECTOR", "DEPARTMENT_OFFICER", "ADMIN"]);
  if (!user) return response;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const status = searchParams.get("status");
  const departmentId = searchParams.get("departmentId");
  const search = searchParams.get("search");
  const urgentOnly = searchParams.get("urgentOnly") === "true";
  const overdueOnly = searchParams.get("overdueOnly") === "true";

  const where: any = {};

  if (user.role === "DEPARTMENT_OFFICER" && user.departmentId) {
    where.assignedDepartmentId = user.departmentId;
  } else if (departmentId) {
    where.assignedDepartmentId = departmentId;
  }

  if (status) where.status = status;
  if (urgentOnly) where.aiUrgency = "URGENT";

  if (overdueOnly) {
    // "Overdue" = still open (not resolved/closed/rejected) and older than 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    where.status = { in: ["PENDING", "ASSIGNED", "IN_PROGRESS", "PARTIALLY_RESOLVED"] };
    where.createdAt = { lt: sevenDaysAgo };
  } else if (date) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59`);
    where.createdAt = { gte: start, lte: end };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { mobile: { contains: search } },
      { tokenNo: { contains: search, mode: "insensitive" } },
    ];
  }

  const visitors = await prisma.visitor.findMany({
    where,
    include: { assignedDepartment: true, assignedOfficer: true, urgencyReviewedBy: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const mobiles = [...new Set(visitors.map((v) => v.mobile))];
  const history = await prisma.visitor.findMany({
    where: { mobile: { in: mobiles } },
    include: { assignedDepartment: true },
    orderBy: { createdAt: "desc" },
  });

  const historyByMobile = new Map<string, typeof history>();
  for (const h of history) {
    const arr = historyByMobile.get(h.mobile) || [];
    arr.push(h);
    historyByMobile.set(h.mobile, arr);
  }

  const enriched = visitors.map((v) => {
    const all = historyByMobile.get(v.mobile) || [];
    const last = all[0];
    return {
      ...v,
      visitCount: all.length,
      lastVisitDate: last?.createdAt,
      lastAssignedDepartment: last?.assignedDepartment?.name || "-",
    };
  });

  return NextResponse.json({ visitors: enriched });
}
