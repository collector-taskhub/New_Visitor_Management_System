"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Users, CalendarCheck, Building2, Clock } from "lucide-react";
import DailyBriefing from "./DailyBriefing";

const COLORS = ["#14245c", "#f4941e", "#128a3e", "#d4af37", "#1e3a8a", "#e11d48", "#0891b2"];

export default function StatsCards({ role }: { role?: "PA" | "COLLECTOR" | "ADMIN" | "DEPARTMENT_OFFICER" }) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats").then((r) => r.json()).then(setStats);
  }, []);

  if (!stats) return <div className="text-sm text-gray-400 py-6">Loading dashboard...</div>;

  const showBriefing = role === "PA" || role === "COLLECTOR" || role === "ADMIN";

  return (
    <div className="space-y-6">
      {showBriefing && <DailyBriefing />}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card icon={<Users size={20} />} label="Total Applications" value={stats.total} color="bg-navy" />
        <Card icon={<CalendarCheck size={20} />} label="Today" value={stats.todayCount} color="bg-saffron" />
        <Card
          icon={<Clock size={20} />}
          label="Pending / In Progress"
          value={
            (stats.statusGroups.find((s: any) => s.status === "PENDING")?.count || 0) +
            (stats.statusGroups.find((s: any) => s.status === "IN_PROGRESS")?.count || 0)
          }
          color="bg-amber-500"
        />
        <Card
          icon={<Building2 size={20} />}
          label="Resolved"
          value={stats.statusGroups.find((s: any) => s.status === "RESOLVED")?.count || 0}
          color="bg-green"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl card-shadow p-5">
          <h3 className="font-semibold text-navy mb-3 text-sm">Last 7 Days — Visitor Registrations</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.last7Days}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#14245c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl card-shadow p-5">
          <h3 className="font-semibold text-navy mb-3 text-sm">By Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={stats.statusGroups}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry: any) => entry.status}
              >
                {stats.statusGroups.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {stats.deptGroups?.length > 0 && (
        <div className="bg-white rounded-2xl card-shadow p-5">
          <h3 className="font-semibold text-navy mb-3 text-sm">By Department</h3>
          <ResponsiveContainer width="100%" height={Math.max(220, stats.deptGroups.length * 32)}>
            <BarChart data={stats.deptGroups} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis type="category" dataKey="department" tick={{ fontSize: 10 }} width={160} />
              <Tooltip />
              <Bar dataKey="count" fill="#f4941e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function Card({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-2xl card-shadow p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl ${color} text-white flex items-center justify-center`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-navy">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}
