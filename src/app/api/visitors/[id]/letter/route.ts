import { NextResponse } from "next/server";
import { saveFile } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/apiAuth";
import { generateMarathiLetter } from "@/lib/letterGenerator";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireRole(["PA", "COLLECTOR", "ADMIN"]);
  if (!user) return response;

  try {
    const { id } = await params;
    const visitor = await prisma.visitor.findUnique({
      where: { id },
      include: { assignedDepartment: true },
    });

    if (!visitor) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!visitor.assignedDepartment) {
      return NextResponse.json({ error: "Assign a department before generating the letter" }, { status: 400 });
    }

    const jaKrCounter = await prisma.auditLog.count({ where: { action: "LETTER_GENERATED" } });
    const jaKr = `जिका/जालना/तक्रार/${new Date().getFullYear()}/${String(jaKrCounter + 1).padStart(4, "0")}`;

    const today = new Date();
    const refDate = `${String(today.getDate()).padStart(2, "0")}/${String(
      today.getMonth() + 1
    ).padStart(2, "0")}/${today.getFullYear()}`;

    const pdfBytes = await generateMarathiLetter({
      tokenNo: visitor.tokenNo,
      refDate,
      departmentNameMarathi: visitor.assignedDepartment.nameMarathi,
      visitorName: visitor.name,
      visitorAddress: `${visitor.address}, ${visitor.village}, ता. ${visitor.taluka}, जि. ${visitor.district}`,
      subject: visitor.subject,
      aiSummary: visitor.aiSummary || undefined,
      jaKr,
    });

    const saved = await saveFile(
      `letters/${visitor.tokenNo.replace(/\//g, "-")}.pdf`,
      Buffer.from(pdfBytes),
      "application/pdf"
    );

    await prisma.visitor.update({
      where: { id },
      data: { letterGenerated: true, letterUrl: saved.url, letterGeneratedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: { visitorId: id, userId: user.id, action: "LETTER_GENERATED", details: jaKr },
    });

    return NextResponse.json({ success: true, letterUrl: saved.url });
  } catch (err: any) {
    console.error("Letter generation failed:", err);
    return NextResponse.json(
      { error: err.message || "Letter generation failed. Please try again." },
      { status: 500 }
    );
  }
}