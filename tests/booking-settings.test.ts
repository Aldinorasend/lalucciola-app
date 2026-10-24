import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBookingHoursForm, tableSchema, toMinutes, toTime } from "../lib/booking-settings";

function hoursForm(overrides: Record<string, string> = {}) {
  const form = new FormData();
  const values: Record<string, string> = { slotMinutes: "15", diningMinutes: "90", reservedSoonMinutes: "30", lateGraceMinutes: "15", ...overrides };
  for (let day = 0; day < 7; day++) {
    values[`first-${day}`] ??= "06:00";
    values[`last-${day}`] ??= "20:00";
  }
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  return form;
}

test("time conversion round-trips and rejects bad input", () => {
  assert.equal(toMinutes("06:00"), 360);
  assert.equal(toTime(1200), "20:00");
  assert.equal(toTime(toMinutes("18:45")), "18:45");
  assert.ok(Number.isNaN(toMinutes("6:00")));
  assert.ok(Number.isNaN(toMinutes("25:00")));
});

test("default hours are valid", () => {
  const result = parseBookingHoursForm(hoursForm());
  assert.ok(!("error" in result));
  assert.equal(result.hours.length, 7);
  assert.deepEqual(result.hours[1], { dayOfWeek: 1, firstBookingAt: 360, lastBookingAt: 1200 });
});

test("hours outside 06:00–20:00, reversed or off-slot are rejected", () => {
  assert.match(parseBookingHoursForm(hoursForm({ "first-2": "05:45" })).error ?? "", /Tuesday: bookings must start between/);
  assert.match(parseBookingHoursForm(hoursForm({ "last-2": "20:15" })).error ?? "", /between 06:00 and 20:00/);
  assert.match(parseBookingHoursForm(hoursForm({ "first-3": "19:00", "last-3": "18:00" })).error ?? "", /before the last/);
  assert.match(parseBookingHoursForm(hoursForm({ "first-4": "07:10" })).error ?? "", /15-minute slots/);
});

test("slot and dining duration must line up", () => {
  assert.match(parseBookingHoursForm(hoursForm({ slotMinutes: "25" })).error ?? "", /divide an hour/);
  assert.match(parseBookingHoursForm(hoursForm({ slotMinutes: "30", diningMinutes: "75" })).error ?? "", /multiple of the slot/);
});

test("table seats: max must cover min, checkboxes map to booleans", () => {
  const ok = tableSchema.safeParse({ minSeats: "2", maxSeats: "4", areaId: "a", combinable: "on" });
  assert.ok(ok.success);
  assert.equal(ok.data.combinable, true);
  assert.equal(ok.data.active, false);
  assert.equal(tableSchema.safeParse({ minSeats: "4", maxSeats: "2", areaId: "a" }).success, false);
});
