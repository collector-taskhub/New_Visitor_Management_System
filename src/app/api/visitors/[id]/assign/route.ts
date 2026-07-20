import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/apiAuth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireRole(["PA", "COLLECTOR", "ADMIN"]);
  if (!user) return response;

  const { id } = await params;
  const { departmentId, officerId, remark } = await req.json();

  if (!departmentId) {
    return NextResponse.json({ error: "departmentId is required" }, { status: 400 });
  }

  const dept = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!dept) return NextResponse.json({ error: "Department not found" }, { status: 404 });

  const visitor = await prisma.visitor.update({
    where: { id },
    data: {
      assignedDepartmentId: departmentId,
      assignedOfficerId: officerId || null,
      status: "ASSIGNED",
    },
  });

  await prisma.statusLog.create({
    data: {
      visitorId: id,
      status: "ASSIGNED",
      remark: remark || `Manually (re)assigned to ${dept.name} by ${user.name}`,
      updatedById: user.id,
    },
  });
  await prisma.auditLog.create({
    data: { visitorId: id, userId: user.id, action: "REASSIGNED", details: dept.name },
  });

  return NextResponse.json({ success: true, visitor });
}
