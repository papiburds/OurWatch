"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { loginUser } from "@/lib/auth";
import { useToast } from "@/app/toast-provider";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");

    try {
      const user = await loginUser(email, password);
      showToast("Login successful.", "success");
      router.push(user.role === "Captain" ? "/monitoring" : "/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Connection error. Please try again.";
      setError(message || "Invalid email or password.");
      showToast("Login failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ backgroundColor: "#0b1736", minHeight: "100vh" }}
      className="flex items-center justify-center px-4 py-10"
    >
      <div
        style={{ backgroundColor: "#1a2540", borderColor: "rgba(100,116,139,0.3)" }}
        className="w-full max-w-md rounded-2xl border shadow-2xl px-8 py-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
              src="/OurWatch_LOGO.png"
              alt="OurWatch"
              width={44}
              height={44}
              style={{ objectFit: "contain" }}
            />
            <span className="text-white text-2xl font-extrabold tracking-tight">OurWatch</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p style={{ color: "#94a3b8" }} className="text-sm mt-1">
            Sign in to your account to continue
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{ backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.4)", color: "#f87171" }}
            className="border rounded-xl px-4 py-3 text-sm text-center font-medium mb-5"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label style={{ color: "#94a3b8" }} className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              required
              style={{
                backgroundColor: "#0f1e3b",
                borderColor: "rgba(100,116,139,0.4)",
                color: "#ffffff",
              }}
              className="w-full px-4 py-3 rounded-xl border text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="you@gmail.com"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label style={{ color: "#94a3b8" }} className="text-xs font-semibold uppercase tracking-wider">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-blue-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div
              style={{
                backgroundColor: "#0f1e3b",
                borderColor: "rgba(100,116,139,0.4)",
              }}
              className="flex items-center rounded-xl border focus-within:ring-2 focus-within:ring-blue-500 transition"
            >
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                style={{ backgroundColor: "transparent", color: "#ffffff" }}
                className="flex-1 min-w-0 px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none rounded-xl"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{ color: "#64748b" }}
                className="px-4 text-xs font-bold uppercase hover:text-blue-400 transition shrink-0"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: loading ? "#374151" : "#2563eb" }}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all mt-2 shadow-lg"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p style={{ color: "#94a3b8" }} className="text-center text-sm mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-blue-400 font-semibold hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
