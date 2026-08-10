import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
});

const prisma = new PrismaClient({
  adapter
});

async function main() {
  const roles = [
    "SUPER_ADMIN",
    "ORG_ADMIN",
    "HEAD_ACCOUNTANT",
    "ACCOUNTANT",
    "APPROVER",
    "VIEWER"
  ] as const;

  for (const name of roles) {
    await prisma.role.upsert({
      where: {
        name
      },
      update: {},
      create: {
        name
      }
    });
  }

  console.log("✅ Roles seeded successfully");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });