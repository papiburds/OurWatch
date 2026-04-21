"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { resetPassword } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await resetPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message || "No account found with that email address.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#0b1736", minHeight: "100vh" }}
      className="flex items-center justify-center px-4 py-10">
      <div style={{ backgroundColor: "#1a2540", borderColor: "rgba(100,116,139,0.3)" }}
        className="w-full max-w-md rounded-2xl border shadow-2xl px-8 py-10">

        {/* Header */}
        <div className="text-center mb-7">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image src="/OurWatch_LOGO.png" alt="OurWatch" width={44} height={44} style={{ objectFit: "contain" }} />
            <span className="text-white text-2xl font-extrabold tracking-tight">OurWatch</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Reset your password</h1>
          <p style={{ color: "#94a3b8" }} className="text-sm mt-1">
            Enter your email and we&apos;ll send a reset link
          </p>
        </div>

        {sent ? (
          /* ── Success state ── */
          <div className="text-center space-y-5">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ backgroundColor: "rgba(16,185,129,0.15)" }}>
              <svg className="w-8 h-8" style={{ color: "#10b981" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold">Check your inbox</p>
              <p style={{ color: "#94a3b8" }} className="text-sm mt-1">
                A reset link was sent to <span className="text-white font-medium">{email}</span>.
                Check your spam folder if you don&apos;t see it.
              </p>
            </div>
            <Link href="/login"
              className="inline-block w-full py-3 rounded-xl text-white font-semibold text-sm text-center hover:opacity-90 transition"
              style={{ backgroundColor: "#2563eb" }}>
              Back to Sign In
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            {error && (
              <div style={{ backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.4)", color: "#f87171" }}
                className="border rounded-xl px-4 py-3 text-sm font-medium mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label style={{ color: "#94a3b8" }} className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  style={{ backgroundColor: "#0f1e3b", borderColor: "rgba(100,116,139,0.4)", color: "#ffffff" }}
                  className="w-full px-4 py-3 rounded-xl border text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="you@gmail.com"
                />
              </div>

              <button type="submit" disabled={loading}
                style={{ backgroundColor: loading ? "#374151" : "#2563eb" }}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg">
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
            </form>

            <p style={{ color: "#94a3b8" }} className="text-center text-sm mt-6">
              Remember your password?{" "}
              <Link href="/login" className="text-blue-400 font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
