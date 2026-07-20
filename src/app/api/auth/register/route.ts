import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  mobile: z.string().min(10).max(13),
  password: z.string().min(6),
  role: z.enum(["COLLECTOR", "PA", "DEPARTMENT_OFFICER"]),
  designation: z.string().optional(),
  departmentId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    if (data.role === "DEPARTMENT_OFFICER" && !data.departmentId) {
      return NextResponse.json(
        { error: "Department is required for department officer accounts" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    // New self-registered accounts are inactive until approved by PA/Collector,
    // EXCEPT there must always be at least one active COLLECTOR/PA seeded via `npm run seed`.
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        mobile: data.mobile,
        passwordHash,
        role: data.role,
        designation: data.designation,
        departmentId: data.role === "DEPARTMENT_OFFICER" ? data.departmentId : null,
        active: false,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Registration successful. Your account is pending approval by the PA/Collector office. You will be able to log in once approved.",
      userId: user.id,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Registration failed" }, { status: 400 });
  }
}
