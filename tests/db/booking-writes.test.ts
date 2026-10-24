// Runs against a real Postgres (npm run test:db). Never point DATABASE_URL at production:
// the test creates and deletes its own user, section, tables and bookings.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { db } from "../../lib/db";
import { writeBooking } from "../../lib/booking-writes";
import { toInstant } from "../../lib/bookings";

const run = `test-${Date.now()}`;
let userId = "";
let tableA = "";
let tableB = "";

const at = (minutes: number) => toInstant("2030-01-07", minutes);
const booking = (start: number, end: number, tableIds: string[], id?: string) =>
  writeBooking({
    id,
    tableIds,
    startAt: at(start),
    endAt: at(end),
    createdById: userId,
    data: { guestName: run, guestPhone: null, partySize: 2, source: "PHONE", notes: null, startAt: at(start), endAt: at(end) },
  });

before(async () => {
  userId = (await db.user.create({ data: { name: run, email: `${run}@test.local`, passwordHash: "x" } })).id;
  const area = await db.area.create({ data: { name: run } });
  tableA = (await db.table.create({ data: { label: `${run}-A`, areaId: area.id, maxSeats: 4 } })).id;
  tableB = (await db.table.create({ data: { label: `${run}-B`, areaId: area.id, maxSeats: 4 } })).id;
});

after(async () => {
  await db.booking.deleteMany({ where: { guestName: run } });
  await db.table.deleteMany({ where: { label: { startsWith: run } } });
  await db.area.deleteMany({ where: { name: run } });
  await db.user.deleteMany({ where: { email: `${run}@test.local` } });
  await db.$disconnect();
});

test("an overlapping booking on the same table is refused", async () => {
  assert.equal(await booking(19 * 60, 20 * 60 + 30, [tableA]), null);
  assert.match((await booking(20 * 60, 21 * 60 + 30, [tableA])) ?? "", /already booked then/);
  // Another table at the same time, and the same table right after, are fine.
  assert.equal(await booking(20 * 60, 21 * 60 + 30, [tableB]), null);
  assert.equal(await booking(20 * 60 + 30, 22 * 60, [tableA]), null);
});

test("editing a booking doesn't clash with itself", async () => {
  const first = await db.booking.findFirstOrThrow({ where: { guestName: run, startAt: at(19 * 60) } });
  assert.equal(await booking(19 * 60, 20 * 60 + 30, [tableA], first.id), null);
});

test("many saves for the same free table at the same moment: exactly one wins", async () => {
  // Open the pool's connections first so all saves really start together; with the lock removed,
  // several of them then win, which this test catches.
  await Promise.all(Array.from({ length: 10 }, () => db.$transaction(async (tx) => tx.$queryRaw`select pg_sleep(0.05)::text`)));
  const results = await Promise.all(Array.from({ length: 10 }, () => booking(12 * 60, 13 * 60, [tableA])));
  assert.equal(results.filter((result) => result === null).length, 1);
  assert.equal(await db.bookingTable.count({ where: { tableId: tableA, booking: { startAt: at(12 * 60) } } }), 1);
});
