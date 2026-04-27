// GET /api/stats
// Public endpoint (no auth) used by the landing "View Statistics" page.
// Returns a summary of all reports in Barangay Cabulijan.
// We treat the whole system as Cabulijan-only per product requirement,
// so no community filter is applied on the DB side.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"; // Always fresh; no caching.

export async function GET() {
  try {
    const [total, firstReport, updatedReports] = await Promise.all([
      prisma.report.count(),
      prisma.report.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
      prisma.updatedReport.findMany({ select: { status: true } }),
    ]);

    const statusCounts = {
      Pending:  updatedReports.filter((u) => u.status === "Pending").length,
      Verified: updatedReports.filter((u) => u.status === "Verified").length,
      Resolved: updatedReports.filter((u) => u.status === "Resolved").length,
      Rejected: updatedReports.filter((u) => u.status === "Rejected").length,
    };

    // Reports with a status that isn't "Pending" count as "responded".
    const responded = total > 0
      ? statusCounts.Verified + statusCounts.Resolved + statusCounts.Rejected
      : 0;
    const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

    // Average reports per day in Cabulijan since the first report.
    let avgPerDay = 0;
    if (firstReport && total > 0) {
      const days = Math.max(
        1,
        Math.ceil((Date.now() - firstReport.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      );
      avgPerDay = total / days;
    }

    return NextResponse.json({
      community: "Barangay Cabulijan",
      population: 2700,
      total,
      avgPerDay: Number(avgPerDay.toFixed(2)),
      responseRate,
      statusCounts,
      firstReportAt: firstReport?.createdAt ?? null,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[stats] DB error:", err);
    return NextResponse.json({ error: "Failed to load statistics." }, { status: 500 });
  }
}
