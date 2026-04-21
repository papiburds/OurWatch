// /api/incidents
//   GET  → list incidents (all for captains; optional ?userId= filter)
//   POST → create a new REPORT (citizen only); also creates an UPDATEDREPORT
//          row with status="Pending" so every report has a status from day one.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, mapReportToIncident } from "@/lib/api-helpers";
import type { Incident } from "@/lib/types";

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const url = new URL(req.url);
  const userIdParam = url.searchParams.get("userId")?.trim() || null;

  // Citizens can only see their own reports; captains can see everything.
  const where: { contactNumber?: string } = {};
  if (user.role === "Citizen") {
    where.contactNumber = user.contactNumber ?? "__none__";
  } else if (userIdParam) {
    where.contactNumber = userIdParam;
  }

  const rows = await prisma.report.findMany({
    where,
    include: { citizen: true, updatedReport: true },
    orderBy: { createdAt: "desc" },
  });

  const incidents: Incident[] = rows.map(mapReportToIncident);
  return NextResponse.json(incidents);
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (user.role !== "Citizen" || !user.contactNumber) {
    return NextResponse.json(
      { error: "Only citizens can file reports." },
      { status: 403 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    type?: string;
    community?: string;
    location?: string;
    description?: string;
    photoUrl?: string;
  };

  const type = (body.type ?? "").trim();
  const location = (body.location ?? "").trim();
  const description = (body.description ?? "").trim();
  const photoUrl = (body.photoUrl ?? "").trim() || null;

  if (!type || !location || !description) {
    return NextResponse.json(
      { error: "Type, location, and description are required." },
      { status: 400 },
    );
  }

  const report = await prisma.$transaction(async (tx) => {
    const created = await tx.report.create({
      data: {
        typeOfReport: type,
        description,
        location,
        photoUrl,
        contactNumber: user.contactNumber!,
      },
    });
    await tx.updatedReport.create({
      data: { reportId: created.reportId, status: "Pending" },
    });
    return created;
  });

  return NextResponse.json({ ok: true, id: String(report.reportId) }, { status: 201 });
}
