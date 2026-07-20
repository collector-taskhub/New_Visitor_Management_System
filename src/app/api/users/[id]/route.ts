import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/apiAuth";

// Edit a staff account - name, role, department, designation, active status
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireRole(["PA", "COLLECTOR", "ADMIN"]);
  if (!user) return response;

  const { id } = await params;
  const body = await req.json();
  const data: any = {};

  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.designation === "string") data.designation = body.designation.trim();
  if (["ADMIN", "COLLECTOR", "PA", "DEPARTMENT_OFFICER"].includes(body.role)) data.role = body.role;
  if (typeof body.active === "boolean") data.active = body.active;
  if (body.role === "DEPARTMENT_OFFICER") {
    data.departmentId = body.departmentId || null;
  } else if (body.role) {
    data.departmentId = null;
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data,
      include: { department: true },
    });
    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        designation: updated.designation,
        department: updated.department?.name || null,
        departmentId: updated.departmentId,
        active: updated.active,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Update failed" }, { status: 400 });
  }
}

// Delete a staff account - PA/Collector/Admin only, cannot delete your own account
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireRole(["PA", "COLLECTOR", "ADMIN"]);
  if (!user) return response;

  const { id } = await params;

  if (id === user.id) {
    return NextResponse.json({ error: "You cannot delete your own account while logged in as it." }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
