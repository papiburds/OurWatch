// PATCH /api/incidents/[id]
// Barangay officials (Captains) update a report's status + action_taken.
// Uses upsert on UPDATEDREPORT so the row is created if it wasn't already.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-helpers";
import type { IncidentStatus } from "@/lib/types";

const VALID_STATUSES: IncidentStatus[] = ["Pending", "Verified", "Resolved", "Rejected"];

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (user.role !== "Captain") {
    return NextResponse.json(
      { error: "Only barangay officials can update incidents." },
      { status: 403 },
    );
  }

  const { id } = await ctx.params;
  const reportId = Number(id);
  if (!Number.isFinite(reportId)) {
    return NextResponse.json({ error: "Invalid incident id." }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    status?: string;
    updateNote?: string;
  };
  const status = (body.status ?? "").trim() as IncidentStatus;
  const updateNote = (body.updateNote ?? "").trim() || null;

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Status must be one of: ${VALID_STATUSES.join(", ")}.` },
      { status: 400 },
    );
  }

  const report = await prisma.report.findUnique({ where: { reportId } });
  if (!report) {
    return NextResponse.json({ error: "Incident not found." }, { status: 404 });
  }

  await prisma.updatedReport.upsert({
    where: { reportId },
    update: { status, actionTaken: updateNote },
    create: { reportId, status, actionTaken: updateNote },
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/incidents/[id]
// Barangay officials can permanently remove a report (e.g. invalid,
// accidentally verified, duplicate). Because REPORT → UPDATEDREPORT and
// REPORT → SUBMIT_REPORT_TO relations are ON DELETE CASCADE, both will be
// cleaned up automatically. Citizens will stop seeing the report on their
// side as well.
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (user.role !== "Captain") {
    return NextResponse.json(
      { error: "Only barangay officials can delete incidents." },
      { status: 403 },
    );
  }

  const { id } = await ctx.params;
  const reportId = Number(id);
  if (!Number.isFinite(reportId)) {
    return NextResponse.json({ error: "Invalid incident id." }, { status: 400 });
  }

  const existing = await prisma.report.findUnique({ where: { reportId } });
  if (!existing) {
    return NextResponse.json({ error: "Incident not found." }, { status: 404 });
  }

  await prisma.report.delete({ where: { reportId } });
  return NextResponse.json({ ok: true });
}
