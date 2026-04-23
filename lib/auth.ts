import type { AppUser, UserRole } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// Auth client — talks to Next.js API routes backed by MySQL.
// ─────────────────────────────────────────────────────────────

async function requestJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    // API routes return { error } JSON — try to extract a readable message.
    try {
      const parsed = JSON.parse(text) as { error?: string };
      throw new Error(parsed.error || text || `Request failed (${res.status})`);
    } catch {
      throw new Error(text || `Request failed (${res.status})`);
    }
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function postJson<T>(url: string, body: unknown): Promise<T> {
  return requestJson<T>(url, { method: "POST", body: JSON.stringify(body) });
}

// ── Registration ────────────────────────────────────────────────────────────
export async function registerUser(input: {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  contactNumber?: string;
  address?: string;
}): Promise<AppUser> {
  return postJson<AppUser>("/api/register", input);
}

// ── Login ────────────────────────────────────────────────────────────────────
export async function loginUser(email: string, password: string): Promise<AppUser> {
  return postJson<AppUser>("/api/login", { email, password });
}

// ── Admin management (Captain-only for mutations) ───────────────────────────
export type AdminStatus = "Pending" | "Approved" | "Rejected";

export interface AdminUserEntry {
  uid: string;
  fullName: string;
  email: string;
  role: "Captain" | "Admin";
  status: AdminStatus;
  createdAt: string;
}

export async function createAdminUser(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<AdminUserEntry> {
  return postJson<AdminUserEntry>("/api/admin/users", input);
}

// Self-promotes the signed-in Approved Admin to Barangay Captain. Works only
// when the system currently has no Captain. See the server route for details.
export async function claimCaptainRole(): Promise<AdminUserEntry> {
  return postJson<AdminUserEntry>("/api/admin/users/bootstrap-captain", {});
}

export async function listAdminUsers(): Promise<AdminUserEntry[]> {
  return requestJson<AdminUserEntry[]>("/api/admin/users");
}

export async function setAdminStatus(
  uid: string,
  status: Exclude<AdminStatus, "Pending">,
): Promise<AdminUserEntry> {
  return requestJson<AdminUserEntry>(`/api/admin/users/${encodeURIComponent(uid)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export interface DeleteAdminResult {
  ok: true;
  selfRemoved: boolean;
  promoted: { uid: string; fullName: string; email: string } | null;
}

export async function deleteAdminUser(uid: string): Promise<DeleteAdminResult> {
  return requestJson<DeleteAdminResult>(
    `/api/admin/users/${encodeURIComponent(uid)}`,
    { method: "DELETE" },
  );
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
