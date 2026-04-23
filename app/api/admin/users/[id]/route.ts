// PATCH  /api/admin/users/[id]  → Captain-only: Approve / Reject an admin
// DELETE /api/admin/users/[id]  → Captain-only: remove an admin (including self-removal)
//
// RBAC rule enforced here:
//   The system must always retain at least ONE active administrator.
//   An "active administrator" = an Account with role Captain, OR role Admin
//   with status = Approved. Pending / Rejected admins do NOT count.
//
//   → Deleting the last administrator is blocked.
//   → Approving keeps/raises the count.
//   → Rejecting a previously Approved admin is blocked if it would drop the
//     count to zero.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-helpers";
import { clearSessionCookie } from "@/lib/session";

type AdminAction = "Approved" | "Rejected";

interface PatchBody {
  status?: AdminAction;
}

interface AdminRow {
  accountId: number;
  name: string;
  email: string;
  role: "Citizen" | "Captain" | "Admin";
  status: "Pending" | "Approved" | "Rejected";
  officialId: number | null;
  createdAt: Date;
}

async function loadTargetAdmin(idRaw: string): Promise<AdminRow | null> {
  const accountId = Number(idRaw);
  if (!Number.isFinite(accountId)) return null;
  return prisma.account.findUnique({
    where: { accountId },
    select: {
      accountId: true,
      name: true,
      email: true,
      role: true,
      status: true,
      officialId: true,
      createdAt: true,
    },
  });
}

function isActiveAdministrator(row: {
  role: AdminRow["role"];
  status: AdminRow["status"];
}) {
  return row.role === "Captain" || (row.role === "Admin" && row.status === "Approved");
}

async function countActiveAdministratorsExcluding(excludeAccountId?: number) {
  return prisma.account.count({
    where: {
      AND: [
        excludeAccountId ? { accountId: { not: excludeAccountId } } : {},
        {
          OR: [
            { role: "Captain" },
            { role: "Admin", status: "Approved" },
          ],
        },
      ],
    },
  });
}

function serialize(row: AdminRow) {
  return {
    uid: String(row.accountId),
    fullName: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (actor.role !== "Captain") {
    return NextResponse.json(
      { error: "Only the Barangay Captain can modify administrative users." },
      { status: 403 },
    );
  }

  const { id } = await ctx.params;
  const target = await loadTargetAdmin(id);
  if (!target) {
    return NextResponse.json({ error: "Administrative user not found." }, { status: 404 });
  }
  if (target.role !== "Admin") {
    return NextResponse.json(
      { error: "Only Admin accounts can be approved or rejected." },
      { status: 400 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as PatchBody;
  const nextStatus = body.status;
  if (nextStatus !== "Approved" && nextStatus !== "Rejected") {
    return NextResponse.json(
      { error: "status must be either 'Approved' or 'Rejected'." },
      { status: 400 },
    );
  }

  // Protect the at-least-one-administrator invariant when demoting an
  // already-Approved admin via Reject.
  if (nextStatus === "Rejected" && target.status === "Approved") {
    const remaining = await countActiveAdministratorsExcluding(target.accountId);
    if (remaining < 1) {
      return NextResponse.json(
        {
          error:
            "At least one administrator must remain. Create or approve another administrator before rejecting this one.",
        },
        { status: 400 },
      );
    }
  }

  const updated = await prisma.account.update({
    where: { accountId: target.accountId },
    data: { status: nextStatus },
    select: {
      accountId: true,
      name: true,
      email: true,
      role: true,
      status: true,
      officialId: true,
      createdAt: true,
    },
  });

  return NextResponse.json(serialize(updated));
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (actor.role !== "Captain") {
    return NextResponse.json(
      { error: "Only the Barangay Captain can remove administrative users." },
      { status: 403 },
    );
  }

  const { id } = await ctx.params;
  const target = await loadTargetAdmin(id);
  if (!target) {
    return NextResponse.json({ error: "Administrative user not found." }, { status: 404 });
  }

  // If the target currently counts as an active administrator, ensure at
  // least one administrator will remain after deletion.
  if (isActiveAdministrator(target)) {
    const remaining = await countActiveAdministratorsExcluding(target.accountId);
    if (remaining < 1) {
      return NextResponse.json(
        {
          error:
            "At least one administrator must remain. Create and approve another administrator before removing this one.",
        },
        { status: 400 },
      );
    }
  }

  const isSelfRemoval = actor.uid === String(target.accountId);

  // Deleting a Captain account also cleans up its linked BrgyOfficial row so
  // the seed can repopulate cleanly if ever needed.
  //
  // If the target is the LAST Captain in the system, we automatically promote
  // the most senior Approved Admin to Captain in the same transaction so the
  // system never ends up in a state where nobody can assign new admins. The
  // at-least-one-administrator check above already guarantees a successor
  // exists when a Captain row can be deleted at all.
  const promoted = await prisma.$transaction(async (tx) => {
    let promotedRow: {
      accountId: number;
      name: string;
      email: string;
    } | null = null;

    if (target.role === "Captain") {
      const otherCaptains = await tx.account.count({
        where: {
          role: "Captain",
          accountId: { not: target.accountId },
        },
      });
      if (otherCaptains === 0) {
        const successor = await tx.account.findFirst({
          where: {
            role: "Admin",
            status: "Approved",
            accountId: { not: target.accountId },
          },
          orderBy: { createdAt: "asc" },
          select: { accountId: true, name: true, email: true },
        });
        if (successor) {
          const official = await tx.brgyOfficial.create({
            data: {
              officialName: successor.name,
              position: "Barangay Captain",
              accountStatus: "Active",
            },
          });
          await tx.account.update({
            where: { accountId: successor.accountId },
            data: {
              role: "Captain",
              status: "Approved",
              officialId: official.officialId,
            },
          });
          promotedRow = successor;
        }
      }
    }

    await tx.account.delete({ where: { accountId: target.accountId } });
    if (target.role === "Captain" && target.officialId) {
      await tx.brgyOfficial
        .delete({ where: { officialId: target.officialId } })
        .catch(() => undefined);
    }

    return promotedRow;
  });

  if (isSelfRemoval) {
    await clearSessionCookie();
  }

  return NextResponse.json({
    ok: true,
    selfRemoved: isSelfRemoval,
    promoted: promoted
      ? {
          uid: String(promoted.accountId),
          fullName: promoted.name,
          email: promoted.email,
        }
      : null,
  });
}
