// ─────────────────────────────────────────────────────────────────────────────
// Prisma client singleton.
// In Next.js dev mode, hot reload creates new PrismaClient instances on every
// file change, which exhausts the DB connection pool. We cache the instance
// on globalThis to keep a single connection across reloads.
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
