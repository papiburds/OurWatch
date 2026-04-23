"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getCurrentUserProfile } from "@/lib/auth";
import { subscribeToAllIncidents, subscribeToUserIncidents } from "@/lib/incidents";
import type { Incident } from "@/lib/types";

/* ── Types ── */
export type NotifStatus = "new" | "Pending" | "Verified" | "Resolved" | "Rejected";

export interface NotifItem {
  id: string;
  reportId: string;
  status: NotifStatus;
  title: string;
  detail: string;
  photoUrl?: string;
  timestamp: string;
  read: boolean;
}

interface NotifCtxValue {
  notifications: NotifItem[];
  unreadCount: number;
  markAllRead: () => void;
  markOneRead: (id: string) => void;
  clearAll: () => void;
}

const NotifCtx = createContext<NotifCtxValue>({
  notifications: [],
  unreadCount: 0,
  markAllRead: () => {},
  markOneRead: () => {},
  clearAll: () => {},
});

/* ── Helpers ── */
const STORAGE_KEY = "ow_notifications";

function loadStored(): NotifItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as NotifItem[]) : [];
  } catch {
    return [];
  }
}

function save(items: NotifItem[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 60)));
  } catch {}
}

const STATUS_TITLES: Record<string, string> = {
  new:      "New incident reported",
  Pending:  "Incident marked Pending",
  Verified: "Incident Verified",
  Resolved: "Incident Resolved ✓",
  Rejected: "Incident Rejected ✕",
};

/* ── Provider ── */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotifItem[]>(loadStored);
  const prevMap = useRef<Map<string, string>>(new Map()); // id → status
  const initialized = useRef(false);
  // Current user role — used to decide whether "new incident" pings fire.
  // Only administrative users (Captain or Admin) should receive notifications
  // when a fresh report appears; citizens only get status-change notifications
  // (approved / rejected / resolved).
  const roleRef = useRef<"Captain" | "Admin" | "Citizen" | null>(null);

  const addNotifs = useCallback((items: NotifItem[]) => {
    if (items.length === 0) return;
    setNotifications((prev) => {
      const next = [...items, ...prev].slice(0, 60);
      save(next);
      return next;
    });
  }, []);

  const handleSnapshot = useCallback(
    (reports: Incident[]) => {
      if (!initialized.current) {
        // First fire — record current state silently
        for (const r of reports) prevMap.current.set(r.id, r.status);
        initialized.current = true;
        return;
      }

      const newItems: NotifItem[] = [];
      const now = new Date().toISOString();

      for (const r of reports) {
        const prev = prevMap.current.get(r.id);

        if (prev === undefined) {
          // Brand-new incident — only officials should be alerted.
          // Citizens intentionally receive no notification on their own
          // submission; they only see updates when the report status
          // changes (Verified / Resolved / Rejected).
          if (roleRef.current === "Captain" || roleRef.current === "Admin") {
            newItems.push({
              id: `${r.id}-new-${Date.now()}`,
              reportId: r.id,
              status: "new",
              title: STATUS_TITLES.new,
              detail: `${r.type} — ${r.description.slice(0, 70)}`,
              photoUrl: r.photoUrl,
              timestamp: now,
              read: false,
            });
          }
        } else if (prev !== r.status) {
          // Status changed
          newItems.push({
            id: `${r.id}-${r.status}-${Date.now()}`,
            reportId: r.id,
            status: r.status as NotifStatus,
            title: STATUS_TITLES[r.status] ?? `Status: ${r.status}`,
            detail: `${r.type} at ${r.location}`.slice(0, 80),
            photoUrl: r.photoUrl,
            timestamp: now,
            read: false,
          });
        }

        prevMap.current.set(r.id, r.status);
      }

      addNotifs(newItems);
    },
    [addNotifs],
  );

  useEffect(() => {
    let incidentsUnsub: (() => void) | undefined;
    let currentUid: string | null = null;
    let cancelled = false;

    // Poll the session every 15 seconds so we detect login/logout
    // without requiring a page refresh (replaces Firebase's
    // onAuthStateChanged listener).
    const syncSubscription = async () => {
      if (cancelled) return;
      const profile = await getCurrentUserProfile();
      const nextUid = profile?.uid ?? null;

      if (nextUid === currentUid) return; // No change.

      // User changed (logged in, logged out, or switched) — rebuild.
      incidentsUnsub?.();
      incidentsUnsub = undefined;
      prevMap.current.clear();
      initialized.current = false;
      currentUid = nextUid;
      roleRef.current = profile?.role ?? null;

      if (!profile) return;

      incidentsUnsub =
        profile.role === "Captain"
          ? subscribeToAllIncidents(handleSnapshot)
          : subscribeToUserIncidents(profile.uid, handleSnapshot);
    };

    void syncSubscription();
    const id = setInterval(syncSubscription, 15_000);

    return () => {
      cancelled = true;
      clearInterval(id);
      incidentsUnsub?.();
    };
  }, [handleSnapshot]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      save(next);
      return next;
    });
  }, []);

  const markOneRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      save(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    save([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotifCtx.Provider value={{ notifications, unreadCount, markAllRead, markOneRead, clearAll }}>
      {children}
    </NotifCtx.Provider>
  );
}

export const useNotifications = () => useContext(NotifCtx);
