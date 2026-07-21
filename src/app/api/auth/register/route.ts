import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

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
    // 5 registration attempts per hour per IP - staff registration is rare
    // (new employees only), so this comfortably covers legitimate use while
    // blocking automated spam-account creation.
    const ip = getClientIp(req);
    const limit = await checkRateLimit("staff-register", ip, { maxAttempts: 5, windowMinutes: 60 });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts from this location. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

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
