// POST /api/profile/password — change the signed-in user's password.
// The UI currently only sends a new password, so we replace the hash directly.
// (If you want to require the old password for extra safety, add a
// `currentPassword` field client-side and verify it here.)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/api-helpers";
import { getSession } from "@/lib/session";

const STRONG = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,}$/;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { newPassword } = (await req.json().catch(() => ({}))) as {
    newPassword?: string;
  };
  if (!newPassword || !STRONG.test(newPassword)) {
    return NextResponse.json(
      {
        error:
          "Password must be 8+ characters and include uppercase, lowercase, a number, and a special character.",
      },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.account.update({
    where: { accountId: session.accountId },
    data: { passwordHash },
  });

  return NextResponse.json({ ok: true });
}
