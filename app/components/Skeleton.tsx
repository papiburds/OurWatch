"use client";

/* Animated grey placeholder bars that match the theme (light + dark). */

const pulse: React.CSSProperties = {
  animation: "pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite",
  backgroundColor: "var(--ow-border)",
  borderRadius: 6,
};

function Bar({ w = "100%", h = 12 }: { w?: string | number; h?: number }) {
  return <div style={{ ...pulse, width: w, height: h }} />;
}

/* ── Stat card skeleton (4-up row on dashboard / monitoring) ── */
export function SkeletonStatCard() {
  return (
    <div style={{ backgroundColor: "var(--ow-card)", borderColor: "var(--ow-border)" }}
      className="rounded-2xl border p-6 flex justify-between items-center shadow-sm">
      <div className="space-y-2 flex-1">
        <Bar w="40%" h={10} />
        <Bar w="25%" h={32} />
        <Bar w="50%" h={8} />
      </div>
      <div style={{ ...pulse, width: 48, height: 48, borderRadius: 12 }} />
    </div>
  );
}

/* ── Incident row skeleton ── */
export function SkeletonIncidentRow() {
  return (
    <div style={{ backgroundColor: "var(--ow-card-2)", borderColor: "var(--ow-border)" }}
      className="rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Bar w={64}  h={18} />
            <Bar w={64}  h={18} />
          </div>
          <Bar w="70%" h={14} />
          <Bar w="45%" h={10} />
        </div>
        <Bar w={60} h={10} />
      </div>
    </div>
  );
}

/* ── Full page loading overlay (stat cards + rows) ── */
export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
      </div>
      {/* Content rows */}
      <div style={{ backgroundColor: "var(--ow-card)", borderColor: "var(--ow-border)" }}
        className="rounded-2xl border shadow-sm p-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonIncidentRow key={i} />)}
      </div>
    </div>
  );
}
