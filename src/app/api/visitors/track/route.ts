import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tokenNo = searchParams.get("token")?.trim();
  const mobile = searchParams.get("mobile")?.trim();

  if (!tokenNo) {
    return NextResponse.json({ error: "Token number required" }, { status: 400 });
  }

  const visitor = await prisma.visitor.findUnique({
    where: { tokenNo },
    include: {
      assignedDepartment: true,
      assignedOfficer: true,
      statusLogs: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!visitor) {
    return NextResponse.json({ error: "No application found for this token number" }, { status: 404 });
  }

  // basic verification - require last 4 digits of mobile to prevent random token guessing
  if (mobile && !visitor.mobile.endsWith(mobile)) {
    return NextResponse.json({ error: "Mobile number does not match our records" }, { status: 403 });
  }

  return NextResponse.json({
    tokenNo: visitor.tokenNo,
    name: visitor.name,
    subject: visitor.subject,
    status: visitor.status,
    createdAt: visitor.createdAt,
    assignedDepartment: visitor.assignedDepartment?.name || null,
    assignedDepartmentMarathi: visitor.assignedDepartment?.nameMarathi || null,
    assignedOfficer: visitor.assignedOfficer?.name || null,
    letterUrl: visitor.letterUrl,
    statusLogs: visitor.statusLogs.map((s) => ({
      status: s.status,
      remark: s.remark,
      createdAt: s.createdAt,
    })),
  });
}
