// Seeds a single default Barangay Captain account.
// Safe to run multiple times — it upserts by email.
//
// Override defaults via env:
//   DEFAULT_CAPTAIN_EMAIL
//   DEFAULT_CAPTAIN_PASSWORD
//   DEFAULT_CAPTAIN_NAME
//   DEFAULT_CAPTAIN_POSITION

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const DEFAULTS = {
  email: process.env.DEFAULT_CAPTAIN_EMAIL ?? "captain@ourwatch.local",
  password: process.env.DEFAULT_CAPTAIN_PASSWORD ?? "Captain123!",
  name: process.env.DEFAULT_CAPTAIN_NAME ?? "Barangay Captain",
  position: process.env.DEFAULT_CAPTAIN_POSITION ?? "Barangay Captain",
};

async function main() {
  const existingCaptain = await prisma.account.findFirst({ where: { role: "Captain" } });
  if (existingCaptain) {
    console.log(
      `[seed] A Barangay Captain already exists (id=${existingCaptain.accountId}, email=${existingCaptain.email}). Skipping.`,
    );
    return;
  }

  const existingByEmail = await prisma.account.findUnique({ where: { email: DEFAULTS.email } });
  if (existingByEmail) {
    console.log(
      `[seed] An account with ${DEFAULTS.email} already exists but is not a Captain. Skipping to avoid overwriting.`,
    );
    return;
  }

  const passwordHash = await bcrypt.hash(DEFAULTS.password, 10);

  await prisma.$transaction(async (tx) => {
    const official = await tx.brgyOfficial.create({
      data: {
        officialName: DEFAULTS.name,
        position: DEFAULTS.position,
        accountStatus: "Active",
      },
    });

    await tx.account.create({
      data: {
        name: DEFAULTS.name,
        email: DEFAULTS.email,
        passwordHash,
        role: "Captain",
        status: "Approved",
        officialId: official.officialId,
      },
    });
  });

  console.log("[seed] Default Barangay Captain created:");
  console.log(`       email    : ${DEFAULTS.email}`);
  console.log(`       password : ${DEFAULTS.password}`);
  console.log("[seed] Change the password immediately after first login.");
}

main()
  .catch((err) => {
    console.error("[seed] Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
