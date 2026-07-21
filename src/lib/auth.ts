import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { checkRateLimit } from "./rateLimit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, request) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        // Brute-force protection: 10 attempts per 15 minutes, tracked per
        // email (stops targeted password guessing against one account) AND
        // per IP (stops one source hammering many accounts). No external
        // service needed - same DB-backed limiter used elsewhere.
        const ip = request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        const [emailLimit, ipLimit] = await Promise.all([
          checkRateLimit("login-email", email.toLowerCase().trim(), { maxAttempts: 10, windowMinutes: 15 }),
          checkRateLimit("login-ip", ip, { maxAttempts: 30, windowMinutes: 15 }),
        ]);
        if (!emailLimit.allowed || !ipLimit.allowed) {
          console.warn(`Login rate limit hit for email=${email} ip=${ip}`);
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
          include: { department: true },
        });
        if (!user || !user.active) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
          departmentName: user.department?.name || null,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.departmentId = (user as any).departmentId;
        token.departmentName = (user as any).departmentName;
        token.id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).departmentId = token.departmentId;
        (session.user as any).departmentName = token.departmentName;
      }
      return session;
    },
  },
});
