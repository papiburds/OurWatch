// POST /api/register
// Creates a Citizen ACCOUNT + CITIZEN row, then sets the session cookie.
// Self-registration is restricted to the Citizen role. The Barangay Captain
// account is created via seed. Additional administrative accounts are
// provisioned by the Captain from the monitoring dashboard.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/api-helpers";
import { setSessionCookie } from "@/lib/session";
import type { AppUser } from "@/lib/types";

interface RegisterBody {
  fullName?: string;
  email?: string;
  password?: string;
  contactNumber?: string;
  address?: string;
}

export async function POST(req: Request) {
  let body: RegisterBody;
  try {
    body = (await req.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const fullName = (body.fullName ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const contactNumber = (body.contactNumber ?? "").trim();
  const address = (body.address ?? "").trim() || null;

  if (!fullName || !email || !password) {
    return NextResponse.json(
      { error: "Full name, email, and password are required." },
      { status: 400 },
    );
  }
  if (!contactNumber) {
    return NextResponse.json(
      { error: "Contact number is required." },
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

  const phoneTaken = await prisma.citizen.findUnique({
    where: { contactNumber },
  });
  if (phoneTaken) {
    return NextResponse.json(
      { error: "This contact number is already registered." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);

  try {
    const account = await prisma.$transaction(async (tx) => {
      await tx.citizen.create({
        data: {
          contactNumber,
          fullName,
          address,
        },
      });
      return tx.account.create({
        data: {
          name: fullName,
          email,
          passwordHash,
          role: "Citizen",
          status: "Approved",
          address,
          contactInformation: contactNumber,
          contactNumber,
        },
      });
    });

    await setSessionCookie({
      accountId: account.accountId,
      email: account.email,
      role: "Citizen",
    });

    const user: AppUser = {
      uid: String(account.accountId),
      fullName,
      email: account.email,
      role: "Citizen",
      contactNumber,
      address: address ?? undefined,
      createdAt: account.createdAt.toISOString(),
    };
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error("[register] DB error:", err);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 },
    );
  }
}
