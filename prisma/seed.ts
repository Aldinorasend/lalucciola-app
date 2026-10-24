import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Room layout transcribed from the owner's floor plan (wiki/modules/floor-plan.md).
// Seats are estimates; the owner corrects them in Settings (D-036).
// [label, section, shape, seats, x, y, rotation]
const TABLES: [string, string, "ROUND" | "SQUARE" | "RECT", number, number, number, number][] = [
  ["101", "Section 1", "ROUND", 4, 52, 254, 0],
  ["102", "Section 1", "SQUARE", 2, 49, 153, 0],
  ["103", "Section 1", "ROUND", 4, 48, 58, 0],
  ["104", "Section 1", "ROUND", 4, 255, 62, 0],
  ["105", "Section 1", "SQUARE", 2, 256, 147, 0],
  ["106", "Section 1", "ROUND", 4, 253, 252, 0],
  ["107", "Section 1", "ROUND", 8, 151, 155, 0],
  ["201", "Section 2", "ROUND", 4, 394, 320, 0],
  ["202", "Section 2", "SQUARE", 2, 394, 235, 0],
  ["203", "Section 2", "ROUND", 6, 452, 175, 0],
  ["204", "Section 2", "RECT", 4, 413, 116, 0],
  ["205", "Section 2", "SQUARE", 2, 394, 50, 45],
  ["206", "Section 2", "RECT", 6, 559, 80, 40],
  ["207", "Section 2", "RECT", 4, 547, 130, 40],
  ["208", "Section 2", "SQUARE", 2, 534, 180, 40],
  ["209", "Section 2", "ROUND", 4, 534, 246, 0],
  ["210", "Section 2", "SQUARE", 2, 534, 322, 0],
  ["301", "Section 3", "RECT", 4, 680, 321, 0],
  ["302", "Section 3", "SQUARE", 2, 661, 235, 0],
  ["303", "Section 3", "RECT", 4, 675, 87, 0],
  ["304", "Section 3", "RECT", 4, 756, 76, 45],
  ["305", "Section 3", "SQUARE", 2, 825, 92, 0],
  ["306", "Section 3", "ROUND", 8, 747, 172, 0],
  ["307", "Section 3", "ROUND", 2, 751, 282, 0],
  ["308", "Section 3", "SQUARE", 2, 829, 261, 0],
  ["401", "Section 4", "SQUARE", 2, 797, 510, 0],
  ["402", "Section 4", "RECT", 4, 699, 510, 0],
  ["1A", "Section 4", "SQUARE", 2, 744, 510, 0],
  ["402A", "Section 4", "SQUARE", 2, 602, 510, 0],
  ["403", "Section 4", "ROUND", 4, 616, 425, 0],
  ["404", "Section 4", "RECT", 4, 728, 438, 45],
  ["405", "Section 4", "ROUND", 4, 797, 417, 0],
  ["L1", "Section L", "ROUND", 2, 46, 528, 0],
  ["L2", "Section L", "ROUND", 2, 43, 464, 0],
  ["L3", "Section L", "ROUND", 2, 48, 395, 0],
  ["L4", "Section L", "ROUND", 2, 121, 395, 0],
  ["L5", "Section L", "ROUND", 2, 222, 396, 0],
  ["L6", "Section L", "ROUND", 2, 288, 396, 0],
  ["L7", "Section L", "ROUND", 2, 287, 464, 0],
  ["L8", "Section L", "ROUND", 2, 289, 525, 0],
];
// Joined in one row on the floor plan, so they can share a booking.
const COMBINABLE = new Set(["402", "1A", "401"]);

// Creates missing rows only, so owner edits in Settings survive a re-seed.
async function seedBookingSetup() {
  await db.bookingSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  for (let day = 0; day < 7; day++) {
    await db.openingHours.upsert({ where: { dayOfWeek: day }, update: {}, create: { dayOfWeek: day } });
  }

  const sections = [...new Set(TABLES.map(([, section]) => section))];
  const areaIds = new Map<string, string>();
  for (const [sortOrder, name] of sections.entries()) {
    const area = await db.area.upsert({ where: { name }, update: {}, create: { name, sortOrder } });
    areaIds.set(name, area.id);
  }
  for (const [label, section, shape, maxSeats, posX, posY, rotation] of TABLES) {
    await db.table.upsert({
      where: { label },
      update: {},
      create: {
        label, shape, maxSeats, posX, posY, rotation,
        areaId: areaIds.get(section)!,
        combinable: COMBINABLE.has(label),
      },
    });
  }
  console.log(`Booking setup ready: ${sections.length} sections, ${TABLES.length} tables`);
}

async function main() {
  await seedBookingSetup();

  const email = process.env.SEED_OWNER_EMAIL?.toLowerCase();
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
