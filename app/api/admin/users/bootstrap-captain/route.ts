// POST /api/admin/users/bootstrap-captain
//
// Recovery / continuity endpoint.
//
// Promotes the currently signed-in Approved Admin to Barangay Captain — but
// ONLY if the system currently has no Captain. This exists so the system can
// never get stuck in an un-manageable state:
//
//   · Normal flow: Captain step-down auto-promotes the senior Approved Admin
//     inside the DELETE handler, so this endpoint is rarely needed.
//   · Recovery flow: if the DB ends up without a Captain for any reason
//     (legacy data, external edits, a step-down done before auto-promotion
//     existed), any Approved Admin can claim the role from the dashboard.
//
// Safe because:
//   · Requires an authenticated session.
//   · Caller must already be an Approved Admin (not Pending/Rejected/Citizen).
//   · Refuses to run while any Captain exists, so it can't be used to grab
//     power from an active Captain.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-helpers";
import { setSessionCookie } from "@/lib/session";

export async function POST() {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (actor.role !== "Admin") {
    return NextResponse.json(
      { error: "Only an Approved Admin can claim the Barangay Captain role." },
      { status: 403 },
    );
  }

  const accountId = Number(actor.uid);
  if (!Number.isFinite(accountId)) {
    return NextResponse.json({ error: "Invalid session." }, { status: 400 });
  }

  const captainExists =
    (await prisma.account.count({ where: { role: "Captain" } })) > 0;
  if (captainExists) {
    return NextResponse.json(
      { error: "A Barangay Captain is already assigned." },
      { status: 400 },
    );
  }

  const account = await prisma.account.findUnique({
    where: { accountId },
    select: {
      accountId: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });
  if (!account || account.role !== "Admin" || account.status !== "Approved") {
    return NextResponse.json(
      { error: "Only an Approved Admin can claim the Barangay Captain role." },
      { status: 403 },
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const official = await tx.brgyOfficial.create({
      data: {
        officialName: account.name,
        position: "Barangay Captain",
        accountStatus: "Active",
      },
    });
    return tx.account.update({
      where: { accountId: account.accountId },
      data: {
        role: "Captain",
        status: "Approved",
        officialId: official.officialId,
      },
      select: {
        accountId: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
  });

  // Refresh the session cookie with the new Captain role so subsequent
  // requests (and getCurrentUserProfile on the client) reflect it without
  // requiring a re-login.
  await setSessionCookie({
    accountId: updated.accountId,
    email: updated.email,
    role: "Captain",
  });

  return NextResponse.json({
    uid: String(updated.accountId),
    fullName: updated.name,
    email: updated.email,
    role: updated.role,
    status: updated.status,
    createdAt: updated.createdAt.toISOString(),
  });
}
