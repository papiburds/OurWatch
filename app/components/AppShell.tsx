"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getCurrentUserProfile, logoutUser } from "@/lib/auth";
import { useToast } from "@/app/toast-provider";
import { useTheme } from "@/app/context/theme-context";
import { useNotifications } from "@/app/context/notification-context";
import type { AppUser } from "@/lib/types";
import type { NotifStatus } from "@/app/context/notification-context";

export type ActivePage = "dashboard" | "report" | "incidents" | "monitoring" | "community";

interface Props {
  activePage: ActivePage;
}

const S = {
  header: { backgroundColor: "var(--ow-header)", borderColor: "var(--ow-border)" },
  nav:    { backgroundColor: "var(--ow-header)", borderColor: "var(--ow-border)" },
  text:   { color: "var(--ow-text)" },
  text2:  { color: "var(--ow-text-2)" },
  text3:  { color: "var(--ow-text-3)" },
  card:   { backgroundColor: "var(--ow-card)",   borderColor: "var(--ow-border)" },
  card2:  { backgroundColor: "var(--ow-card-2)", borderColor: "var(--ow-border)" },
};

/* colour for each notification type */
const NOTIF_DOT: Record<NotifStatus, string> = {
  new:      "#6366f1",
  Pending:  "#f59e0b",
  Verified: "#3b82f6",
  Resolved: "#10b981",
  Rejected: "#dc2626",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AppShell({ activePage }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const { isDark, toggle: toggleTheme } = useTheme();
  const { notifications, unreadCount, markAllRead, markOneRead, clearAll } = useNotifications();

  const [user,        setUser]        = useState<AppUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [bellOpen,    setBellOpen]    = useState(false);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  // `mounted` avoids hydration mismatches for UI that depends on
  // sessionStorage / client-only state (e.g. the unread notifications badge).
  const [mounted,     setMounted]     = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const bellRef    = useRef<HTMLDivElement>(null);

  /* fetch user profile */
  useEffect(() => {
    setMounted(true);
    getCurrentUserProfile().then(setUser).catch(() => undefined);
  }, []);

  /* close dropdowns on outside click */
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (bellRef.current    && !bellRef.current.contains(e.target as Node))    setBellOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleLogout = async () => {
    setProfileOpen(false);
    setDrawerOpen(false);
    await logoutUser();
    showToast("Signed out successfully.", "info");
    // Back to the public landing page with Sign In / Create Account / Statistics.
    setTimeout(() => router.push("/"), 0);
  };

  const handleBellClick = () => {
    setBellOpen((v) => !v);
    setProfileOpen(false);
  };

  const handleNotifClick = (id: string) => {
    markOneRead(id);
    setBellOpen(false);
    const target = user?.role === "Citizen" ? "/incidents" : "/monitoring";
    router.push(target);
  };

  const initials = (user?.fullName || "U")
    .split(" ").map((w) => w[0] || "").join("").toUpperCase().slice(0, 2);

  const roleLabel =
    user?.role === "Captain"
      ? "Barangay Official"
      : user?.role === "Admin"
        ? "Administrative User"
        : "Citizen";

  // Barangay Officials only get the Monitoring dashboard.
  // Citizens keep their full set of pages.
  const navItems: { href: string; label: string; key: ActivePage }[] =
    user?.role && user.role !== "Citizen"
      ? [{ href: "/monitoring", label: "Monitoring", key: "monitoring" }]
      : [
          { href: "/dashboard", label: "Dashboard",       key: "dashboard"  },
          { href: "/report",    label: "Report Incident", key: "report"     },
          { href: "/incidents", label: "Incidents",       key: "incidents"  },
          { href: "/community", label: "Community",       key: "community"  },
        ];

  const navIcons: Record<ActivePage, string> = {
    dashboard: "⌂", report: "ⓘ", incidents: "☰", monitoring: "◫", community: "⚇",
  };

  return (
    <>
      {/* ══ Header ══ */}
      <header style={S.header} className="flex items-center justify-between px-8 py-3.5 border-b sticky top-0 z-50 shadow-sm">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <Image src="/OurWatch_LOGO.png" alt="OurWatch" width={36} height={36} style={{ objectFit: "contain" }} />
          <div>
            <p style={S.text}  className="font-black text-lg leading-tight">OurWatch</p>
            <p style={S.text3} className="text-[10px] font-semibold uppercase tracking-wide">Crowd-Sourcing Incident Alerts</p>
          </div>
        </div>

        {/* Hamburger — mobile only */}
        <button
          onClick={() => setDrawerOpen((v) => !v)}
          className="sm:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-xl transition hover:opacity-80"
          style={{ backgroundColor: "var(--ow-card-2)" }}
          aria-label="Menu"
        >
          <span className="block w-4 h-0.5 rounded" style={{ backgroundColor: "var(--ow-text-2)" }} />
          <span className="block w-4 h-0.5 rounded" style={{ backgroundColor: "var(--ow-text-2)" }} />
          <span className="block w-4 h-0.5 rounded" style={{ backgroundColor: "var(--ow-text-2)" }} />
        </button>

        {/* Right controls */}
        <div className="flex items-center gap-4">

          {/* ── Bell ── */}
          <div ref={bellRef} className="relative">
            <button
              onClick={handleBellClick}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl transition hover:opacity-80"
              style={{ backgroundColor: "var(--ow-card-2)" }}
              aria-label="Notifications"
            >
              <svg style={S.text2} className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {mounted && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 text-white text-[9px] font-bold min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full"
                  style={{ backgroundColor: "#ef4444" }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification panel */}
            {bellOpen && (
              <div style={{ ...S.card, width: 340 }}
                className="absolute right-0 mt-2 rounded-2xl border shadow-2xl overflow-hidden z-50">

                {/* Panel header */}
                <div style={{ borderColor: "var(--ow-border)" }} className="flex items-center justify-between px-4 py-3 border-b">
                  <p style={S.text} className="text-sm font-bold">Notifications</p>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} style={{ color: "var(--ow-accent)" }} className="text-xs font-semibold hover:opacity-70 transition">
                        Mark all read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button onClick={clearAll} style={S.text3} className="text-xs hover:opacity-70 transition">
                        Clear all
                      </button>
                    )}
                  </div>
                </div>

                {/* Notification list */}
                <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center" style={S.text3}>
                      <svg className="w-10 h-10 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <p className="text-xs font-medium">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button key={n.id}
                        onClick={() => handleNotifClick(n.id)}
                        style={{
                          ...S.card2,
                          borderLeft: `3px solid ${NOTIF_DOT[n.status]}`,
                          opacity: n.read ? 0.7 : 1,
                        }}
                        className="w-[calc(100%-24px)] text-left mx-3 my-2 rounded-xl px-3 py-2.5 hover:opacity-90 active:scale-[0.99] transition cursor-pointer"
                        title="Open incident">
                        <div className="flex items-start gap-2.5">
                          {n.photoUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={n.photoUrl} alt=""
                              className="w-12 h-12 object-cover rounded-lg shrink-0"
                              style={{ borderColor: "var(--ow-border)" }} />
                          ) : (
                            <span className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                              style={{ backgroundColor: NOTIF_DOT[n.status] }} />
                          )}
                          <div className="flex-1 min-w-0">
                            <p style={S.text} className="text-xs font-bold leading-snug">{n.title}</p>
                            <p style={S.text2} className="text-xs mt-0.5 leading-snug line-clamp-2">{n.detail}</p>
                            <p style={S.text3} className="text-[10px] mt-1">{timeAgo(n.timestamp)}</p>
                          </div>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                              style={{ backgroundColor: "#3b82f6" }} />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User name + role */}
          <div className="text-right hidden sm:block">
            <p style={S.text}  className="text-sm font-bold leading-tight">{user?.fullName || "—"}</p>
            <p style={S.text3} className="text-[10px] font-semibold uppercase">{roleLabel}</p>
          </div>

          {/* ── Avatar + profile dropdown ── */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => { setProfileOpen((v) => !v); setBellOpen(false); }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold select-none"
              style={{ backgroundColor: "#2563eb" }}
            >
              {initials}
            </button>

            {profileOpen && (
              <div style={{ ...S.card, minWidth: 210 }}
                className="absolute right-0 mt-2 rounded-xl border shadow-2xl overflow-hidden z-50">

                {/* Profile info */}
                <div style={{ borderColor: "var(--ow-border)" }} className="px-4 py-3 border-b">
                  <p style={S.text}  className="text-sm font-bold">{user?.fullName || "—"}</p>
                  <p style={S.text3} className="text-xs">{user?.email || ""}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "var(--ow-badge-bg)", color: "var(--ow-badge-text)" }}>
                    {roleLabel}
                  </span>
                </div>

                {/* My Profile */}
                <Link href="/profile"
                  onClick={() => setProfileOpen(false)}
                  style={S.text2}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:opacity-80 transition-opacity">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Profile
                </Link>

                {/* Dark mode toggle */}
                <button onClick={toggleTheme} style={S.text2}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:opacity-80 transition-opacity">
                  <span>{isDark ? "☀️" : "🌙"}</span>
                  <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                </button>

                {/* Sign out */}
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:opacity-80 transition-opacity"
                  style={{ borderTop: "1px solid var(--ow-border)" }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ══ Nav ══ */}
      <nav style={S.nav} className="flex items-center px-8 border-b gap-1 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = activePage === item.key;
          return (
            <Link key={item.key} href={item.href}
              style={{
                color: isActive ? "var(--ow-accent)" : "var(--ow-text-3)",
                borderBottomColor: isActive ? "var(--ow-accent)" : "transparent",
              }}
              className="flex items-center gap-1.5 px-1 py-3.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors hover:opacity-80 mr-5">
              <span className="text-base leading-none">{navIcons[item.key]}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ══ Mobile drawer ══ */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 sm:hidden"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={() => setDrawerOpen(false)} />

          {/* Panel */}
          <div className="fixed top-0 left-0 bottom-0 z-50 w-72 flex flex-col sm:hidden shadow-2xl"
            style={S.card}>

            {/* Drawer header */}
            <div style={{ borderColor: "var(--ow-border)" }} className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <Image src="/OurWatch_LOGO.png" alt="OurWatch" width={28} height={28} style={{ objectFit: "contain" }} />
                <span style={S.text} className="font-black text-base">OurWatch</span>
              </div>
              <button onClick={() => setDrawerOpen(false)} style={S.text3} className="hover:opacity-70">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User info */}
            <div style={{ borderColor: "var(--ow-border)" }} className="px-5 py-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: "#2563eb" }}>
                  {initials}
                </div>
                <div>
                  <p style={S.text}  className="text-sm font-bold leading-tight">{user?.fullName || "—"}</p>
                  <p style={S.text3} className="text-xs">{roleLabel}</p>
                </div>
              </div>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto py-2">
              {navItems.map((item) => {
                const isActive = activePage === item.key;
                return (
                  <Link key={item.key} href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-5 py-3.5 text-sm font-semibold transition"
                    style={{
                      color: isActive ? "var(--ow-accent)" : "var(--ow-text-2)",
                      backgroundColor: isActive ? "var(--ow-badge-bg)" : "transparent",
                    }}>
                    <span className="text-base">{navIcons[item.key]}</span>
                    {item.label}
                  </Link>
                );
              })}

              {/* Profile */}
              <Link href="/profile" onClick={() => setDrawerOpen(false)}
                style={{ color: "var(--ow-text-2)" }}
                className="flex items-center gap-3 px-5 py-3.5 text-sm font-semibold transition hover:opacity-80">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                My Profile
              </Link>
            </nav>

            {/* Bottom actions */}
            <div style={{ borderColor: "var(--ow-border)" }} className="border-t py-2">
              <button onClick={() => { toggleTheme(); }}
                style={{ color: "var(--ow-text-2)" }}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-semibold hover:opacity-80 transition">
                <span>{isDark ? "☀️" : "🌙"}</span>
                {isDark ? "Light Mode" : "Dark Mode"}
              </button>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-semibold text-red-500 hover:opacity-80 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
