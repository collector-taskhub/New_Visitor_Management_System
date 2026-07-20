"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Loader2, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email/password, or your account is pending approval.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-sm bg-white rounded-2xl card-shadow p-8">
          <h1 className="text-xl font-bold text-navy mb-1">Staff Login</h1>
          <p className="text-sm text-gray-500 mb-6">Collector / PA / Department Officer</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              required
              placeholder="Email"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              required
              placeholder="Password"
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
              {loading ? <Loader2 className="animate-spin" size={16} /> : <LogIn size={16} />}
              Login
            </button>
          </form>

          <div className="flex justify-between text-sm mt-5 text-navy">
            <Link href="/forgot-password" className="hover:underline">Forgot Password?</Link>
            <Link href="/register" className="hover:underline">New Staff Registration</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
