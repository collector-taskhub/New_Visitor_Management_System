"use client";

import { useEffect, useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { format } from "date-fns";

export default function DailyBriefing() {
  const [content, setContent] = useState("");
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(force = false) {
    if (force) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/briefing${force ? "?refresh=true" : ""}`);
      const data = await res.json();
      setContent(data.content);
      setGeneratedAt(data.generatedAt);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="bg-gradient-to-br from-navy to-navy-light rounded-2xl p-5 text-white mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Sparkles size={16} className="text-saffron-light" />
          AI Daily Briefing
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing || loading}
          className="text-xs flex items-center gap-1 text-white/70 hover:text-white transition disabled:opacity-50"
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-white/60">Generating today's briefing...</div>
      ) : (
        <>
          <p className="marathi text-sm leading-relaxed">{content}</p>
          {generatedAt && (
            <p className="text-[10px] text-white/40 mt-2">
              Generated {format(new Date(generatedAt), "dd MMM, hh:mm a")}
            </p>
          )}
        </>
      )}
    </div>
  );
}
