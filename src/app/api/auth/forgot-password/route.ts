import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendMail, resetPasswordEmail } from "@/lib/mailer";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  // Rate limit by IP (stop mass-triggering resets) AND by email (stop
  // hammering one account's inbox) - 5 attempts per 15 minutes each.
  const ip = getClientIp(req);
  const [ipLimit, emailLimit] = await Promise.all([
    checkRateLimit("forgot-password-ip", ip, { maxAttempts: 8, windowMinutes: 15 }),
    checkRateLimit("forgot-password-email", email.toLowerCase().trim(), { maxAttempts: 5, windowMinutes: 15 }),
  ]);
  if (!ipLimit.allowed || !emailLimit.allowed) {
    const retry = Math.max(ipLimit.retryAfterSeconds || 0, emailLimit.retryAfterSeconds || 0);
    return NextResponse.json(
      { error: `Too many attempts. Please try again in a few minutes.` },
      { status: 429, headers: { "Retry-After": String(retry) } }
    );
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  // Always return the same generic success message regardless of whether the
  // account exists - this is intentional (prevents attackers from using this
  // endpoint to discover which emails are registered), NOT a bug.
  if (!user) {
    return NextResponse.json({
      success: true,
      message: "If this email is registered, a reset link has been sent.",
    });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiry: expiry },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  try {
    await sendMail(user.email, "Password Reset - Jalna Collector Office VMS", resetPasswordEmail(user.name, resetUrl));
  } catch (e) {
    // Logged for the admin (visible in Vercel's Logs tab, and caught proactively
    // by /api/health - see SECURITY_AND_OPERATIONS.md). The response to the
    // PERSON stays generic on purpose: an error message that differs only for
    // existing accounts would let someone probe which emails are registered.
    console.error("Password reset email failed to send:", e);
  }

  return NextResponse.json({
    success: true,
    message: "If this email is registered, a reset link has been sent.",
  });
}
