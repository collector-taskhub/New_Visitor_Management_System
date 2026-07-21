import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/apiAuth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireRole(["PA", "COLLECTOR", "DEPARTMENT_OFFICER", "ADMIN"]);
  if (!user) return response;

  const { id } = await params;

  const visitor = await prisma.visitor.update({
    where: { id },
    data: {
      urgencyReviewed: true,
      urgencyReviewedById: user.id,
      urgencyReviewedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: { visitorId: id, userId: user.id, action: "URGENCY_REVIEWED", details: `Acknowledged by ${user.name}` },
  });

  return NextResponse.json({ success: true, visitor });
}
