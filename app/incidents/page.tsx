"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth";
import { subscribeToAllIncidents } from "@/lib/incidents";
import type { Incident } from "@/lib/types";
import AppShell from "@/app/components/AppShell";
import { SkeletonDashboard } from "@/app/components/Skeleton";

const S = {
  page:  { backgroundColor: "var(--ow-bg)", minHeight: "100vh" },
  card:  { backgroundColor: "var(--ow-card)",   borderColor: "var(--ow-border)" },
  card2: { backgroundColor: "var(--ow-card-2)", borderColor: "var(--ow-border)" },
  input: { backgroundColor: "var(--ow-card-2)", borderColor: "var(--ow-border)", color: "var(--ow-text)" },
  text:  { color: "var(--ow-text)" },
  text2: { color: "var(--ow-text-2)" },
  text3: { color: "var(--ow-text-3)" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Pending:  { bg: "#fef3c7", text: "#92400e" },
  Verified: { bg: "#dbeafe", text: "#1e40af" },
  Resolved: { bg: "#dcfce7", text: "#166534" },
  Rejected: { bg: "#fee2e2", text: "#b91c1c" },
};

const PAGE_SIZE = 10;

export default function IncidentsPage() {
  const router = useRouter();
  const [reports,  setReports]  = useState<Incident[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<"All" | Incident["status"]>("All");
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const profile = await getCurrentUserProfile();
      if (!profile) { setTimeout(() => router.push("/login"), 0); return; }
      if (profile.role === "Captain") { setTimeout(() => router.push("/monitoring"), 0); return; }
      unsub = subscribeToAllIncidents((items) => {
        setReports(items);
        setLoading(false);
      });
    })().catch(() => undefined);
    return () => unsub?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* reset page when filter or search changes */
  useEffect(() => { setPage(1); }, [filter, search]);

  const filtered = useMemo(() => {
    let result = filter === "All" ? reports : reports.filter((r) => r.status === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((r) =>
        r.description.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.community.toLowerCase().includes(q) ||
        r.reporterName.toLowerCase().includes(q),
      );
    }
    return result;
  }, [reports, filter, search]);

  const paginated = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);
  const hasMore   = paginated.length < filtered.length;

  const counts = useMemo(() => ({
    All:      reports.length,
    Pending:  reports.filter((r) => r.status === "Pending").length,
    Verified: reports.filter((r) => r.status === "Verified").length,
    Resolved: reports.filter((r) => r.status === "Resolved").length,
    Rejected: reports.filter((r) => r.status === "Rejected").length,
  }), [reports]);

  return (
    <div style={S.page}>
      <AppShell activePage="incidents" />

      <main className="px-8 py-8 max-w-5xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
          <div>
            <h2 style={S.text} className="text-3xl font-black tracking-tight">Incidents</h2>
            <p style={S.text2} className="text-sm mt-1">Live community incident feed and status tracker</p>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {(["All", "Pending", "Verified", "Resolved", "Rejected"] as const).map((s) => {
              const active = filter === s;
              return (
                <button key={s} onClick={() => setFilter(s)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border transition"
                  style={active
                    ? { backgroundColor: "var(--ow-accent)", color: "#fff", borderColor: "var(--ow-accent)" }
                    : { ...S.card2, color: "var(--ow-text-2)" }}>
                  {s}{counts[s] > 0 && <span className="ml-1 opacity-60">({counts[s]})</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-5 relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={S.text3} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={S.input}
            className="w-full pl-11 pr-4 py-3 rounded-xl border text-sm placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="Search by description, type, location, community…"
          />
          {search && (
            <button onClick={() => setSearch("")} style={S.text3}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm hover:opacity-70">✕</button>
          )}
        </div>

        {/* Loading / list */}
        {loading ? (
          <SkeletonDashboard />
        ) : (
          <>
            <div style={S.card} className="rounded-2xl border shadow-sm p-6">
              {/* Result count */}
              {search && (
                <p style={S.text3} className="text-xs mb-4">
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
                </p>
              )}

              <div className="space-y-3">
                {paginated.length > 0 ? paginated.map((r) => {
                  const sc = STATUS_COLORS[r.status] || { bg: "#f1f5f9", text: "#475569" };
                  return (
                    <div key={r.id} style={S.card2} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-4">
                        {r.photoUrl && (
                          <a href={r.photoUrl} target="_blank" rel="noopener noreferrer"
                            className="shrink-0 block hover:opacity-90 transition"
                            title="Open full-size photo">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={r.photoUrl} alt="Incident evidence"
                              className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border"
                              style={{ borderColor: "var(--ow-border)" }} />
                          </a>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: "#ede9fe", color: "#5b21b6" }}>{r.type}</span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: sc.bg, color: sc.text }}>{r.status}</span>
                          </div>
                          <p style={S.text} className="font-semibold text-sm leading-snug">{r.description}</p>
                          <div className="flex flex-wrap gap-3 mt-2">
                            <span style={S.text3} className="text-xs">📍 {r.location}</span>
                            <span style={S.text3} className="text-xs">🏘 {r.community}</span>
                            <span style={S.text3} className="text-xs">👤 {r.reporterName}</span>
                          </div>
                        </div>
                        <p style={S.text3} className="text-xs whitespace-nowrap shrink-0">
                          {new Date(r.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-16" style={S.text3}>
                    <p className="text-sm font-medium">
                      {search ? `No incidents match "${search}"` : "No incidents match this filter."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center mt-5">
                <button onClick={() => setPage((p) => p + 1)}
                  style={{ ...S.card, color: "var(--ow-text-2)" }}
                  className="px-8 py-2.5 rounded-xl border text-sm font-semibold hover:opacity-80 transition shadow-sm">
                  Load more ({filtered.length - paginated.length} remaining)
                </button>
              </div>
            )}
          </>
        )}

        <footer style={S.text3} className="mt-10 text-center text-xs">
          © 2026 OurWatch. Empowering communities through real-time incident reporting.
        </footer>
      </main>
    </div>
  );
}
