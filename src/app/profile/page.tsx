"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Loader2, Save, KeyRound, CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [designation, setDesignation] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordErr, setPasswordErr] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        setProfile(d);
        setName(d.name || "");
        setMobile(d.mobile || "");
        setDesignation(d.designation || "");
      });
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg("");
    setProfileErr("");
    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mobile, designation }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setProfileMsg("Profile updated successfully.");
    } catch (err: any) {
      setProfileErr(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg("");
    setPasswordErr("");

    if (newPassword !== confirmPassword) {
      setPasswordErr("New password and confirmation do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password change failed");
      setPasswordMsg(data.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordErr(err.message);
    } finally {
      setSavingPassword(false);
    }
  }

  if (!profile) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-navy" size={28} />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-10 w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">My Profile</h1>
          <p className="text-sm text-gray-500">Manage your account details and password</p>
        </div>

        <div className="bg-white rounded-2xl card-shadow p-6">
          <h2 className="font-semibold text-navy mb-4">Account Details</h2>
          <form onSubmit={saveProfile} className="space-y-3">
            <Field label="Full Name">
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Email (cannot be changed)">
              <input className="input bg-gray-50 text-gray-500" value={profile.email} disabled />
            </Field>
            <Field label="Mobile Number">
              <input className="input" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Field label="Designation">
              <input className="input" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Tahsildar" />
            </Field>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-500 pt-1">
              <div>Role: <span className="font-medium text-gray-700">{profile.role.replace("_", " ")}</span></div>
              <div>Department: <span className="font-medium text-gray-700">{profile.department || "-"}</span></div>
            </div>
            <p className="text-xs text-gray-400">Role and department can only be changed by the PA/Collector under Master Data.</p>

            {profileErr && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{profileErr}</p>}
            {profileMsg && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
                <CheckCircle2 size={16} /> {profileMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 bg-navy text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-navy-light transition disabled:opacity-60"
            >
              {savingProfile ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Save Changes
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl card-shadow p-6">
          <h2 className="font-semibold text-navy mb-4">Change Password</h2>
          <form onSubmit={changePassword} className="space-y-3">
            <Field label="Current Password">
              <input type="password" className="input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </Field>
            <Field label="New Password (min 6 characters)">
              <input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </Field>
            <Field label="Confirm New Password">
              <input type="password" className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </Field>

            {passwordErr && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{passwordErr}</p>}
            {passwordMsg && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
                <CheckCircle2 size={16} /> {passwordMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={savingPassword}
              className="flex items-center gap-2 bg-saffron text-navy font-bold px-5 py-2.5 rounded-lg hover:bg-saffron-light transition disabled:opacity-60"
            >
              {savingPassword ? <Loader2 className="animate-spin" size={16} /> : <KeyRound size={16} />}
              Change Password
            </button>
          </form>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
