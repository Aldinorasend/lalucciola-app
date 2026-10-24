import { z } from "zod";
import { toMinutes, toTime } from "@/lib/booking-settings";

// Booking rules from wiki/modules/booking.md and wiki/architecture/data-model.md.

// shortcut: fixed UTC+7 because Asia/Jakarta has no daylight saving (D-028);
// switch to a time-zone library if the restaurant ever uses a zone with DST.
const UTC_OFFSET_MINUTES = 7 * 60;

/** The UTC instant for a restaurant-local date ("YYYY-MM-DD") and minutes after midnight. */
export function toInstant(date: string, minutes: number) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day) + (minutes - UTC_OFFSET_MINUTES) * 60_000);
}

/** Restaurant-local date, minutes after midnight and weekday (0 = Sunday) of an instant. */
export function localParts(instant: Date) {
  const local = new Date(instant.getTime() + UTC_OFFSET_MINUTES * 60_000);
  return {
    date: local.toISOString().slice(0, 10),
    minutes: local.getUTCHours() * 60 + local.getUTCMinutes(),
    dayOfWeek: local.getUTCDay(),
  };
}

// Calendar dates ("YYYY-MM-DD") are restaurant-local and handled as UTC midnight so no zone shifts them.
export function shiftDate(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function dayOfWeek(date: string) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export function formatDay(date: string, options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" }) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { ...options, timeZone: "UTC" });
}

/** Monday-to-Sunday dates of the week containing `date`. */
export function weekDates(date: string) {
  const monday = shiftDate(date, -((dayOfWeek(date) + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => shiftDate(monday, index));
}

/** Full Monday-to-Sunday weeks covering the month of `date`. */
export function monthWeeks(date: string) {
  const first = `${date.slice(0, 7)}-01`;
  const weeks: string[][] = [];
  for (let week = weekDates(first); week[0].slice(0, 7) <= date.slice(0, 7); week = weekDates(shiftDate(week[0], 7))) {
    weeks.push(week);
  }
  return weeks;
}

export function formatLocalTime(instant: Date) {
  return toTime(localParts(instant).minutes);
}

export const ACTIVE_STATUSES = ["BOOKED", "SEATED"] as const;
export type BookingStatus = "BOOKED" | "SEATED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  BOOKED: ["SEATED", "CANCELLED", "NO_SHOW"],
  SEATED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus) {
  return TRANSITIONS[from].includes(to);
}

/** Derived, never stored (D-020): still BOOKED after start + grace. */
export function isLate(booking: { status: BookingStatus; startAt: Date }, now: Date, graceMinutes: number) {
  return booking.status === "BOOKED" && now.getTime() > booking.startAt.getTime() + graceMinutes * 60_000;
}

/** Start time must be on a slot inside that weekday's booking window (D-037, D-038). */
export function checkStartTime(minutes: number, hours: { firstBookingAt: number; lastBookingAt: number }, slotMinutes: number) {
  if (minutes < hours.firstBookingAt || minutes > hours.lastBookingAt) {
    return `Bookings start between ${toTime(hours.firstBookingAt)} and ${toTime(hours.lastBookingAt)} that day.`;
  }
  if (minutes % slotMinutes) return `Pick a time on the ${slotMinutes}-minute slots.`;
  return null;
}

/** Party must fit; several tables only if all are combinable (D-019). */
export function checkTables(
  tables: { label: string; maxSeats: number; combinable: boolean; active: boolean }[],
  partySize: number,
) {
  if (tables.length === 0) return "Pick at least one table.";
  const inactive = tables.find((table) => !table.active);
  if (inactive) return `Table ${inactive.label} is switched off.`;
  if (tables.length > 1) {
    const single = tables.find((table) => !table.combinable);
    if (single) return `Table ${single.label} can't be combined with other tables.`;
  }
  const seats = tables.reduce((sum, table) => sum + table.maxSeats, 0);
  if (partySize > seats) return `${partySize} guests don't fit: the chosen tables seat ${seats}.`;
  return null;
}

export function overlaps(a: { startAt: Date; endAt: Date }, b: { startAt: Date; endAt: Date }) {
  return a.startAt < b.endAt && b.startAt < a.endAt;
}

const optionalText = (max: number) =>
  z.preprocess((value) => (typeof value === "string" && value.trim() ? value.trim() : undefined), z.string().max(max).optional());

export const bookingSchema = z
  .object({
    guestName: z.string().trim().min(1, "Enter the guest's name").max(80, "Name is too long"),
    guestPhone: optionalText(30).refine((phone) => !phone || /^[+\d][\d\s-]{5,}$/.test(phone), "Enter a valid phone number"),
    partySize: z.coerce.number().int("Party size must be a whole number").min(1, "Party size must be at least 1").max(60, "Party size is too large"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
    time: z.string().refine((time) => !Number.isNaN(toMinutes(time)), "Pick a time"),
    source: z.enum(["PHONE", "WHATSAPP", "WALK_IN", "OTHER"]),
    notes: optionalText(200),
    tableIds: z.array(z.string().min(1)).min(1, "Pick at least one table"),
  })
  // Phone is optional only for walk-ins (D-021).
  .refine((booking) => booking.source === "WALK_IN" || booking.guestPhone, { message: "Enter a phone number", path: ["guestPhone"] });

export function parseBookingForm(form: FormData) {
  return bookingSchema.safeParse({ ...Object.fromEntries(form), tableIds: form.getAll("tableIds") });
}
