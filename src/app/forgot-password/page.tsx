"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Loader2, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setMessage(data.message);
    setLoading(false);
  }

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-sm bg-white rounded-2xl card-shadow p-8">
          <h1 className="text-xl font-bold text-navy mb-1">Forgot Password</h1>
          <p className="text-sm text-gray-500 mb-6">Enter your registered email to receive a reset link.</p>

          {message ? (
            <p className="text-sm bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-3">
              {message}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                required
                placeholder="Registered Email"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-navy text-white font-semibold py-3 rounded-xl hover:bg-navy-light transition disabled:opacity-60"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />}
                Send Reset Link
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
