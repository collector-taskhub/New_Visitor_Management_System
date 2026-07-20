"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export default function PendingApprovals() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/users?pending=true");
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string, active: boolean) {
    await fetch(`/api/users/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    load();
  }

  if (loading) return <div className="text-sm text-gray-400 py-4">Loading...</div>;
  if (users.length === 0) return <div className="text-sm text-gray-400 py-4">No pending staff registrations.</div>;

  return (
    <div className="space-y-3">
      {users.map((u) => (
        <div key={u.id} className="flex items-center justify-between border rounded-xl px-4 py-3">
          <div>
            <div className="font-medium text-navy">{u.name} <span className="text-xs text-gray-400">({u.role.replace("_", " ")})</span></div>
            <div className="text-xs text-gray-500">{u.email} {u.department ? `• ${u.department}` : ""} {u.designation ? `• ${u.designation}` : ""}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => approve(u.id, true)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green text-white hover:opacity-90">
              <CheckCircle2 size={14} /> Approve
            </button>
            <button onClick={() => approve(u.id, false)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50">
              <XCircle size={14} /> Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
