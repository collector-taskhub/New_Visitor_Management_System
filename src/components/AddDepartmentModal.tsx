"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";

export default function AddDepartmentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (dept: { id: string; name: string; nameMarathi: string }) => void;
}) {
  const [name, setName] = useState("");
  const [nameMarathi, setNameMarathi] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !nameMarathi.trim()) {
      setError("Please fill both the English and Marathi names.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), nameMarathi: nameMarathi.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add department");
      onCreated(data.department);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
          <X size={18} />
        </button>
        <h3 className="font-bold text-navy text-lg mb-1">Add New Department</h3>
        <p className="text-xs text-gray-500 mb-4">
          Use this if your department isn't listed. It'll immediately appear in the dropdown.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Department Name (English) *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Forest Department"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Department Name (Marathi) *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={nameMarathi}
              onChange={(e) => setNameMarathi(e.target.value)}
              placeholder="उदा. वन विभाग"
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-saffron text-navy font-bold py-2.5 rounded-lg hover:bg-saffron-light transition disabled:opacity-60"
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            Add Department
          </button>
        </form>
      </div>
    </div>
  );
}
