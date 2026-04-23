// POST /api/login
// Verifies the email + password against ACCOUNT.password_hash, then sets
// the session cookie and returns the AppUser.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResolvedRole, verifyPassword } from "@/lib/api-helpers";
import { setSessionCookie } from "@/lib/session";
import type { AppUser } from "@/lib/types";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const account = await prisma.account.findUnique({
    where: { email },
    include: { citizen: true, official: true },
  });
  if (!account) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const ok = await verifyPassword(password, account.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (account.role === "Captain" && !account.officialId) {
    return NextResponse.json({ error: "Invalid account role configuration." }, { status: 403 });
  }

  if (account.role === "Admin" && account.status !== "Approved") {
    const msg =
      account.status === "Rejected"
        ? "This administrative account has been rejected by the Barangay Captain."
        : "This administrative account is pending approval by the Barangay Captain.";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const role: AppUser["role"] = getResolvedRole(account);
  const fullName =
    (role === "Captain" ? account.official?.officialName : account.citizen?.fullName) ||
    account.name;

  await setSessionCookie({ accountId: account.accountId, email: account.email, role });

  const user: AppUser = {
    uid: String(account.accountId),
    fullName,
    email: account.email,
    role,
    contactNumber: account.citizen?.contactNumber ?? undefined,
    address: (account.citizen?.address ?? account.address) ?? undefined,
    createdAt: account.createdAt.toISOString(),
  };
  return NextResponse.json(user);
}
