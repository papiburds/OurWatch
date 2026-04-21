import type { AppUser, UserRole } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// Auth client — talks to Next.js API routes backed by MySQL.
// The API routes themselves are created in Phase 3 of the migration.
// Until then, these functions will throw a clear network error.
// ─────────────────────────────────────────────────────────────

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

// ── Registration ────────────────────────────────────────────────────────────
export async function registerUser(input: {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  contactNumber?: string;
  address?: string;
  position?: string;
}): Promise<AppUser> {
  return postJson<AppUser>("/api/register", input);
}

// ── Login ────────────────────────────────────────────────────────────────────
export async function loginUser(email: string, password: string): Promise<AppUser> {
  return postJson<AppUser>("/api/login", { email, password });
}

// ── Get current profile ──────────────────────────────────────────────────────
export async function getCurrentUserProfile(): Promise<AppUser | null> {
  try {
    const res = await fetch("/api/me", { credentials: "include" });
    if (!res.ok) return null;
    return (await res.json()) as AppUser;
  } catch {
    return null;
  }
}

// ── Update display name ──────────────────────────────────────────────────────
export async function updateUserName(fullName: string): Promise<void> {
  await postJson<{ ok: true }>("/api/profile/name", { fullName });
}

// ── Change password ──────────────────────────────────────────────────────────
export async function changePassword(newPassword: string): Promise<void> {
  await postJson<{ ok: true }>("/api/profile/password", { newPassword });
}

// ── Forgot password ──────────────────────────────────────────────────────────
export async function resetPassword(email: string): Promise<void> {
  await postJson<{ ok: true }>("/api/forgot-password", { email });
}

// ── Logout ───────────────────────────────────────────────────────────────────
export async function logoutUser(): Promise<void> {
  await fetch("/api/logout", { method: "POST", credentials: "include" });
}
