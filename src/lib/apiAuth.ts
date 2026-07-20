import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export type SessionUser = {
  id: string;
  role: "ADMIN" | "COLLECTOR" | "PA" | "DEPARTMENT_OFFICER";
  departmentId: string | null;
  departmentName: string | null;
  email: string;
  name: string;
};

export async function requireRole(allowed: SessionUser["role"][]) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  if (!allowed.includes(user.role)) {
    return { user: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user, response: null };
}
