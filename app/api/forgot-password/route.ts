// POST /api/forgot-password
// Generates a temporary password and writes its hash to ACCOUNT.
// We return the temp password in the response body so you can test the flow
// locally without an SMTP setup. In production you'd email it and ALWAYS
// respond with { ok: true } regardless of whether the email exists (to avoid
// leaking account enumeration info).

import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/api-helpers";

function generateTempPassword(): string {
  // 12 chars, guaranteed to pass the UI's strong-password regex.
  const random = crypto.randomBytes(6).toString("base64url").slice(0, 8);
  return `Ow!${random}1A`;
}

export async function POST(req: Request) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  const normalized = (email ?? "").trim().toLowerCase();

  if (!normalized) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const account = await prisma.account.findUnique({ where: { email: normalized } });
  if (!account) {
    // Silent success to avoid leaking whether the email exists.
    return NextResponse.json({ ok: true });
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  await prisma.account.update({
    where: { accountId: account.accountId },
    data: { passwordHash },
  });

  // TODO: send `tempPassword` via email in production.
  console.log(`[forgot-password] Temp password for ${normalized}: ${tempPassword}`);

  return NextResponse.json({
    ok: true,
    // Exposed for local testing only — remove before deploying.
    devTempPassword: tempPassword,
  });
}
