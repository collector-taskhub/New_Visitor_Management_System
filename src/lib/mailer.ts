import nodemailer from "nodemailer";

// Uses a free Gmail account with an "App Password" (2FA required on that Gmail
// account - see DEPLOYMENT_GUIDE.md). Completely free, no card needed.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export class MailNotConfiguredError extends Error {
  constructor() {
    super("Email is not configured (GMAIL_USER / GMAIL_APP_PASSWORD missing).");
    this.name = "MailNotConfiguredError";
  }
}

/**
 * Sends an email. Throws MailNotConfiguredError if Gmail credentials aren't
 * set, and throws the underlying error if sending itself fails - callers
 * MUST handle these and tell the user clearly, rather than silently
 * pretending the email went out (that was the previous, broken behavior:
 * forgot-password would say "check your email" even when nothing was sent).
 */
export async function sendMail(to: string, subject: string, html: string) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error("GMAIL_USER / GMAIL_APP_PASSWORD not set - cannot send email");
    throw new MailNotConfiguredError();
  }
  await transporter.sendMail({
    from: `"Jalna Collector Office VMS" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

export function resetPasswordEmail(name: string, resetUrl: string) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto">
    <h2 style="color:#1B2A5B">Jalna Collector Office — Password Reset</h2>
    <p>Dear ${name},</p>
    <p>We received a request to reset your password for the Visitor Management System.</p>
    <p><a href="${resetUrl}" style="background:#1B2A5B;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Reset Password</a></p>
    <p>This link expires in 1 hour. If you did not request this, please ignore this email.</p>
  </div>`;
}

export function visitorStatusEmail(name: string, tokenNo: string, status: string, trackUrl: string) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto">
    <h2 style="color:#1B2A5B">Jalna Collector Office — Application Update</h2>
    <p>Dear ${name},</p>
    <p>Your application <b>${tokenNo}</b> status has been updated to: <b>${status}</b>.</p>
    <p><a href="${trackUrl}">Click here to track your application</a></p>
  </div>`;
}

export function staffApprovedEmail(name: string, loginUrl: string) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto">
    <h2 style="color:#1B2A5B">Jalna Collector Office — Account Approved</h2>
    <p>Dear ${name},</p>
    <p>Your staff account has been approved. You can now log in.</p>
    <p><a href="${loginUrl}" style="background:#1B2A5B;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Login</a></p>
  </div>`;
}
