import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/apiAuth";

const VALID_STATUSES = [
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "PARTIALLY_RESOLVED",
  "RESOLVED",
  "CLOSED",
  "REJECTED",
];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireRole(["PA", "COLLECTOR", "DEPARTMENT_OFFICER", "ADMIN"]);
  if (!user) return response;

  const { id } = await params;
  const { status, remark } = await req.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const visitor = await prisma.visitor.findUnique({ where: { id } });
  if (!visitor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Department officers may only update visitors assigned to their own department
  if (user.role === "DEPARTMENT_OFFICER" && visitor.assignedDepartmentId !== user.departmentId) {
    return NextResponse.json({ error: "You can only update applications assigned to your department" }, { status: 403 });
  }

  const updated = await prisma.visitor.update({
    where: { id },
    data: { status },
  });

  await prisma.statusLog.create({
    data: { visitorId: id, status, remark, updatedById: user.id },
  });
  await prisma.auditLog.create({
    data: { visitorId: id, userId: user.id, action: "STATUS_UPDATED", details: status },
  });

  return NextResponse.json({ success: true, visitor: updated });
}
