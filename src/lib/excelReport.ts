import ExcelJS from "exceljs";

export interface VisitorReportRow {
  tokenNo: string;
  date: string;
  name: string;
  mobile: string;
  village: string;
  taluka: string;
  district: string;
  subject: string;
  status: string;
  assignedDepartment: string;
  assignedOfficer: string;
  visitCount: number; // total times this mobile number has visited (all-time)
  lastVisitDate: string;
  lastAssignedDepartment: string;
}

export async function buildDailyVisitorExcel(
  rows: VisitorReportRow[],
  reportDateLabel: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Jalna Collector Office - Visitor Management System";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Daily Visitors", {
    views: [{ state: "frozen", ySplit: 2 }],
  });

  sheet.mergeCells("A1:N1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = `District Collector Office, Jalna — Daily Visitor Report (${reportDateLabel})`;
  titleCell.font = { bold: true, size: 14, color: { argb: "FF1B2A5B" } };
  titleCell.alignment = { horizontal: "center" };
  sheet.getRow(1).height = 26;

  const headers = [
    "Sr No",
    "Token No",
    "Date",
    "Visitor Name",
    "Mobile",
    "Village",
    "Taluka",
    "District",
    "Subject",
    "Status",
    "Assigned Department",
    "Assigned Officer",
    "Total Visits (all-time)",
    "Last Visit / Last Assigned Dept.",
  ];
  const headerRow = sheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1B2A5B" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });
  headerRow.height = 24;

  rows.forEach((r, i) => {
    const row = sheet.addRow([
      i + 1,
      r.tokenNo,
      r.date,
      r.name,
      r.mobile,
      r.village,
      r.taluka,
      r.district,
      r.subject,
      r.status,
      r.assignedDepartment,
      r.assignedOfficer,
      r.visitCount,
      `${r.lastVisitDate} — ${r.lastAssignedDepartment}`,
    ]);
    if (i % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF3F6FB" },
        };
      });
    }
  });

  sheet.columns.forEach((col, idx) => {
    const widths = [6, 20, 12, 22, 14, 16, 14, 14, 34, 16, 24, 20, 14, 30];
    col.width = widths[idx] || 16;
  });

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}
