import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendMail, resetPasswordEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  // Always return success (don't reveal whether an email exists - basic security practice)
  if (!user) {
    return NextResponse.json({
      success: true,
      message: "If this email is registered, a reset link has been sent.",
    });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiry: expiry },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  try {
    await sendMail(user.email, "Password Reset - Jalna Collector Office VMS", resetPasswordEmail(user.name, resetUrl));
  } catch (e) {
    console.error("Email send failed", e);
  }

  return NextResponse.json({
    success: true,
    message: "If this email is registered, a reset link has been sent.",
  });
}
