"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type StatsResponse = {
  community: string;
  population: number;
  total: number;
  avgPerDay: number;
  responseRate: number;
  statusCounts: { Pending: number; Verified: number; Resolved: number; Rejected: number };
  firstReportAt: string | null;
  generatedAt: string;
};

const EMPTY: StatsResponse = {
  community: "Barangay Cabulijan",
  population: 37_640,
  total: 0,
  avgPerDay: 0,
  responseRate: 0,
  statusCounts: { Pending: 0, Verified: 0, Resolved: 0, Rejected: 0 },
  firstReportAt: null,
  generatedAt: new Date().toISOString(),
};

export default function StatisticsPage() {
  const [stats, setStats] = useState<StatsResponse>(EMPTY);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        const data = (await res.json()) as StatsResponse;
        if (!mounted.current) return;
        setStats(data);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        if (!mounted.current) return;
        setError(err instanceof Error ? err.message : "Failed to load statistics.");
      } finally {
        if (mounted.current) setLoading(false);
      }
    };

    fetchStats();
    // Real-time: poll every 10 seconds.
    const id = setInterval(fetchStats, 10_000);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, []);

  const hasData = stats.total > 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 font-sans">
      <header className="flex items-center justify-between px-6 sm:px-10 py-4 bg-white border-b sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-[#3b82f6] p-2 rounded-xl text-white font-black text-xl w-10 h-10 flex items-center justify-center">!</div>
          <div>
            <h1 className="font-black text-xl leading-none text-[#1e293b]">OurWatch</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-1">Public Statistics</p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/" className="text-sm font-bold text-gray-600 hover:text-blue-600 flex items-center gap-2">
            ← Home
          </Link>
          <Link href="/login" className="bg-black text-white px-4 sm:px-6 py-2 rounded-lg font-bold text-sm hover:bg-gray-800 transition-all">
            Sign In
          </Link>
        </div>
      </header>

      <main className="p-6 sm:p-10 max-w-7xl mx-auto">
        {/* Live banner */}
        <div className="bg-[#eff6ff] border border-[#dbeafe] p-4 rounded-xl mb-8 text-sm text-[#1e40af] font-medium flex flex-wrap gap-2 items-center shadow-sm">
          <span className="inline-flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${error ? "bg-red-500" : "bg-green-500 animate-pulse"}`} />
            <span className="font-bold">{error ? "Offline" : "Live"}</span>
          </span>
          <span>•</span>
          <span>Viewing community statistics for {stats.community}.</span>
          {lastUpdated && (
            <span className="text-[11px] text-blue-500 ml-auto">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-black text-[#1e293b] tracking-tight">
            {stats.community} Statistics
          </h2>
          <p className="text-gray-500 font-medium mt-1">
            Real-time demographics and incident analytics
          </p>
        </div>

        {/* Primary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            label="Total Population"
            value={stats.population.toLocaleString()}
            hint="approx."
            hintClass="text-green-500"
            icon="👥"
            tint="blue"
          />
          <StatCard
            label="Total Incidents"
            value={stats.total.toString()}
            hint={hasData ? "All time" : "No reports yet"}
            hintClass={hasData ? "text-orange-500" : "text-gray-400"}
            icon="⚠️"
            tint="orange"
          />
          <StatCard
            label="Avg per Day"
            value={stats.avgPerDay.toFixed(2)}
            hint={hasData ? `in ${stats.community}` : "—"}
            hintClass="text-purple-500"
            icon="📊"
            tint="purple"
          />
          <StatCard
            label="Response Rate"
            value={`${stats.responseRate}%`}
            hint={hasData ? "Verified / Resolved / Rejected" : "—"}
            hintClass="text-green-500"
            icon="📈"
            tint="green"
          />
        </div>

        {/* Status breakdown */}
        <div className="mt-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <h3 className="text-lg font-black text-[#1e293b] mb-5">Status Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MiniCard label="Pending"  value={stats.statusCounts.Pending}  color="#f59e0b" />
            <MiniCard label="Verified" value={stats.statusCounts.Verified} color="#2563eb" />
            <MiniCard label="Resolved" value={stats.statusCounts.Resolved} color="#16a34a" />
            <MiniCard label="Rejected" value={stats.statusCounts.Rejected} color="#dc2626" />
          </div>
        </div>

        {/* Empty state */}
        {!hasData && !loading && (
          <div className="mt-10 bg-white border-2 border-dashed border-gray-100 rounded-[40px] p-16 text-center">
            <div className="text-6xl mb-4 opacity-20 text-gray-400">📂</div>
            <h4 className="text-xl font-bold text-gray-400">No Statistics Available</h4>
            <p className="text-gray-400 text-sm max-w-xs mx-auto mt-2 font-medium">
              There are currently no incidents reported in {stats.community}. Data will appear here once reports are submitted.
            </p>
            <Link href="/register" className="inline-block mt-6 text-blue-600 font-bold hover:underline">
              Create an account to report →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label, value, hint, hintClass, icon, tint,
}: {
  label: string; value: string; hint: string; hintClass: string; icon: string;
  tint: "blue" | "orange" | "purple" | "green";
}) {
  const tintMap: Record<typeof tint, string> = {
    blue:   "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
    green:  "bg-green-50 text-green-600",
  };
  return (
    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
      <div className="min-w-0">
        <p className="text-gray-400 text-xs font-bold mb-1 uppercase tracking-wider">{label}</p>
        <h3 className="text-3xl sm:text-4xl font-black text-[#1e293b] truncate">{value}</h3>
        <p className={`${hintClass} text-xs font-bold mt-1`}>{hint}</p>
      </div>
      <div className={`${tintMap[tint]} p-3 rounded-2xl text-xl shrink-0`}>{icon}</div>
    </div>
  );
}

function MiniCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 p-4 bg-[#f8fafc]">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-2xl font-black text-[#1e293b]">{value}</p>
    </div>
  );
}
