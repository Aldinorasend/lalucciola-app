import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const email = process.env.SEED_OWNER_EMAIL;
  const password = process.env.SEED_OWNER_PASSWORD;
  if (!email || !password) {
    throw new Error("Set SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD (see .env.example).");
  }

  const owner = await db.user.upsert({
    where: { email },
    update: {},
    create: {
      name: process.env.SEED_OWNER_NAME ?? "Owner",
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: "OWNER",
    },
  });
  console.log(`Owner account ready: ${owner.email}`);

  // Optional demo accounts for testing role permissions locally.
  const demoPassword = process.env.SEED_DEMO_PASSWORD;
  if (!demoPassword) return;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to create demo accounts in production.");
  }

  const demoUsers = [
    { name: "Demo Manager", email: "manager@lalucciola.local", role: "MANAGER" as const },
    { name: "Demo Staff", email: "staff@lalucciola.local", role: "STAFF" as const },
  ];
  const passwordHash = await bcrypt.hash(demoPassword, 12);
  for (const user of demoUsers) {
    await db.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, passwordHash },
    });
    console.log(`Demo account ready: ${user.email} (${user.role})`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
