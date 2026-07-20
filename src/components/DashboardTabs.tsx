"use client";

import { useState } from "react";
import StatsCards from "./StatsCards";
import VisitorTable from "./VisitorTable";
import PendingApprovals from "./PendingApprovals";
import { LayoutDashboard, Users, UserCheck } from "lucide-react";

export default function DashboardTabs({ role }: { role: "PA" | "COLLECTOR" | "ADMIN" }) {
  const [tab, setTab] = useState<"overview" | "visitors" | "staff">("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={15} /> },
    { id: "visitors", label: "Visitors", icon: <Users size={15} /> },
    { id: "staff", label: "Staff Approvals", icon: <UserCheck size={15} /> },
  ] as const;

  return (
    <div>
      <div className="flex gap-2 mb-6 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
              tab === t.id ? "border-saffron text-navy" : "border-transparent text-gray-400 hover:text-navy"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <StatsCards />}
      {tab === "visitors" && <VisitorTable role={role} />}
      {tab === "staff" && (
        <div className="bg-white rounded-2xl card-shadow p-5">
          <h3 className="font-semibold text-navy mb-3 text-sm">Pending Staff Registrations</h3>
          <PendingApprovals />
        </div>
      )}
    </div>
  );
}
