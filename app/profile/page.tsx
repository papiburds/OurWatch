"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserProfile, updateUserName, changePassword } from "@/lib/auth";
import { useToast } from "@/app/toast-provider";
import AppShell from "@/app/components/AppShell";
import type { AppUser } from "@/lib/types";

const S = {
  page:   { backgroundColor: "var(--ow-bg)", minHeight: "100vh" },
  card:   { backgroundColor: "var(--ow-card)",   borderColor: "var(--ow-border)" },
  input:  { backgroundColor: "var(--ow-card-2)", borderColor: "var(--ow-border)", color: "var(--ow-text)" },
  text:   { color: "var(--ow-text)" },
  text2:  { color: "var(--ow-text-2)" },
  text3:  { color: "var(--ow-text-3)" },
  label:  { color: "var(--ow-text-2)" },
};

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,}$/;

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [user, setUser]           = useState<AppUser | null>(null);
  const [nameVal, setNameVal]     = useState("");
  const [nameLoading, setNL]      = useState(false);

  const [curPwd,  setCurPwd]      = useState("");
  const [newPwd,  setNewPwd]      = useState("");
  const [confPwd, setConfPwd]     = useState("");
  const [showCur, setShowCur]     = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [pwdLoading, setPL]       = useState(false);
  const [pwdError,  setPwdError]  = useState("");

  useEffect(() => {
    (async () => {
      const profile = await getCurrentUserProfile();
      if (!profile) { setTimeout(() => router.push("/login"), 0); return; }
      setUser(profile);
      setNameVal(profile.fullName);
    })().catch(() => undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Update name ── */
  const handleNameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameVal.trim()) return;
    setNL(true);
    try {
      await updateUserName(nameVal.trim());
      setUser((prev) => prev ? { ...prev, fullName: nameVal.trim() } : prev);
      showToast("Name updated successfully.", "success");
    } catch {
      showToast("Failed to update name.", "error");
    } finally {
      setNL(false);
    }
  };

  /* ── Change password ── */
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");

    if (!STRONG_PASSWORD_REGEX.test(newPwd)) {
      setPwdError("Password must be 8+ chars with uppercase, lowercase, number, and special character.");
      return;
    }
    if (newPwd !== confPwd) {
      setPwdError("New passwords do not match.");
      return;
    }

    setPL(true);
    try {
      await changePassword(newPwd);
      setCurPwd(""); setNewPwd(""); setConfPwd("");
      showToast("Password changed successfully.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to change password. Please try again.";
      setPwdError(message || "Failed to change password. Please try again.");
    } finally {
      setPL(false);
    }
  };

  const roleLabel = user?.role === "Captain" ? "Barangay Official" : "Citizen";
  const initials  = (user?.fullName || "U").split(" ").map((w) => w[0] || "").join("").toUpperCase().slice(0, 2);

  return (
    <div style={S.page}>
      <AppShell activePage="dashboard" />

      <main className="px-8 py-8 max-w-2xl mx-auto">
        {/* Title */}
        <div className="mb-7">
          <h2 style={S.text} className="text-3xl font-black tracking-tight">My Profile</h2>
          <p style={S.text2} className="text-sm mt-1">Manage your account information</p>
        </div>

        {/* Avatar card */}
        <div style={S.card} className="rounded-2xl border shadow-sm p-6 mb-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0"
            style={{ backgroundColor: "#2563eb" }}>
            {initials}
          </div>
          <div>
            <p style={S.text}  className="text-lg font-bold">{user?.fullName || "—"}</p>
            <p style={S.text3} className="text-sm">{user?.email || "—"}</p>
            <span className="inline-block mt-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: "var(--ow-badge-bg)", color: "var(--ow-badge-text)" }}>
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Update name */}
        <div style={S.card} className="rounded-2xl border shadow-sm p-6 mb-6">
          <h3 style={S.text} className="text-base font-bold mb-4">Display Name</h3>
          <form onSubmit={handleNameSave} className="flex gap-3">
            <input
              value={nameVal} onChange={(e) => setNameVal(e.target.value)} required
              style={S.input}
              className="flex-1 px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="Your full name"
            />
            <button type="submit" disabled={nameLoading}
              style={{ backgroundColor: nameLoading ? "#374151" : "var(--ow-accent)" }}
              className="px-6 py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition whitespace-nowrap">
              {nameLoading ? "Saving…" : "Save"}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div style={S.card} className="rounded-2xl border shadow-sm p-6">
          <h3 style={S.text} className="text-base font-bold mb-4">Change Password</h3>

          {pwdError && (
            <div style={{ backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.4)", color: "#f87171" }}
              className="border rounded-xl px-4 py-3 text-sm font-medium mb-4">
              {pwdError}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Current password — shown as info, not actually re-authenticated here.
                Firebase requires recent login for re-auth; we surface that error. */}
            {[
              { label: "New Password",     val: newPwd,  set: setNewPwd,  show: showNew,  setShow: setShowNew,  ph: "Create a strong password" },
              { label: "Confirm Password", val: confPwd, set: setConfPwd, show: showConf, setShow: setShowConf, ph: "Re-enter new password" },
            ].map((f) => (
              <div key={f.label}>
                <label style={S.label} className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                  {f.label}
                </label>
                <div style={{ backgroundColor: "var(--ow-card-2)", borderColor: "var(--ow-border)" }}
                  className="flex items-center rounded-xl border focus-within:ring-2 focus-within:ring-blue-500 transition">
                  <input
                    type={f.show ? "text" : "password"} required value={f.val}
                    onChange={(e) => f.set(e.target.value)}
                    style={{ backgroundColor: "transparent", color: "var(--ow-text)" }}
                    className="flex-1 min-w-0 px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none rounded-xl"
                    placeholder={f.ph}
                  />
                  <button type="button" onClick={() => f.setShow((v) => !v)}
                    style={{ color: "#64748b" }}
                    className="px-4 text-xs font-bold uppercase hover:text-blue-400 transition shrink-0">
                    {f.show ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            ))}

            <p style={S.text3} className="text-xs">
              Min. 8 characters · uppercase · lowercase · number · special character
            </p>

            <button type="submit" disabled={pwdLoading}
              style={{ backgroundColor: pwdLoading ? "#374151" : "var(--ow-accent)" }}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 active:scale-[0.99] transition">
              {pwdLoading ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>

        <footer style={S.text3} className="mt-10 text-center text-xs">
          © 2026 OurWatch. Empowering communities through real-time incident reporting.
        </footer>
      </main>
    </div>
  );
}
