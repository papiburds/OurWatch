// POST /api/register
// Creates a new ACCOUNT row, plus a matching CITIZEN or BRGY_OFFICIAL row,
// then sets the session cookie. Responds with the AppUser shape.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/api-helpers";
import { setSessionCookie } from "@/lib/session";
import type { AppUser, UserRole } from "@/lib/types";

interface RegisterBody {
  fullName?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  contactNumber?: string;
  address?: string;
  position?: string; // Officials only
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
  const role: UserRole = body.role === "Captain" ? "Captain" : "Citizen";
  const contactNumber = (body.contactNumber ?? "").trim();
  const address = (body.address ?? "").trim() || null;

  if (!fullName || !email || !password) {
    return NextResponse.json(
      { error: "Full name, email, and password are required." },
      { status: 400 },
    );
  }
  if (role === "Citizen" && !contactNumber) {
    return NextResponse.json(
      { error: "Contact number is required for Citizen accounts." },
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

  // If registering as a Citizen, the contact_number must be unique too.
  if (role === "Citizen") {
    const phoneTaken = await prisma.citizen.findUnique({
      where: { contactNumber },
    });
    if (phoneTaken) {
      return NextResponse.json(
        { error: "This contact number is already registered." },
        { status: 409 },
      );
    }
  }

  const passwordHash = await hashPassword(password);

  // Create the dependent profile first (Citizen or Official), then the
  // Account row that references it.
  try {
    const account = await prisma.$transaction(async (tx) => {
      if (role === "Citizen") {
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
            address,
            contactInformation: contactNumber,
            contactNumber,
          },
        });
      }

      const official = await tx.brgyOfficial.create({
        data: {
          officialName: fullName,
          position: (body.position ?? "Barangay Captain").trim() || "Barangay Captain",
          contactInfo: contactNumber || null,
          accountStatus: "Active",
        },
      });
      return tx.account.create({
        data: {
          name: fullName,
          email,
          passwordHash,
          address,
          contactInformation: contactNumber || null,
          officialId: official.officialId,
        },
      });
    });

    await setSessionCookie({
      accountId: account.accountId,
      email: account.email,
      role,
    });

    const user: AppUser = {
      uid: String(account.accountId),
      fullName,
      email: account.email,
      role,
      contactNumber: role === "Citizen" ? contactNumber : undefined,
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
