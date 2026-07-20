"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [departments, setDepartments] = useState<{ id: string; name: string; nameMarathi: string }[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    role: "DEPARTMENT_OFFICER",
    designation: "",
    departmentId: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then((d) => setDepartments(d.departments || []));
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setSuccess(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-md bg-white rounded-2xl card-shadow p-8">
          <h1 className="text-xl font-bold text-navy mb-1">Staff Registration</h1>
          <p className="text-sm text-gray-500 mb-6">
            New accounts require approval from the PA / Collector office before login.
          </p>

          {success ? (
            <div className="text-center py-6">
              <CheckCircle2 className="mx-auto text-green mb-3" size={44} />
              <p className="text-sm text-gray-700">{success}</p>
              <Link href="/login" className="inline-block mt-4 text-navy underline text-sm">
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required placeholder="Full Name" className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
              <input required type="email" placeholder="Email" className="input" value={form.email} onChange={(e) => set("email", e.target.value)} />
              <input required placeholder="Mobile Number" className="input" value={form.mobile} onChange={(e) => set("mobile", e.target.value.replace(/\D/g, ""))} maxLength={10} />
              <input required type="password" placeholder="Password (min 6 characters)" className="input" value={form.password} onChange={(e) => set("password", e.target.value)} />
              <input placeholder="Designation (e.g. Tahsildar)" className="input" value={form.designation} onChange={(e) => set("designation", e.target.value)} />

              <select className="input" value={form.role} onChange={(e) => set("role", e.target.value)}>
                <option value="DEPARTMENT_OFFICER">Department Officer</option>
                <option value="PA">Personal Assistant (PA)</option>
                <option value="COLLECTOR">Collector</option>
              </select>

              {form.role === "DEPARTMENT_OFFICER" && (
                <select required className="input" value={form.departmentId} onChange={(e) => set("departmentId", e.target.value)}>
                  <option value="">-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              )}

              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-saffron text-navy font-bold py-3 rounded-xl hover:bg-saffron-light transition disabled:opacity-60"
              >
                {loading && <Loader2 className="animate-spin" size={16} />}
                Register
              </button>
              <p className="text-center text-sm text-navy">
                <Link href="/login" className="hover:underline">Already have an account? Login</Link>
              </p>
            </form>
          )}
        </div>
      </main>
      <Footer />
      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #d8dce8;
          border-radius: 0.65rem;
          padding: 0.6rem 0.8rem;
          font-size: 0.9rem;
          outline: none;
        }
      `}</style>
    </>
  );
}
