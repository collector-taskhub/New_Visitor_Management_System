import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/apiAuth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireRole(["PA", "COLLECTOR", "ADMIN"]);
  if (!user) return response;

  const { id } = await params;
  const { active } = await req.json();

  const updated = await prisma.user.update({ where: { id }, data: { active: !!active } });

  return NextResponse.json({ success: true, user: { id: updated.id, active: updated.active } });
}
