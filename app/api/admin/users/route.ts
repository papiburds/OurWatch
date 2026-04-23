// GET  /api/admin/users  → list of admin/captain accounts (admin-level access)
// POST /api/admin/users  → Captain-only: provision a new admin as "Pending"

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword, isAdminRole } from "@/lib/api-helpers";

interface CreateAdminBody {
  fullName?: string;
  email?: string;
  password?: string;
}

export async function POST(req: Request) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (actor.role !== "Captain") {
    return NextResponse.json(
      { error: "Only the Barangay Captain can assign administrative users." },
      { status: 403 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as CreateAdminBody;
  const fullName = (body.fullName ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!fullName || !email || !password) {
    return NextResponse.json(
      { error: "Full name, email, and password are required." },
      { status: 400 },
    );
  }

  const existing = await prisma.account.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const account = await prisma.account.create({
    data: {
      name: fullName,
      email,
      passwordHash,
      role: "Admin",
      status: "Pending",
    },
  });

  return NextResponse.json({
    uid: String(account.accountId),
    fullName: account.name,
    email: account.email,
    role: "Admin",
    status: account.status,
    createdAt: account.createdAt.toISOString(),
  });
}

export async function GET() {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!isAdminRole(actor.role)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const admins = await prisma.account.findMany({
    where: { role: { in: ["Captain", "Admin"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      accountId: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    admins.map((a) => ({
      uid: String(a.accountId),
      fullName: a.name,
      email: a.email,
      role: a.role,
      status: a.status,
      createdAt: a.createdAt.toISOString(),
    })),
  );
}
