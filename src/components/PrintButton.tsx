"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print flex items-center gap-2 bg-navy text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-navy-light transition"
    >
      <Printer size={16} /> Print / Save as PDF
    </button>
  );
}
