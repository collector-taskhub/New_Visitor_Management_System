"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Loader2, KeyRound } from "lucide-react";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl card-shadow p-8">
      <h1 className="text-xl font-bold text-navy mb-1">Reset Password</h1>
      <p className="text-sm text-gray-500 mb-6">Enter your new password.</p>
      {done ? (
        <p className="text-sm bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-3">
          Password reset successful. Redirecting to login...
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            required
            minLength={6}
            placeholder="New Password"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-navy text-white font-semibold py-3 rounded-xl hover:bg-navy-light transition disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <KeyRound size={16} />}
            Reset Password
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-14">
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
