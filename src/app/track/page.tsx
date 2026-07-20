"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StatusBadge from "@/components/StatusBadge";
import { Search, FileDown, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function TrackPage() {
  const [tokenNo, setTokenNo] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setData(null);
    if (!tokenNo) {
      setError("Please enter your token number");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ token: tokenNo.trim() });
      if (mobile) params.set("mobile", mobile.trim());
      const res = await fetch(`/api/visitors/track?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Not found");
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-10 w-full">
        <div className="bg-white rounded-2xl card-shadow p-6 sm:p-8">
          <h1 className="marathi text-xl font-bold text-navy mb-1">आपल्या अर्जाची स्थिती तपासा</h1>
          <p className="text-sm text-gray-500 mb-6">Track Your Application Status</p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-2">
            <input
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm"
              placeholder="Token Number e.g. JLN/20260720/0001"
              value={tokenNo}
              onChange={(e) => setTokenNo(e.target.value)}
            />
            <input
              className="sm:w-40 border border-gray-300 rounded-xl px-4 py-3 text-sm"
              placeholder="Mobile (optional)"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
              maxLength={10}
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-navy text-white px-5 py-3 rounded-xl font-medium hover:bg-navy-light transition"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
              Track
            </button>
          </form>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">
              {error}
            </p>
          )}

          {data && (
            <div className="mt-6 border-t pt-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="font-bold text-navy text-lg">{data.tokenNo}</div>
                  <div className="text-sm text-gray-500">{data.name}</div>
                </div>
                <StatusBadge status={data.status} marathi />
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mt-5 text-sm">
                <InfoRow label="Registered On" value={format(new Date(data.createdAt), "dd MMM yyyy, hh:mm a")} />
                <InfoRow label="Subject" value={data.subject} />
                <InfoRow label="Assigned Department" value={data.assignedDepartmentMarathi || data.assignedDepartment || "Not yet assigned"} />
                <InfoRow label="Assigned Officer" value={data.assignedOfficer || "—"} />
              </div>

              {data.letterUrl && (
                <a
                  href={data.letterUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-green text-green font-medium hover:bg-green hover:text-white transition"
                >
                  <FileDown size={16} /> Download Forwarding Letter (PDF)
                </a>
              )}

              <div className="mt-6">
                <div className="text-sm font-semibold text-navy mb-3">Status History</div>
                <ol className="relative border-l-2 border-navy/20 ml-2 space-y-4">
                  {data.statusLogs.map((log: any, i: number) => (
                    <li key={i} className="ml-4">
                      <div className="absolute w-2.5 h-2.5 bg-saffron rounded-full -left-[5px] mt-1.5" />
                      <div className="text-xs text-gray-400">
                        {format(new Date(log.createdAt), "dd MMM yyyy, hh:mm a")}
                      </div>
                      <div className="text-sm font-medium text-navy">{log.status.replace(/_/g, " ")}</div>
                      {log.remark && <div className="text-xs text-gray-500">{log.remark}</div>}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="font-medium text-gray-800">{value}</div>
    </div>
  );
}
