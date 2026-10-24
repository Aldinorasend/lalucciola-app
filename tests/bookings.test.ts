import { test } from "node:test";
import assert from "node:assert/strict";
import { canTransition, checkStartTime, checkTables, isLate, localParts, overlaps, parseBookingForm, toInstant } from "../lib/bookings";

test("restaurant time converts to UTC and back (UTC+7)", () => {
  const instant = toInstant("2026-10-24", 19 * 60 + 30);
  assert.equal(instant.toISOString(), "2026-10-24T12:30:00.000Z");
  assert.deepEqual(localParts(instant), { date: "2026-10-24", minutes: 1170, dayOfWeek: 6 });
  // 06:00 local is still the previous day in UTC
  assert.equal(toInstant("2026-10-24", 360).toISOString(), "2026-10-23T23:00:00.000Z");
  assert.equal(localParts(toInstant("2026-10-24", 360)).date, "2026-10-24");
});

test("status changes follow the wiki diagram", () => {
  assert.ok(canTransition("BOOKED", "SEATED"));
  assert.ok(canTransition("BOOKED", "NO_SHOW"));
  assert.ok(canTransition("SEATED", "COMPLETED"));
  assert.ok(!canTransition("SEATED", "CANCELLED"));
  assert.ok(!canTransition("COMPLETED", "BOOKED"));
  assert.ok(!canTransition("CANCELLED", "SEATED"));
});

test("late only after start + grace, and only while BOOKED", () => {
  const startAt = toInstant("2026-10-24", 1170);
  const at = (minutes: number) => new Date(startAt.getTime() + minutes * 60_000);
  assert.equal(isLate({ status: "BOOKED", startAt }, at(15), 15), false);
  assert.equal(isLate({ status: "BOOKED", startAt }, at(16), 15), true);
  assert.equal(isLate({ status: "SEATED", startAt }, at(60), 15), false);
});

test("start time must be inside the window and on a slot", () => {
  const hours = { firstBookingAt: 360, lastBookingAt: 1200 };
  assert.equal(checkStartTime(1200, hours, 15), null);
  assert.match(checkStartTime(1215, hours, 15) ?? "", /between 06:00 and 20:00/);
  assert.match(checkStartTime(345, hours, 15) ?? "", /between/);
  assert.match(checkStartTime(370, hours, 15) ?? "", /15-minute/);
});

test("tables must fit the party and only combinable tables can be joined", () => {
  const t = (label: string, maxSeats: number, combinable = false, active = true) => ({ label, maxSeats, combinable, active });
  assert.equal(checkTables([t("101", 4)], 4), null);
  assert.match(checkTables([t("101", 4)], 5) ?? "", /seat 4/);
  assert.match(checkTables([t("101", 4), t("102", 2)], 5) ?? "", /101 can't be combined/);
  assert.equal(checkTables([t("402", 4, true), t("1A", 2, true), t("401", 2, true)], 8), null);
  assert.match(checkTables([t("101", 4, false, false)], 2) ?? "", /switched off/);
  assert.match(checkTables([], 2) ?? "", /at least one/);
});

test("time ranges overlap only when they share time", () => {
  const r = (start: number, end: number) => ({ startAt: new Date(start), endAt: new Date(end) });
  assert.ok(overlaps(r(0, 90), r(60, 150)));
  assert.ok(!overlaps(r(0, 90), r(90, 180)));
});

test("booking form: phone required except for walk-ins", () => {
  const form = (fields: Record<string, string>, tables = ["t1"]) => {
    const data = new FormData();
    for (const [key, value] of Object.entries({ guestName: "Ana", partySize: "2", date: "2026-10-24", time: "19:00", source: "PHONE", ...fields })) data.set(key, value);
    for (const id of tables) data.append("tableIds", id);
    return data;
  };
  assert.equal(parseBookingForm(form({})).success, false);
  assert.equal(parseBookingForm(form({ source: "WALK_IN" })).success, true);
  const ok = parseBookingForm(form({ guestPhone: "+62 812-3456-789" }, ["t1", "t2"]));
  assert.ok(ok.success);
  assert.deepEqual(ok.data.tableIds, ["t1", "t2"]);
  assert.equal(parseBookingForm(form({ guestPhone: "abc" })).success, false);
  assert.equal(parseBookingForm(form({ guestPhone: "0812345678" }, [])).success, false);
});
