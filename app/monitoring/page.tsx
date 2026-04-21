"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth";
import { deleteIncident, subscribeToAllIncidents, updateIncidentStatus } from "@/lib/incidents";
import { useToast } from "@/app/toast-provider";
import type { Incident } from "@/lib/types";
import AppShell from "@/app/components/AppShell";
import { SkeletonDashboard } from "@/app/components/Skeleton";

const S = {
  page:  { backgroundColor: "var(--ow-bg)", minHeight: "100vh" },
  card:  { backgroundColor: "var(--ow-card)",   borderColor: "var(--ow-border)" },
  card2: { backgroundColor: "var(--ow-card-2)", borderColor: "var(--ow-border)" },
  text:  { color: "var(--ow-text)" },
  text2: { color: "var(--ow-text-2)" },
  text3: { color: "var(--ow-text-3)" },
};

const SC: Record<string, { bg: string; text: string; border: string }> = {
  Pending:  { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  Verified: { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
  Resolved: { bg: "#dcfce7", text: "#166534", border: "#86efac" },
  Rejected: { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca" },
};

const STATUS_ORDER = ["Pending", "Verified", "Resolved", "Rejected"] as const;

interface ConfirmState {
  report: Incident;
  status: Incident["status"];
}

export default function MonitoringPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [reports,    setReports]    = useState<Incident[]>([]);
  const [authorized, setAuthorized] = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [tabFilter,    setTabFilter]    = useState<Incident["status"]>("Pending");
  const [confirm,      setConfirm]      = useState<ConfirmState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Incident | null>(null);
  const [rejectNote,   setRejectNote]   = useState("");
  const [updating,     setUpdating]     = useState(false);
  const [deleting,     setDeleting]     = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const profile = await getCurrentUserProfile();
      if (!profile || profile.role !== "Captain") {
        setTimeout(() => router.push("/dashboard"), 0);
        return;
      }
      setAuthorized(true);
      unsub = subscribeToAllIncidents((items) => {
        setReports(items);
        setLoading(false);
      });
    })().catch(() => undefined);
    return () => unsub?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => ({
    total:    reports.length,
    Pending:  reports.filter((r) => r.status === "Pending").length,
    Verified: reports.filter((r) => r.status === "Verified").length,
    Resolved: reports.filter((r) => r.status === "Resolved").length,
    Rejected: reports.filter((r) => r.status === "Rejected").length,
  }), [reports]);

  const tabReports = useMemo(
    () => reports.filter((r) => r.status === tabFilter),
    [reports, tabFilter],
  );

  const requestChange = (report: Incident, status: Incident["status"]) => {
    setRejectNote("");
    setConfirm({ report, status });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteIncident(deleteTarget.id);
      showToast("Report deleted.", "success");
      // Optimistic local removal so the card disappears immediately.
      setReports((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    } catch {
      showToast("Failed to delete report.", "error");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const confirmChange = async () => {
    if (!confirm) return;
    if (confirm.status === "Rejected" && rejectNote.trim().length < 3) {
      showToast("Please enter a short reason for rejection.", "error");
      return;
    }
    setUpdating(true);
    try {
      const note =
        confirm.status === "Rejected"
          ? `Rejected: ${rejectNote.trim()}`
          : `Status updated to ${confirm.status}`;
      await updateIncidentStatus(confirm.report.id, confirm.status, note);
      showToast(`Marked as ${confirm.status}.`, "success");
    } catch {
      showToast("Failed to update status.", "error");
    } finally {
      setUpdating(false);
      setConfirm(null);
      setRejectNote("");
    }
  };

  if (!authorized) return null;

  const statCards = [
    { label: "Total Reports", val: counts.total,    iconBg: "#eff6ff", iconCol: "#2563eb", icon: "☰" },
    { label: "Pending",       val: counts.Pending,  iconBg: "#fefce8", iconCol: "#ca8a04", icon: "◷" },
    { label: "Verified",      val: counts.Verified, iconBg: "#eff6ff", iconCol: "#2563eb", icon: "↗" },
    { label: "Resolved",      val: counts.Resolved, iconBg: "#f0fdf4", iconCol: "#16a34a", icon: "✓" },
    { label: "Rejected",      val: counts.Rejected, iconBg: "#fef2f2", iconCol: "#dc2626", icon: "✕" },
  ];

  return (
    <div style={S.page}>
      <AppShell activePage="monitoring" />

      <main className="px-8 py-8 max-w-6xl mx-auto">
        <div className="mb-7">
          <h2 style={S.text} className="text-3xl font-black tracking-tight">Monitoring Dashboard</h2>
          <p style={S.text2} className="text-sm mt-1">Manage and track incident reports — Barangay Official View</p>
        </div>

        {loading ? <SkeletonDashboard /> : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-6">
              {statCards.map((s) => (
                <div key={s.label} style={S.card} className="rounded-2xl border p-6 flex justify-between items-center shadow-sm">
                  <div>
                    <p style={S.text3} className="text-xs font-semibold uppercase tracking-wider mb-1">{s.label}</p>
                    <p style={S.text}  className="text-4xl font-black">{s.val}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
                    style={{ backgroundColor: s.iconBg, color: s.iconCol }}>{s.icon}</div>
                </div>
              ))}
            </div>

            {/* Status bar */}
            {counts.total > 0 && (
              <div style={S.card} className="rounded-2xl border p-4 mb-6 shadow-sm">
                <div className="flex h-6 rounded-xl overflow-hidden text-[10px] font-bold gap-0.5">
                  {STATUS_ORDER.filter((s) => counts[s] > 0).map((s) => (
                    <div key={s} className="flex items-center justify-center transition-all"
                      style={{ width: `${(counts[s] / counts.total) * 100}%`, backgroundColor: SC[s].bg, color: SC[s].text }}>
                      {counts[s] / counts.total > 0.12 ? `${s} (${counts[s]})` : counts[s]}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab filter */}
            <div style={{ borderColor: "var(--ow-border)" }} className="flex border rounded-2xl overflow-hidden mb-5 shadow-sm">
              {STATUS_ORDER.map((s) => {
                const active = tabFilter === s;
                return (
                  <button key={s} onClick={() => setTabFilter(s)}
                    className="flex-1 py-3 text-sm font-semibold transition"
                    style={active
                      ? { backgroundColor: "var(--ow-accent)", color: "#fff" }
                      : { ...S.card, color: "var(--ow-text-2)", borderRight: "1px solid var(--ow-border)" }}>
                    {s} ({counts[s]})
                  </button>
                );
              })}
            </div>

            {/* Incident cards */}
            <div className="space-y-4 mb-8">
              {tabReports.length > 0 ? tabReports.map((r) => (
                <div key={r.id} style={S.card} className="rounded-2xl border shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    {r.photoUrl && (
                      <a href={r.photoUrl} target="_blank" rel="noopener noreferrer"
                        className="shrink-0 block hover:opacity-90 transition"
                        title="Open full-size photo">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.photoUrl} alt="Incident evidence"
                          className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-xl border"
                          style={{ borderColor: "var(--ow-border)" }} />
                      </a>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: SC[r.status].bg, color: SC[r.status].text }}>{r.status}</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "var(--ow-card-2)", color: "var(--ow-text-2)", border: "1px solid var(--ow-border)" }}>{r.type}</span>
                      </div>
                      <p style={S.text}  className="font-semibold text-base leading-snug">{r.description}</p>
                      <p style={S.text3} className="text-xs mt-1.5">📍 {r.location}</p>
                      <p style={S.text3} className="text-xs mt-0.5">Reported by {r.reporterName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p style={S.text3} className="text-xs">
                        {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })},{" "}
                        {new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p style={S.text3} className="text-xs mt-1">{r.updateNote ? 1 : 0} update(s)</p>
                    </div>
                  </div>

                  {/* Status action buttons */}
                  <div style={{ borderColor: "var(--ow-border)" }} className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                    <p style={S.text3} className="text-xs font-medium self-center mr-1">Update status:</p>
                    {STATUS_ORDER.filter((s) => s !== r.status).map((s) => (
                      <button key={s} onClick={() => requestChange(r, s)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition hover:opacity-80"
                        style={{ backgroundColor: SC[s].bg, color: SC[s].text, border: `1px solid ${SC[s].border}` }}>
                        {s === "Rejected" ? "Reject" : `Mark ${s}`}
                      </button>
                    ))}
                    <button
                      onClick={() => setDeleteTarget(r)}
                      className="ml-auto px-3 py-1.5 rounded-lg text-xs font-bold transition hover:opacity-80 flex items-center gap-1.5"
                      style={{ backgroundColor: "#fff1f2", color: "#b91c1c", border: "1px solid #fecdd3" }}
                      title="Permanently delete this report"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              )) : (
                <div style={S.card} className="rounded-2xl border p-12 text-center shadow-sm">
                  <p style={S.text3} className="text-sm font-medium">No {tabFilter.toLowerCase()} reports.</p>
                </div>
              )}
            </div>

            {/* Recent Official Updates */}
            <div style={S.card} className="rounded-2xl border shadow-sm p-6">
              <h3 style={S.text} className="text-base font-bold mb-4">Recent Official Updates</h3>
              <div className="space-y-3">
                {reports.filter((r) => r.updateNote).slice(0, 5).length > 0
                  ? reports.filter((r) => r.updateNote).slice(0, 5).map((r) => (
                      <div key={`upd-${r.id}`} style={S.card2} className="rounded-xl border px-4 py-3 flex items-start gap-3">
                        <span className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: SC[r.status]?.text || "#64748b" }} />
                        <div>
                          <p style={S.text}  className="text-sm font-semibold">{r.type}
                            <span style={S.text3} className="font-normal"> — {r.location}</span>
                          </p>
                          <p style={S.text2} className="text-xs mt-0.5">{r.updateNote}</p>
                        </div>
                      </div>
                    ))
                  : <p style={S.text3} className="text-sm">No official updates yet.</p>
                }
              </div>
            </div>
          </>
        )}

        <footer style={S.text3} className="mt-10 text-center text-xs">
          © 2026 OurWatch. Empowering communities through real-time incident reporting.
        </footer>
      </main>

      {/* ── Delete confirm modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => !deleting && setDeleteTarget(null)}>
          <div style={S.card} className="rounded-2xl border shadow-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "#fee2e2" }}>
              <svg className="w-6 h-6" style={{ color: "#dc2626" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M4.93 19h14.14a2 2 0 001.74-3l-7.07-12a2 2 0 00-3.48 0l-7.07 12a2 2 0 001.74 3z" />
              </svg>
            </div>
            <h3 style={S.text}  className="text-lg font-bold text-center mb-1">Delete this report?</h3>
            <p style={S.text2}  className="text-sm text-center mb-2">
              This action is <strong style={{ color: "#dc2626" }}>permanent</strong>. The report will also
              disappear from the citizen&apos;s records.
            </p>
            <p style={S.text3} className="text-xs text-center mb-6 line-clamp-2">
              &ldquo;{deleteTarget.description}&rdquo;
            </p>

            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold hover:opacity-80 transition"
                style={{ ...S.card2, color: "var(--ow-text-2)" }}>
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
                style={{ backgroundColor: deleting ? "#374151" : "#dc2626" }}>
                {deleting ? "Deleting…" : "Delete Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm modal ── */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => !updating && setConfirm(null)}>
          <div style={S.card} className="rounded-2xl border shadow-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}>
            {/* Icon */}
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: SC[confirm.status].bg }}>
              <span className="text-xl font-bold" style={{ color: SC[confirm.status].text }}>
                {confirm.status === "Resolved" ? "✓"
                  : confirm.status === "Verified" ? "↗"
                  : confirm.status === "Rejected" ? "✕"
                  : "◷"}
              </span>
            </div>

            <h3 style={S.text}  className="text-lg font-bold text-center mb-1">
              {confirm.status === "Rejected" ? "Reject Report" : "Confirm Status Change"}
            </h3>
            <p style={S.text2}  className="text-sm text-center mb-2">
              {confirm.status === "Rejected"
                ? <>Reject this report as <strong style={{ color: SC.Rejected.text }}>invalid or inappropriate</strong>?</>
                : <>Mark this incident as <strong style={{ color: SC[confirm.status].text }}>{confirm.status}</strong>?</>}
            </p>
            <p style={S.text3} className="text-xs text-center mb-4 line-clamp-2">
              &ldquo;{confirm.report.description}&rdquo;
            </p>

            {confirm.status === "Rejected" && (
              <div className="mb-5">
                <label style={S.text2} className="block text-xs font-semibold uppercase tracking-wide mb-1.5">
                  Reason for rejection *
                </label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  rows={3}
                  maxLength={300}
                  placeholder="e.g. Duplicate report / inappropriate content / not a real incident"
                  style={{
                    backgroundColor: "var(--ow-card-2)",
                    borderColor: "var(--ow-border)",
                    color: "var(--ow-text)",
                  }}
                  className="w-full px-3 py-2 rounded-xl border text-sm placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none transition"
                />
                <p style={S.text3} className="text-[10px] mt-1">{rejectNote.length}/300</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} disabled={updating}
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold hover:opacity-80 transition"
                style={{ ...S.card2, color: "var(--ow-text-2)" }}>
                Cancel
              </button>
              <button onClick={confirmChange} disabled={updating}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
                style={{
                  backgroundColor: updating
                    ? "#374151"
                    : confirm.status === "Rejected"
                      ? "#dc2626"
                      : "var(--ow-accent)",
                }}>
                {updating
                  ? "Updating…"
                  : confirm.status === "Rejected"
                    ? "Reject Report"
                    : `Mark ${confirm.status}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
