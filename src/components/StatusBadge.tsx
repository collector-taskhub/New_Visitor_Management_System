const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700 border-gray-300",
  ASSIGNED: "bg-blue-50 text-blue-700 border-blue-300",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-300",
  PARTIALLY_RESOLVED: "bg-orange-50 text-orange-700 border-orange-300",
  RESOLVED: "bg-green-50 text-green-700 border-green-300",
  CLOSED: "bg-slate-100 text-slate-600 border-slate-300",
  REJECTED: "bg-red-50 text-red-700 border-red-300",
};

const STATUS_LABELS_MR: Record<string, string> = {
  PENDING: "प्रलंबित",
  ASSIGNED: "नियुक्त केले",
  IN_PROGRESS: "कार्यवाही सुरू",
  PARTIALLY_RESOLVED: "अंशतः निकाली",
  RESOLVED: "निकाली काढले",
  CLOSED: "बंद",
  REJECTED: "नाकारले",
};

export default function StatusBadge({ status, marathi = false }: { status: string; marathi?: boolean }) {
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
        STATUS_STYLES[status] || "bg-gray-100 text-gray-700 border-gray-300"
      }`}
    >
      {marathi ? STATUS_LABELS_MR[status] || status : status.replace(/_/g, " ")}
    </span>
  );
}
