import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/apiAuth";

// Edit a department's names, or activate/deactivate it - PA/Collector/Admin only
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireRole(["PA", "COLLECTOR", "ADMIN"]);
  if (!user) return response;

  const { id } = await params;
  const body = await req.json();
  const data: any = {};

  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.nameMarathi === "string" && body.nameMarathi.trim()) data.nameMarathi = body.nameMarathi.trim();
  if (typeof body.active === "boolean") data.active = body.active;

  try {
    const department = await prisma.department.update({ where: { id }, data });
    return NextResponse.json({ success: true, department });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Update failed" }, { status: 400 });
  }
}

// Delete a department - only allowed if nothing references it (no visitors ever
// assigned to it, no staff accounts under it). Otherwise, deactivate instead
// (PATCH with { active: false }), which hides it from dropdowns but keeps history intact.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireRole(["PA", "COLLECTOR", "ADMIN"]);
  if (!user) return response;

  const { id } = await params;

  const [visitorCount, userCount] = await Promise.all([
    prisma.visitor.count({ where: { assignedDepartmentId: id } }),
    prisma.user.count({ where: { departmentId: id } }),
  ]);

  if (visitorCount > 0 || userCount > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete: ${visitorCount} visitor record(s) and ${userCount} staff account(s) reference this department. Deactivate it instead to hide it without losing history.`,
      },
      { status: 400 }
    );
  }

  await prisma.department.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
