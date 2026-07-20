import { NextResponse } from "next/server";
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
      active: u.active,
      createdAt: u.createdAt,
    })),
  });
}
