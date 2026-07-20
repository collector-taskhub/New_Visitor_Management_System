import { PDFDocument, rgb, StandardFonts, PageSizes } from "pdf-lib";
import type { VisitorReportRow } from "./excelReport";

export async function buildDailyVisitorPdf(
  rows: VisitorReportRow[],
  reportDateLabel: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage(PageSizes.A4.slice().reverse() as [number, number]); // landscape
  const { width, height } = page.getSize();
  const navy = rgb(0.05, 0.15, 0.35);
  const margin = 30;
  let y = height - 40;

  page.drawText(`District Collector Office, Jalna — Daily Visitor Report (${reportDateLabel})`, {
    x: margin,
    y,
    size: 14,
    font: boldFont,
    color: navy,
  });
  y -= 26;

  const cols = [
    { key: "tokenNo", label: "Token No", w: 90 },
    { key: "name", label: "Visitor Name", w: 100 },
    { key: "mobile", label: "Mobile", w: 70 },
    { key: "taluka", label: "Taluka", w: 65 },
    { key: "subject", label: "Subject", w: 170 },
    { key: "status", label: "Status", w: 75 },
    { key: "assignedDepartment", label: "Dept.", w: 110 },
    { key: "visitCount", label: "Visits", w: 40 },
    { key: "lastAssignedDepartment", label: "Last Assigned", w: 100 },
  ];

  const drawHeader = () => {
    let x = margin;
    page.drawRectangle({
      x: margin,
      y: y - 4,
      width: cols.reduce((a, c) => a + c.w, 0),
      height: 16,
      color: navy,
    });
    for (const c of cols) {
      page.drawText(c.label, { x: x + 2, y, size: 8, font: boldFont, color: rgb(1, 1, 1) });
      x += c.w;
    }
    y -= 18;
  };

  drawHeader();

  for (const r of rows) {
    if (y < 40) {
      page = pdfDoc.addPage(PageSizes.A4.slice().reverse() as [number, number]);
      y = height - 40;
      drawHeader();
    }
    let x = margin;
    const values: Record<string, string> = {
      tokenNo: r.tokenNo,
      name: r.name,
      mobile: r.mobile,
      taluka: r.taluka,
      subject: r.subject.slice(0, 60),
      status: r.status,
      assignedDepartment: r.assignedDepartment,
      visitCount: String(r.visitCount),
      lastAssignedDepartment: r.lastAssignedDepartment,
    };
    for (const c of cols) {
      page.drawText(values[c.key] || "-", {
        x: x + 2,
        y,
        size: 7.5,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      x += c.w;
    }
    y -= 14;
  }

  return pdfDoc.save();
}
