"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import StatusBadge from "./StatusBadge";
import { FileDown, RefreshCw, FileText, Paperclip, ChevronDown } from "lucide-react";

const STATUS_OPTIONS = [
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "PARTIALLY_RESOLVED",
  "RESOLVED",
  "CLOSED",
  "REJECTED",
];

export default function VisitorTable({ role }: { role: "PA" | "COLLECTOR" | "ADMIN" | "DEPARTMENT_OFFICER" }) {
  const canAssign = role === "PA" || role === "COLLECTOR" || role === "ADMIN";
  const canExport = canAssign;

  const [visitors, setVisitors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ date: "", status: "", search: "" });
  const [openRow, setOpenRow] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.date) params.set("date", filters.date);
    if (filters.status) params.set("status", filters.status);
    if (filters.search) params.set("search", filters.search);
    const res = await fetch(`/api/visitors?${params.toString()}`);
    const data = await res.json();
    setVisitors(data.visitors || []);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    load();
    fetch("/api/departments").then((r) => r.json()).then((d) => setDepartments(d.departments || []));
  }, [load]);

  async function updateStatus(id: string, status: string) {
    const remark = prompt("Add a remark for this status update (optional):") || undefined;
    await fetch(`/api/visitors/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, remark }),
    });
    load();
  }

  async function assign(id: string, departmentId: string) {
    await fetch(`/api/visitors/${id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ departmentId }),
    });
    load();
  }

  async function generateLetter(id: string) {
    try {
      const res = await fetch(`/api/visitors/${id}/letter`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Letter generation failed");
      await load();
      alert("पत्र तयार झाले! टोकन क्रमांकाशेजारी 📄 चिन्हावर क्लिक करून पहा.\nLetter generated! Click the 📄 icon next to the token number to view it.");
    } catch (err: any) {
      alert(`Letter generation failed: ${err.message}`);
    }
  }

  return (
    <div className="bg-white rounded-2xl card-shadow p-5">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="date"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={filters.date}
          onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
        />
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
        <input
          placeholder="Search name / mobile / token"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px]"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
        <button onClick={load} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50" title="Refresh">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>

        {canExport && (
          <div className="flex gap-2 ml-auto">
            
              href={`/api/reports/daily?type=excel&date=${filters.date || format(new Date(), "yyyy-MM-dd")}`}
              className="flex items-center gap-1 text-sm px-3 py-2 rounded-lg bg-green text-white hover:opacity-90"
            >
              <FileDown size={14} /> Excel
            </a>
            
              href={`/api/reports/daily?type=pdf&date=${filters.date || format(new Date(), "yyyy-MM-dd")}`}
              className="flex items-center gap-1 text-sm px-3 py-2 rounded-lg bg-navy text-white hover:opacity-90"
            >
              <FileDown size={14} /> PDF
            </a>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b">
              <th className="py-2 pr-3">Token</th>
              <th className="py-2 pr-3">Visitor</th>
              <th className="py-2 pr-3">Subject</th>
              <th className="py-2 pr-3">Dept.</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Visits</th>
              <th className="py-2 pr-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visitors.map((v) => (
              <tr key={v.id} className="border-b last:border-0 align-top hover:bg-gray-50/60">
                <td className="py-3 pr-3 font-medium text-navy whitespace-nowrap">
                  {v.tokenNo}
                  {v.attachmentUrl && (
                    <a href={v.attachmentUrl} target="_blank" rel="noreferrer" className="ml-1 text-gray-400 hover:text-navy inline-block align-middle" title="View Uploaded Application">
                      <Paperclip size={13} />
                    </a>
                  )}
                  {v.letterUrl && (
                    <a href={v.letterUrl} target="_blank" rel="noreferrer" className="ml-1 text-green-600 hover:text-green-800 inline-block align-middle" title="View Generated Letter">
                      <FileText size={13} />
                    </a>
                  )}
                  <div className="text-[11px] text-gray-400 font-normal">{format(new Date(v.createdAt), "dd MMM, hh:mm a")}</div>
                </td>
                <td className="py-3 pr-3">
                  <div className="font-medium">{v.name}</div>
                  <div className="text-xs text-gray-400">{v.mobile} • {v.village}, {v.taluka}</div>
                </td>
                <td className="py-3 pr-3 max-w-[220px]">
                  <div className="line-clamp-2">{v.subject}</div>
                  {v.aiSummary && <div className="text-[11px] text-gray-400 italic mt-1">AI: {v.aiSummary}</div>}
                </td>
                <td className="py-3 pr-3">
                  {canAssign ? (
                    <select
                      className="border border-gray-200 rounded-lg text-xs px-2 py-1"
                      value={v.assignedDepartmentId || ""}
                      onChange={(e) => assign(v.id, e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs">{v.assignedDepartment?.name || "-"}</span>
                  )}
                </td>
                <td className="py-3 pr-3"><StatusBadge status={v.status} /></td>
                <td className="py-3 pr-3 text-center">{v.visitCount}</td>
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-2">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setOpenRow(openRow === v.id ? null : v.id)}
                        className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
                      >
                        Update <ChevronDown size={12} />
                      </button>
                      {openRow === v.id && (
                        <div className="absolute right-0 z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-44 py-1">
                          {STATUS_OPTIONS.map((s) => (
                            <button
                              key={s}
                              onClick={() => { updateStatus(v.id, s); setOpenRow(null); }}
                              className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50"
                            >
                              {s.replace(/_/g, " ")}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {canAssign && (
                      <button
                        onClick={() => generateLetter(v.id)}
                        className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg bg-navy text-white hover:bg-navy-light transition"
                        title="Generate Marathi Forwarding Letter (Word)"
                      >
                        <FileText size={12} /> Letter
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {visitors.length === 0 && !loading && (
              <tr><td colSpan={7} className="text-center text-gray-400 py-8">No visitors found for the selected filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}