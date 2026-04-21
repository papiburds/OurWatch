"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth";
import { subscribeToAllIncidents } from "@/lib/incidents";
import type { Incident } from "@/lib/types";
import AppShell from "@/app/components/AppShell";

const S = {
  page: { backgroundColor: "var(--ow-bg)", minHeight: "100vh" },
  card: { backgroundColor: "var(--ow-card)", borderColor: "var(--ow-border)" },
  card2: { backgroundColor: "var(--ow-card-2)", borderColor: "var(--ow-border)" },
  text: { color: "var(--ow-text)" },
  text2: { color: "var(--ow-text-2)" },
  text3: { color: "var(--ow-text-3)" },
};

const TYPE_COLORS = ["#6366f1", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6"];

export default function CommunityPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Incident[]>([]);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const profile = await getCurrentUserProfile();
      if (!profile) { setTimeout(() => router.push("/login"), 0); return; }
      if (profile.role === "Captain") { setTimeout(() => router.push("/monitoring"), 0); return; }
      unsub = subscribeToAllIncidents(setReports);
    })().catch(() => undefined);
    return () => unsub?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const communityStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reports) {
      const k = r.community || "Unspecified";
      map.set(k, (map.get(k) || 0) + 1);
    }
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [reports]);

  const topTypes = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reports) map.set(r.type, (map.get(r.type) || 0) + 1);
    return [...map.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [reports]);

  const maxCount = Math.max(1, ...topTypes.map((t) => t.count));

  return (
    <div style={S.page}>
      <AppShell activePage="community" />

      <main className="px-8 py-8 max-w-6xl mx-auto">
        <div className="mb-7">
          <h2 style={S.text} className="text-3xl font-black tracking-tight">Community</h2>
          <p style={S.text2} className="text-sm mt-1">Real-time trends by barangay and incident category</p>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
          {[
            { label: "Total Reports", val: reports.length, col: "#6366f1" },
            { label: "Areas Affected", val: communityStats.length, col: "#f59e0b" },
            { label: "Incident Types", val: topTypes.length, col: "#ef4444" },
            { label: "Resolved", val: reports.filter((r) => r.status === "Resolved").length, col: "#10b981" },
          ].map((s) => (
            <div key={s.label} style={S.card} className="rounded-2xl border p-5 shadow-sm">
              <p style={S.text3} className="text-xs font-semibold uppercase tracking-wider">{s.label}</p>
              <p className="text-3xl font-black mt-1" style={{ color: s.col }}>{s.val}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* Top Incident Types */}
          <div style={S.card} className="rounded-2xl border shadow-sm p-6">
            <h3 style={S.text} className="text-lg font-bold mb-5">Top Incident Types</h3>
            <div className="space-y-4">
              {topTypes.length > 0 ? topTypes.map((t, i) => (
                <div key={t.type}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: TYPE_COLORS[i % TYPE_COLORS.length] }} />
                      <p style={S.text} className="text-sm font-semibold">{t.type}</p>
                    </div>
                    <p style={S.text2} className="text-xs font-bold">{t.count} reports</p>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--ow-border)" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${(t.count / maxCount) * 100}%`, backgroundColor: TYPE_COLORS[i % TYPE_COLORS.length] }} />
                  </div>
                </div>
              )) : (
                <p style={S.text3} className="text-sm">No incident data yet.</p>
              )}
            </div>
          </div>
        </div>

        <footer style={S.text3} className="mt-10 text-center text-xs">
          © 2026 OurWatch. Empowering communities through real-time incident reporting.
        </footer>
      </main>
    </div>
  );
}
