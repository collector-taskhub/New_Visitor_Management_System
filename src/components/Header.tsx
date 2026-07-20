"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Landmark, LogOut, Search, UserPlus } from "lucide-react";

export default function Header() {
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="tricolor-bar" />
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-navy flex items-center justify-center">
            <Landmark className="text-saffron" size={22} />
          </div>
          <div>
            <div className="font-bold text-navy leading-tight marathi text-lg">
              जिल्हाधिकारी कार्यालय, जालना
            </div>
            <div className="text-xs text-gray-500 leading-tight">
              District Collector Office, Jalna — Visitor Management System
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4 text-sm">
          <Link
            href="/track"
            className="hidden sm:flex items-center gap-1 text-navy hover:text-saffron font-medium"
          >
            <Search size={16} /> अर्ज ट्रॅक करा
          </Link>

          {!user && (
            <>
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg bg-navy text-white font-medium hover:bg-navy-light transition"
              >
                Staff Login
              </Link>
            </>
          )}

          {user && (
            <>
              <Link
                href="/dashboard"
                className="hidden sm:inline text-navy font-medium hover:text-saffron"
              >
                Dashboard
              </Link>
              <div className="hidden md:flex flex-col items-end text-xs text-gray-500 leading-tight">
                <span className="font-semibold text-navy">{user.name}</span>
                <span>{user.role?.replace("_", " ")}</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-navy text-navy hover:bg-navy hover:text-white transition"
              >
                <LogOut size={15} /> Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
