import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/apiAuth";

export async function GET(req: Request) {
  const { user, response } = await requireRole(["PA", "COLLECTOR", "ADMIN"]);
  if (!user) return response;

  const { searchParams } = new URL(req.url);
  const pendingOnly = searchParams.get("pending") === "true";

  const users = await prisma.user.findMany({
    where: pendingOnly ? { active: false } : {},
    include: { department: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      designation: u.designation,
      department: u.department?.name || null,
      departmentId: u.departmentId,
      active: u.active,
      createdAt: u.createdAt,
    })),
  });
}

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  mobile: z.string().min(10).max(13),
  password: z.string().min(6),
  role: z.enum(["COLLECTOR", "PA", "DEPARTMENT_OFFICER", "ADMIN"]),
  designation: z.string().optional(),
  departmentId: z.string().optional(),
});

// PA/Collector directly adding a staff account - activates it immediately,
// skipping the self-registration approval queue (that queue is for when staff
// register themselves; this is for when the PA sets an account up on their behalf).
export async function POST(req: Request) {
  const { user, response } = await requireRole(["PA", "COLLECTOR", "ADMIN"]);
  if (!user) return response;

  try {
    const data = createSchema.parse(await req.json());

    if (data.role === "DEPARTMENT_OFFICER" && !data.departmentId) {
      return NextResponse.json({ error: "Department is required for department officer accounts" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        mobile: data.mobile,
        passwordHash,
        role: data.role,
        designation: data.designation,
        departmentId: data.role === "DEPARTMENT_OFFICER" ? data.departmentId : null,
        active: true,
      },
    });

    return NextResponse.json({ success: true, userId: newUser.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create staff account" }, { status: 400 });
  }
}
