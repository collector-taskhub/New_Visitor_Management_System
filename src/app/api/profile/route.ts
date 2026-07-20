import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/apiAuth";

const ANY_ROLE: ("ADMIN" | "COLLECTOR" | "PA" | "DEPARTMENT_OFFICER")[] = [
  "ADMIN",
  "COLLECTOR",
  "PA",
  "DEPARTMENT_OFFICER",
];

export async function GET() {
  const { user, response } = await requireRole(ANY_ROLE);
  if (!user) return response;

  const me = await prisma.user.findUnique({
    where: { id: user.id },
    include: { department: true },
  });
  if (!me) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    name: me.name,
    email: me.email,
    mobile: me.mobile,
    designation: me.designation,
    role: me.role,
    department: me.department?.name || null,
  });
}

export async function PATCH(req: Request) {
  const { user, response } = await requireRole(ANY_ROLE);
  if (!user) return response;

  const body = await req.json();
  const data: any = {};

  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.mobile === "string" && body.mobile.trim()) data.mobile = body.mobile.trim();
  if (typeof body.designation === "string") data.designation = body.designation.trim();
  // Intentionally NOT allowed here: email, role, department, active - those stay
  // under PA/Collector control via Master Data, so a compromised or careless
  // self-edit can't quietly change permissions or reassign departments.

  try {
    const updated = await prisma.user.update({ where: { id: user.id }, data });
    return NextResponse.json({ success: true, name: updated.name, mobile: updated.mobile, designation: updated.designation });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Update failed" }, { status: 400 });
  }
}
