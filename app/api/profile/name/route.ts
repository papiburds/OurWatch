// POST /api/profile/name — change the signed-in user's display name.
// Writes to ACCOUNT.name plus CITIZEN.Full_name or BRGY_OFFICIAL.Official_name
// depending on which profile the Account is linked to.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { fullName } = (await req.json().catch(() => ({}))) as { fullName?: string };
  const trimmed = (fullName ?? "").trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  }

  const account = await prisma.account.findUnique({
    where: { accountId: session.accountId },
  });
  if (!account) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.account.update({
      where: { accountId: account.accountId },
      data: { name: trimmed },
    });
    if (account.contactNumber) {
      await tx.citizen.update({
        where: { contactNumber: account.contactNumber },
        data: { fullName: trimmed },
      });
    } else if (account.officialId) {
      await tx.brgyOfficial.update({
        where: { officialId: account.officialId },
        data: { officialName: trimmed },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
