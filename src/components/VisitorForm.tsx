"use client";

import { useState, useEffect } from "react";
import { JALNA_TALUKAS, MAHARASHTRA_DISTRICTS, OTHER_TALUKA, OTHER_DISTRICT } from "@/lib/masterData";
import { UploadCloud, CheckCircle2, Copy, Loader2 } from "lucide-react";

export default function VisitorForm() {
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    subject: "",
    address: "",
    village: "",
    taluka: "",
    district: "Jalna",
    otherTaluka: "",
    otherDistrict: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ tokenNo: string } | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name || !form.mobile || !form.subject || !form.address || !form.village || !form.taluka || !form.district) {
      setError("कृपया सर्व आवश्यक माहिती भरा / Please fill all required fields.");
      return;
    }
    if (!/^\d{10}$/.test(form.mobile)) {
      setError("कृपया वैध १० अंकी मोबाईल क्रमांक टाका / Please enter a valid 10-digit mobile number.");
      return;
    }

    setSubmitting(true);
    try {
      let attachmentUrl: string | undefined;
      let attachmentType: string | undefined;

      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const uploadRes = await fetch("/api/visitors/upload", { method: "POST", body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "File upload failed");
        attachmentUrl = uploadData.url;
        attachmentType = uploadData.type;
      }

      const taluka = form.taluka === OTHER_TALUKA ? form.otherTaluka : form.taluka;
      const district = form.district === OTHER_DISTRICT ? form.otherDistrict : form.district;

      const res = await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          mobile: form.mobile,
          subject: form.subject,
          address: form.address,
          village: form.village,
          taluka,
          district,
          attachmentUrl,
          attachmentType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setResult({ tokenNo: data.tokenNo });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="mx-auto text-green mb-4" size={56} />
        <h3 className="marathi text-lg font-bold text-navy mb-2">नोंदणी यशस्वी झाली!</h3>
        <p className="text-sm text-gray-500 mb-4">Your token number for tracking is:</p>
        <div className="inline-flex items-center gap-2 bg-navy text-white text-xl font-bold tracking-wider px-6 py-3 rounded-xl">
          {result.tokenNo}
          <button
            onClick={() => navigator.clipboard.writeText(result.tokenNo)}
            className="hover:text-saffron-light"
            title="Copy"
          >
            <Copy size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          कृपया हा टोकन क्रमांक जपून ठेवा. या क्रमांकाने आपण आपल्या अर्जाची सद्यस्थिती ऑनलाइन तपासू शकता.
        </p>
        <a
          href="/track"
          className="inline-block mt-5 px-5 py-2 rounded-lg border border-navy text-navy font-medium hover:bg-navy hover:text-white transition"
        >
          Track this application
        </a>
        <button
          onClick={() => {
            setResult(null);
            setForm({ ...form, name: "", mobile: "", subject: "", address: "", village: "" });
            setFile(null);
          }}
          className="block mx-auto mt-3 text-sm text-gray-400 underline"
        >
          Register another visitor
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="भेट देणाऱ्याचे पूर्ण नाव / Visitor Name *">
          <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="मोबाईल क्रमांक / Mobile Number *">
          <input
            className="input"
            maxLength={10}
            value={form.mobile}
            onChange={(e) => set("mobile", e.target.value.replace(/\D/g, ""))}
            placeholder="10-digit mobile number"
          />
        </Field>
      </div>

      <Field label="भेटीचा विषय / Subject for Meeting *">
        <textarea
          className="input min-h-[90px]"
          value={form.subject}
          onChange={(e) => set("subject", e.target.value)}
          placeholder="Briefly describe your grievance / application subject"
        />
      </Field>

      <Field label="पूर्ण पत्ता / Address *">
        <input className="input" value={form.address} onChange={(e) => set("address", e.target.value)} />
      </Field>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="गाव / Village *">
          <input className="input" value={form.village} onChange={(e) => set("village", e.target.value)} />
        </Field>

        <Field label="तालुका / Taluka *">
          <select className="input" value={form.taluka} onChange={(e) => set("taluka", e.target.value)}>
            <option value="">-- Select --</option>
            {JALNA_TALUKAS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
            <option value={OTHER_TALUKA}>Other Taluka</option>
          </select>
          {form.taluka === OTHER_TALUKA && (
            <input
              className="input mt-2"
              placeholder="Enter taluka name"
              value={form.otherTaluka}
              onChange={(e) => set("otherTaluka", e.target.value)}
            />
          )}
        </Field>

        <Field label="जिल्हा / District *">
          <select className="input" value={form.district} onChange={(e) => set("district", e.target.value)}>
            {MAHARASHTRA_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {form.district === OTHER_DISTRICT && (
            <input
              className="input mt-2"
              placeholder="Enter district name"
              value={form.otherDistrict}
              onChange={(e) => set("otherDistrict", e.target.value)}
            />
          )}
        </Field>
      </div>

      <Field label="अर्ज अपलोड करा (ऐच्छिक) / Upload Application (Optional, PDF/Image)">
        <label className="flex items-center gap-3 border-2 border-dashed border-gray-300 rounded-xl px-4 py-4 cursor-pointer hover:border-navy transition">
          <UploadCloud className="text-navy" size={22} />
          <span className="text-sm text-gray-500">
            {file ? file.name : "Click to choose a PDF or image file (max 8MB)"}
          </span>
          <input
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
      </Field>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-saffron hover:bg-saffron-light text-navy font-bold py-3 rounded-xl transition disabled:opacity-60"
      >
        {submitting && <Loader2 className="animate-spin" size={18} />}
        {submitting ? "नोंदणी करत आहे..." : "नोंदणी सबमिट करा / Submit Registration"}
      </button>

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #d8dce8;
          border-radius: 0.65rem;
          padding: 0.6rem 0.8rem;
          font-size: 0.9rem;
          outline: none;
          background: white;
        }
        .input:focus {
          border-color: var(--navy);
          box-shadow: 0 0 0 3px rgba(20, 36, 92, 0.1);
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
