"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUserProfile } from "@/lib/auth";
import { subscribeToUserIncidents } from "@/lib/incidents";
import type { Incident } from "@/lib/types";
import AppShell from "@/app/components/AppShell";
import { SkeletonDashboard } from "@/app/components/Skeleton";

const S = {
  page: { backgroundColor: "var(--ow-bg)", minHeight: "100vh" },
  card: { backgroundColor: "var(--ow-card)", borderColor: "var(--ow-border)" },
  card2: { backgroundColor: "var(--ow-card-2)", borderColor: "var(--ow-border)" },
  text: { color: "var(--ow-text)" },
  text2: { color: "var(--ow-text-2)" },
  text3: { color: "var(--ow-text-3)" },
};

const statusColors: Record<string, { bg: string; text: string }> = {
  Pending:  { bg: "#fef3c7", text: "#92400e" },
  Verified: { bg: "#dbeafe", text: "#1e40af" },
  Resolved: { bg: "#dcfce7", text: "#166534" },
  Rejected: { bg: "#fee2e2", text: "#b91c1c" },
};

export default function CitizenDashboard() {
  const [reports,  setReports]  = useState<Incident[]>([]);
  const [userName, setUserName] = useState("—");
  const [loading,  setLoading]  = useState(true);

  const router = useRouter();

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const profile = await getCurrentUserProfile();
      if (!profile) { setTimeout(() => router.push("/login"), 0); return; }
      // Officials only use the Monitoring dashboard.
      if (profile.role === "Captain") { setTimeout(() => router.push("/monitoring"), 0); return; }
      setUserName(profile.fullName);
      unsub = subscribeToUserIncidents(profile.uid, (items) => {
        setReports(items);
        setLoading(false);
      });
    })().catch(() => undefined);
    return () => unsub?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => ({
    total:    reports.length,
    pending:  reports.filter((r) => r.status === "Pending").length,
    verified: reports.filter((r) => r.status === "Verified").length,
    resolved: reports.filter((r) => r.status === "Resolved").length,
  }), [reports]);

  const communityStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reports) map.set(r.community || "Unspecified", (map.get(r.community || "Unspecified") || 0) + 1);
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [reports]);

  const statCards = [
    { label: "Total Incidents", val: stats.total,    icon: "⚠", iconBg: "#fff7ed", iconCol: "#f97316" },
    { label: "Pending",         val: stats.pending,  icon: "◷", iconBg: "#fefce8", iconCol: "#ca8a04" },
    { label: "Verified",        val: stats.verified, icon: "↗", iconBg: "#eff6ff", iconCol: "#2563eb" },
    { label: "Resolved",        val: stats.resolved, icon: "✓", iconBg: "#f0fdf4", iconCol: "#16a34a" },
  ];

  return (
    <div style={S.page}>
      <AppShell activePage="dashboard" />

      <main className="px-8 py-8 max-w-7xl mx-auto">
        {/* Title row */}
        <div className="flex items-end justify-between mb-7">
          <div>
            <h2 style={S.text} className="text-3xl font-black tracking-tight">Dashboard</h2>
            <p style={S.text2} className="text-sm mt-1">Monitor incidents and community safety</p>
          </div>
          <Link
            href="/report"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-md hover:opacity-90 transition"
            style={{ backgroundColor: "var(--ow-accent)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Report Incident
          </Link>
        </div>

        {loading && <SkeletonDashboard />}

        {/* Stat cards */}
        {!loading && <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-7">
          {statCards.map((s) => (
            <div key={s.label} style={S.card} className="rounded-2xl border p-6 flex justify-between items-center shadow-sm">
              <div>
                <p style={S.text3} className="text-xs font-semibold uppercase tracking-wider mb-1">{s.label}</p>
                <p style={S.text} className="text-4xl font-black">{s.val}</p>
                <p style={S.text3} className="text-[10px] mt-1.5">+12% from last week</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
                style={{ backgroundColor: s.iconBg, color: s.iconCol }}>
                {s.icon}
              </div>
            </div>
          ))}
        </div>}

        {/* Content grid */}
        {!loading && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Incidents */}
          <div style={S.card} className="lg:col-span-2 rounded-2xl border shadow-sm p-6">
            <h3 style={S.text} className="text-lg font-bold mb-5">Recent Incidents</h3>
            <div className="space-y-3">
              {reports.length > 0 ? reports.map((r) => {
                const sc = statusColors[r.status] || { bg: "#f1f5f9", text: "#475569" };
                const time = new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                return (
                  <div key={r.id} style={S.card2} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: "#ede9fe", color: "#5b21b6" }}>
                            {r.type}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: sc.bg, color: sc.text }}>
                            {r.status}
                          </span>
                        </div>
                        <p style={S.text} className="font-semibold text-sm leading-snug line-clamp-2">{r.description}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span style={S.text3} className="text-xs">📍 {r.location}</span>
                          <span style={S.text3} className="text-xs">👤 {r.reporterName}</span>
                        </div>
                      </div>
                      <p style={S.text3} className="text-xs whitespace-nowrap shrink-0">{time}</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-16" style={S.text3}>
                  <p className="text-sm font-medium">No incidents reported yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Community Areas */}
          <div style={S.card} className="rounded-2xl border shadow-sm p-6">
            <h3 style={S.text} className="text-lg font-bold mb-5">Community Areas</h3>
            <div className="space-y-2.5">
              {communityStats.length > 0 ? communityStats.map((c) => (
                <div key={c.name} style={S.card2} className="rounded-xl border px-4 py-3 flex items-center justify-between">
                  <div>
                    <p style={S.text} className="font-semibold text-sm">{c.name}</p>
                    <p style={S.text3} className="text-xs">{c.count} incident{c.count !== 1 ? "s" : ""}</p>
                  </div>
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: "var(--ow-accent)" }}>
                    {c.count}
                  </span>
                </div>
              )) : (
                <p style={S.text3} className="text-sm">No community data yet.</p>
              )}
            </div>
          </div>
        </div>}

        <footer style={S.text3} className="mt-10 text-center text-xs">
          © 2026 OurWatch. Empowering communities through real-time incident reporting.
        </footer>
      </main>
    </div>
  );
}
