// ─────────────────────────────────────────────────────────────────────────────
// Server-side helpers shared across API routes:
//   · bcrypt wrappers (hash / compare)
//   · getCurrentUser() — maps the signed-cookie session to an AppUser
//   · mapReportToIncident() — joins REPORT + CITIZEN + UPDATEDREPORT to the
//     flat Incident shape the React UI already expects.
// ─────────────────────────────────────────────────────────────────────────────

import bcrypt from "bcrypt";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { AppUser, Incident, IncidentStatus } from "@/lib/types";

// ── Password hashing ─────────────────────────────────────────────────────────
const BCRYPT_ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ── Session → AppUser ────────────────────────────────────────────────────────
// Loads the authenticated user from the session cookie and maps DB rows
// (ACCOUNT + CITIZEN | BRGY_OFFICIAL) into the flat AppUser shape.
export async function getCurrentUser(): Promise<AppUser | null> {
  const session = await getSession();
  if (!session) return null;

  const account = await prisma.account.findUnique({
    where: { accountId: session.accountId },
    include: { citizen: true, official: true },
  });
  if (!account) return null;

  const isCaptain = !!account.officialId;
  const role = isCaptain ? "Captain" : "Citizen";
  const fullName =
    (isCaptain ? account.official?.officialName : account.citizen?.fullName) ||
    account.name;

  return {
    uid: String(account.accountId),
    fullName,
    email: account.email,
    role,
    contactNumber: account.citizen?.contactNumber ?? undefined,
    address: (account.citizen?.address ?? account.address) ?? undefined,
    createdAt: account.createdAt.toISOString(),
  };
}

// ── Incident mapping ─────────────────────────────────────────────────────────
// Shape of a Report row loaded with citizen+updatedReport relations.
export type ReportWithRelations = Prisma.ReportGetPayload<{
  include: { citizen: true; updatedReport: true };
}>;

export function mapReportToIncident(r: ReportWithRelations): Incident {
  const status = (r.updatedReport?.status ?? "Pending") as IncidentStatus;
  return {
    id: String(r.reportId),
    userId: r.contactNumber,
    reporterName: r.citizen?.fullName ?? "Unknown reporter",
    type: r.typeOfReport,
    community: "", // Populated by the route when needed (from Account/Community).
    location: r.location,
    description: r.description,
    photoUrl: r.photoUrl ?? undefined,
    status,
    updateNote: r.updatedReport?.actionTaken ?? undefined,
    createdAt: r.createdAt.toISOString(),
    updatedAt: (r.updatedReport?.updatedAt ?? r.createdAt).toISOString(),
  };
}
