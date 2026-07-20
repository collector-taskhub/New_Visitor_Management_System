import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/apiAuth";
import { buildDailyVisitorExcel, type VisitorReportRow } from "@/lib/excelReport";
import { buildDailyVisitorPdf } from "@/lib/pdfReport";
import { format } from "date-fns";

export async function GET(req: Request) {
  const { user, response } = await requireRole(["PA", "COLLECTOR", "ADMIN"]);
  if (!user) return response;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");
  const type = searchParams.get("type") || "excel"; // excel | pdf

  const start = new Date(`${date}T00:00:00`);
  const end = new Date(`${date}T23:59:59`);

  const visitors = await prisma.visitor.findMany({
    where: { createdAt: { gte: start, lte: end } },
    include: { assignedDepartment: true, assignedOfficer: true },
    orderBy: { createdAt: "asc" },
  });

  const mobiles = [...new Set(visitors.map((v) => v.mobile))];
  const history = await prisma.visitor.findMany({
    where: { mobile: { in: mobiles } },
    include: { assignedDepartment: true },
    orderBy: { createdAt: "desc" },
  });
  const historyByMobile = new Map<string, typeof history>();
  for (const h of history) {
    const arr = historyByMobile.get(h.mobile) || [];
    arr.push(h);
    historyByMobile.set(h.mobile, arr);
  }

  const rows: VisitorReportRow[] = visitors.map((v) => {
    const all = historyByMobile.get(v.mobile) || [];
    const last = all[0];
    return {
      tokenNo: v.tokenNo,
      date: format(v.createdAt, "dd/MM/yyyy HH:mm"),
      name: v.name,
      mobile: v.mobile,
      village: v.village,
      taluka: v.taluka,
      district: v.district,
      subject: v.subject,
      status: v.status,
      assignedDepartment: v.assignedDepartment?.name || "-",
      assignedOfficer: v.assignedOfficer?.name || "-",
      visitCount: all.length,
      lastVisitDate: last ? format(last.createdAt, "dd/MM/yyyy") : "-",
      lastAssignedDepartment: last?.assignedDepartment?.name || "-",
    };
  });

  if (type === "pdf") {
    const pdfBytes = await buildDailyVisitorPdf(rows, date);
    return new NextResponse(new Blob([new Uint8Array(pdfBytes)]), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="visitor-report-${date}.pdf"`,
      },
    });
  }

  const excelBuffer = await buildDailyVisitorExcel(rows, date);
  return new NextResponse(new Blob([new Uint8Array(excelBuffer)]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="visitor-report-${date}.xlsx"`,
    },
  });
}
