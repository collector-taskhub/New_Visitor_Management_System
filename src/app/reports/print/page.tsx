import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import PrintButton from "@/components/PrintButton";

export default async function PrintReportPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();
  const user = session?.user as any;
  if (!user || !["PA", "COLLECTOR", "ADMIN"].includes(user.role)) redirect("/login");

  const { date } = await searchParams;
  const reportDate = date || format(new Date(), "yyyy-MM-dd");

  const start = new Date(`${reportDate}T00:00:00`);
  const end = new Date(`${reportDate}T23:59:59`);

  const visitors = await prisma.visitor.findMany({
    where: { createdAt: { gte: start, lte: end } },
    include: { assignedDepartment: true, assignedOfficer: true },
    orderBy: { createdAt: "asc" },
  });

  const mobiles = [...new Set(visitors.map((v) => v.mobile))];
  const history = await prisma.visitor.findMany({
    where: { mobile: { in: mobiles } },
    select: { mobile: true },
  });
  const visitCountByMobile = new Map<string, number>();
  for (const h of history) {
    visitCountByMobile.set(h.mobile, (visitCountByMobile.get(h.mobile) || 0) + 1);
  }

  const STATUS_LABELS: Record<string, string> = {
    PENDING: "प्रलंबित",
    ASSIGNED: "नियुक्त",
    IN_PROGRESS: "कार्यवाही सुरू",
    PARTIALLY_RESOLVED: "अंशतः निकाली",
    RESOLVED: "निकाली",
    CLOSED: "बंद",
    REJECTED: "नाकारले",
  };

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8 print:px-0 print:py-0">
      <div className="flex justify-end mb-4 no-print">
        <PrintButton />
      </div>

      {/* Letterhead */}
      <div className="text-center mb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/letterhead.png" alt="Letterhead" className="mx-auto w-full max-w-[700px]" />
      </div>
      <div className="border-t-2 border-navy mb-3" />

      <div className="flex justify-between items-end mb-4 text-sm">
        <div className="font-bold text-navy text-base">दैनिक भेट नोंदणी अहवाल / Daily Visitor Report</div>
        <div>दिनांक / Date: <span className="font-semibold">{format(start, "dd/MM/yyyy")}</span></div>
      </div>

      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-navy text-white">
            <Th>अ.क्र.</Th>
            <Th>टोकन क्र.</Th>
            <Th>वेळ</Th>
            <Th>नाव</Th>
            <Th>मोबाईल</Th>
            <Th>गाव / तालुका</Th>
            <Th>विषय</Th>
            <Th>स्थिती</Th>
            <Th>नियुक्त विभाग</Th>
            <Th>एकूण भेटी</Th>
          </tr>
        </thead>
        <tbody>
          {visitors.map((v, i) => (
            <tr key={v.id} className={i % 2 === 1 ? "bg-gray-50" : ""}>
              <Td>{i + 1}</Td>
              <Td className="whitespace-nowrap font-medium">{v.tokenNo}</Td>
              <Td className="whitespace-nowrap">{format(v.createdAt, "hh:mm a")}</Td>
              <Td>{v.name}</Td>
              <Td className="whitespace-nowrap">{v.mobile}</Td>
              <Td>{v.village}, {v.taluka}</Td>
              <Td className="max-w-[220px]">{v.subject}</Td>
              <Td className="whitespace-nowrap">{STATUS_LABELS[v.status] || v.status}</Td>
              <Td>{v.assignedDepartment?.nameMarathi || v.assignedDepartment?.name || "-"}</Td>
              <Td className="text-center">{visitCountByMobile.get(v.mobile) || 1}</Td>
            </tr>
          ))}
          {visitors.length === 0 && (
            <tr>
              <Td colSpan={10} className="text-center py-6 text-gray-400">
                या दिनांकासाठी कोणतीही नोंदणी नाही / No registrations for this date.
              </Td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-6 text-xs text-gray-500 flex justify-between">
        <div>एकूण भेटी / Total visitors today: {visitors.length}</div>
        <div>Generated: {format(new Date(), "dd/MM/yyyy hh:mm a")}</div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4 landscape; margin: 12mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="border border-navy px-2 py-1.5 text-left font-semibold">{children}</th>;
}

function Td({ children, className = "", colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={`border border-gray-300 px-2 py-1.5 align-top ${className}`}>
      {children}
    </td>
  );
}
