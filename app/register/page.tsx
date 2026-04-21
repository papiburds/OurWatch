"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { registerUser } from "@/lib/auth";
import type { UserRole } from "@/lib/types";
import { useToast } from "@/app/toast-provider";

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,}$/;

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState<UserRole>("Citizen");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const fullName = String(formData.get("full_name") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirm_password") || "");
    const contactNumber = String(formData.get("contact_number") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const position = String(formData.get("position") || "").trim();

    if (!email.endsWith("@gmail.com")) {
      setError("Only @gmail.com email addresses are allowed.");
      setLoading(false);
      return;
    }

    if (!STRONG_PASSWORD_REGEX.test(password)) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.",
      );
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (role === "Citizen" && !contactNumber) {
      setError("Contact number is required for Citizen accounts.");
      setLoading(false);
      return;
    }

    try {
      await registerUser({
        fullName,
        email,
        password,
        role,
        contactNumber: contactNumber || undefined,
        address: address || undefined,
        position: position || undefined,
      });
      showToast("Account created successfully!", "success");
      router.push("/login");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed. Please review your details.";
      setError(message || "Registration failed. Please review your details.");
      showToast("Registration failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = {
    backgroundColor: "#0f1e3b",
    borderColor: "rgba(100,116,139,0.4)",
    color: "#ffffff",
  };

  const labelStyle = { color: "#94a3b8" };

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
        <div className="text-center mb-7">
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
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p style={{ color: "#94a3b8" }} className="text-sm mt-1">
            Join the community and help keep your area safe
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{ backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.4)", color: "#f87171" }}
            className="border rounded-xl px-4 py-3 text-sm font-medium mb-5"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label style={labelStyle} className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              name="full_name"
              type="text"
              required
              style={fieldStyle}
              className="w-full px-4 py-3 rounded-xl border text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="Juan dela Cruz"
            />
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle} className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              required
              style={fieldStyle}
              className="w-full px-4 py-3 rounded-xl border text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="you@gmail.com"
            />
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle} className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div
              style={{ backgroundColor: "#0f1e3b", borderColor: "rgba(100,116,139,0.4)" }}
              className="flex items-center rounded-xl border focus-within:ring-2 focus-within:ring-blue-500 transition"
            >
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                style={{ backgroundColor: "transparent", color: "#ffffff" }}
                className="flex-1 min-w-0 px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none rounded-xl"
                placeholder="Create a strong password"
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
            <p style={{ color: "#64748b" }} className="text-xs mt-1.5 leading-relaxed">
              Min. 8 characters · uppercase · lowercase · number · special character
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label style={labelStyle} className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <div
              style={{ backgroundColor: "#0f1e3b", borderColor: "rgba(100,116,139,0.4)" }}
              className="flex items-center rounded-xl border focus-within:ring-2 focus-within:ring-blue-500 transition"
            >
              <input
                name="confirm_password"
                type={showConfirmPassword ? "text" : "password"}
                required
                style={{ backgroundColor: "transparent", color: "#ffffff" }}
                className="flex-1 min-w-0 px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none rounded-xl"
                placeholder="Re-enter your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                style={{ color: "#64748b" }}
                className="px-4 text-xs font-bold uppercase hover:text-blue-400 transition shrink-0"
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Contact Number */}
          <div>
            <label style={labelStyle} className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
              Contact Number {role === "Citizen" && <span style={{ color: "#f87171" }}>*</span>}
            </label>
            <input
              name="contact_number"
              type="tel"
              required={role === "Citizen"}
              style={fieldStyle}
              className="w-full px-4 py-3 rounded-xl border text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="09XXXXXXXXX"
            />
          </div>

          {/* Address */}
          <div>
            <label style={labelStyle} className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
              Address
            </label>
            <input
              name="address"
              type="text"
              style={fieldStyle}
              className="w-full px-4 py-3 rounded-xl border text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="Street, Purok, Barangay"
            />
          </div>

          {/* Role */}
          <div>
            <label style={labelStyle} className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              style={fieldStyle}
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="Citizen">Citizen</option>
              <option value="Captain">Barangay Official (Captain)</option>
            </select>
          </div>

          {/* Position — shown only for Officials */}
          {role === "Captain" && (
            <div>
              <label style={labelStyle} className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                Position
              </label>
              <input
                name="position"
                type="text"
                style={fieldStyle}
                className="w-full px-4 py-3 rounded-xl border text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Barangay Captain"
                defaultValue="Barangay Captain"
              />
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: loading ? "#374151" : "#2563eb" }}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all mt-1 shadow-lg"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p style={{ color: "#94a3b8" }} className="text-center text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
