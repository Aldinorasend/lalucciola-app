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

test("section closures: refused while booked, then block new bookings", async () => {
  const { closeArea } = await import("../../lib/booking-writes");
  const areaId = (await db.table.findUniqueOrThrow({ where: { id: tableA } })).areaId;
  // tableA holds bookings on 2030-01-07, so closing that day is refused.
  assert.match((await closeArea({ areaId, date: "2030-01-07", reason: null, createdById: userId })) ?? "", /active bookings that day/);
  // A free day can be closed, once.
  assert.equal(await closeArea({ areaId, date: "2030-01-08", reason: "Private event", createdById: userId }), null);
  assert.match((await closeArea({ areaId, date: "2030-01-08", reason: null, createdById: userId })) ?? "", /already closed/);
  // While closed, no booking lands on its tables that day.
  const closedDay = (minutes: number) => toInstant("2030-01-08", minutes);
  const refused = await writeBooking({
    tableIds: [tableB],
    startAt: closedDay(19 * 60),
    endAt: closedDay(20 * 60 + 30),
    createdById: userId,
    data: { guestName: run, guestPhone: null, partySize: 2, source: "PHONE", notes: null, startAt: closedDay(19 * 60), endAt: closedDay(20 * 60 + 30) },
  });
  assert.match(refused ?? "", /is closed on that day/);
  await db.areaClosure.deleteMany({ where: { areaId } });
});

test("waitlist: a party is seated once; a taken table puts it back in the queue", async () => {
  const { seatWaitlistEntry } = await import("../../lib/booking-writes");
  const waiting = (guestName: string) => db.waitlistEntry.create({ data: { guestName, partySize: 2, createdById: userId } });

  const first = await waiting(run);
  const results = await Promise.all([
    seatWaitlistEntry({ entryId: first.id, tableIds: [tableB], diningMinutes: 90, createdById: userId }),
    seatWaitlistEntry({ entryId: first.id, tableIds: [tableB], diningMinutes: 90, createdById: userId }),
  ]);
  assert.equal(results.filter((result) => result === null).length, 1);
  assert.match(results.find((result) => result !== null) ?? "", /already seated or left/);
  const seated = await db.waitlistEntry.findUniqueOrThrow({ where: { id: first.id }, include: { booking: true } });
  assert.equal(seated.status, "SEATED");
  assert.equal(seated.booking?.source, "WALK_IN");

  // tableB is now taken, so seating another party there fails and leaves it waiting.
  const second = await waiting(run);
  assert.match((await seatWaitlistEntry({ entryId: second.id, tableIds: [tableB], diningMinutes: 90, createdById: userId })) ?? "", /already booked then/);
  assert.equal((await db.waitlistEntry.findUniqueOrThrow({ where: { id: second.id } })).status, "WAITING");

  await db.waitlistEntry.deleteMany({ where: { guestName: run } });
});
