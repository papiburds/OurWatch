import type { AppUser, Incident } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// Incidents client — talks to Next.js API routes backed by MySQL.
// The subscribe* functions use polling (MySQL has no realtime
// listener like Firestore). Default poll interval: 10 seconds.
// ─────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 10_000;

function byNewest(a: Incident, b: Incident): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

// ── Create ──────────────────────────────────────────────────────────────────
export async function createIncident(input: {
  user: AppUser;
  type: string;
  community: string;
  location: string;
  description: string;
  photoUrl?: string;
}): Promise<void> {
  const res = await fetch("/api/incidents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      type: input.type,
      community: input.community,
      location: input.location,
      description: input.description,
      photoUrl: input.photoUrl,
    }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `Failed to create incident (${res.status})`);
  }
}

// ── Upload photo to Cloudinary via our /api/upload route ────────────────────
export async function uploadIncidentPhoto(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `Upload failed (${res.status})`);
  }
  const { url } = (await res.json()) as { url: string };
  return url;
}

// ── Read ────────────────────────────────────────────────────────────────────
export async function getAllIncidents(): Promise<Incident[]> {
  const res = await fetch("/api/incidents", { credentials: "include" });
  if (!res.ok) return [];
  const list = (await res.json()) as Incident[];
  return list.sort(byNewest);
}

export async function getUserIncidents(userId: string): Promise<Incident[]> {
  const res = await fetch(`/api/incidents?userId=${encodeURIComponent(userId)}`, {
    credentials: "include",
  });
  if (!res.ok) return [];
  const list = (await res.json()) as Incident[];
  return list.sort(byNewest);
}

// ── Delete incident (Captain only) ──────────────────────────────────────────
// Permanently removes the report. Cascades to related rows so the citizen's
// records stop showing it as well.
export async function deleteIncident(incidentId: string): Promise<void> {
  const res = await fetch(`/api/incidents/${encodeURIComponent(incidentId)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `Failed to delete incident (${res.status})`);
  }
}

// ── Update status (Captain only) ────────────────────────────────────────────
export async function updateIncidentStatus(
  incidentId: string,
  status: Incident["status"],
  updateNote: string,
): Promise<void> {
  const res = await fetch(`/api/incidents/${encodeURIComponent(incidentId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status, updateNote }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `Failed to update incident (${res.status})`);
  }
}

// ── Subscribe via polling ───────────────────────────────────────────────────
// Replaces Firestore's realtime onSnapshot. Returns a cleanup function.
function pollIncidents(
  fetcher: () => Promise<Incident[]>,
  callback: (incidents: Incident[]) => void,
): () => void {
  let cancelled = false;

  const tick = async () => {
    if (cancelled) return;
    try {
      const data = await fetcher();
      if (!cancelled) callback(data);
    } catch {
      // Swallow errors — usually transient network / not-logged-in.
    }
  };

  void tick();
  const id = setInterval(tick, POLL_INTERVAL_MS);

  return () => {
    cancelled = true;
    clearInterval(id);
  };
}

export function subscribeToAllIncidents(
  callback: (incidents: Incident[]) => void,
): () => void {
  return pollIncidents(getAllIncidents, callback);
}

export function subscribeToUserIncidents(
  userId: string,
  callback: (incidents: Incident[]) => void,
): () => void {
  return pollIncidents(() => getUserIncidents(userId), callback);
}
