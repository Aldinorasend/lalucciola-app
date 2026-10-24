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

test("calendar helpers: shift, weekday, week and month grids", async () => {
  const { shiftDate, dayOfWeek, weekDates, monthWeeks } = await import("../lib/bookings");
  assert.equal(shiftDate("2026-10-31", 1), "2026-11-01");
  assert.equal(shiftDate("2026-03-01", -1), "2026-02-28");
  assert.equal(dayOfWeek("2026-10-24"), 6);
  // Saturday 24 Oct 2026 sits in the week Mon 19 – Sun 25
  assert.deepEqual([weekDates("2026-10-24")[0], weekDates("2026-10-24")[6]], ["2026-10-19", "2026-10-25"]);
  assert.equal(weekDates("2026-10-19")[0], "2026-10-19");
  assert.equal(weekDates("2026-10-25")[0], "2026-10-19");
  // October 2026: Thu 1 to Sat 31 → weeks starting 28 Sep … 26 Oct
  const october = monthWeeks("2026-10-15");
  assert.equal(october.length, 5);
  assert.equal(october[0][0], "2026-09-28");
  assert.equal(october.at(-1)?.[6], "2026-11-01");
  assert.ok(october.flat().includes("2026-10-31"));
});

test("table state: seated beats booked; soon within the window or when late", async () => {
  const { tableState } = await import("../lib/bookings");
  const now = toInstant("2026-10-24", 19 * 60);
  const at = (minutes: number) => toInstant("2026-10-24", minutes);
  const b = (status: "BOOKED" | "SEATED", start: number, end = start + 90) => ({ status, startAt: at(start), endAt: at(end) });
  assert.equal(tableState([], now, 30).state, "FREE");
  assert.equal(tableState([b("BOOKED", 20 * 60)], now, 30).state, "FREE");
  assert.equal(tableState([b("BOOKED", 20 * 60)], now, 30).next?.startAt.toISOString(), at(1200).toISOString());
  assert.equal(tableState([b("BOOKED", 19 * 60 + 30)], now, 30).state, "SOON");
  assert.equal(tableState([b("BOOKED", 18 * 60 + 45)], now, 30).state, "SOON"); // late, not arrived
  assert.equal(tableState([b("BOOKED", 17 * 60, 18 * 60 + 30)], now, 30).state, "FREE"); // window passed
  assert.equal(tableState([b("BOOKED", 19 * 60 + 15), b("SEATED", 18 * 60)], now, 30).state, "SEATED");
});

test("walk-in form: name defaults, phone optional, tables required", async () => {
  const { parseWalkInForm } = await import("../lib/bookings");
  const form = (fields: Record<string, string>, tables = ["t1"]) => {
    const data = new FormData();
    for (const [key, value] of Object.entries({ partySize: "2", ...fields })) data.set(key, value);
    for (const id of tables) data.append("tableIds", id);
    return data;
  };
  const ok = parseWalkInForm(form({ guestName: " " }));
  assert.ok(ok.success);
  assert.equal(ok.data.guestName, "Walk-in");
  assert.equal(ok.data.guestPhone, undefined);
  assert.equal(parseWalkInForm(form({}, [])).success, false);
  assert.equal(parseWalkInForm(form({ partySize: "0" })).success, false);
});
