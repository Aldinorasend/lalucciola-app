import { z } from "zod";

// Booking hours are stored as minutes after midnight, restaurant time (D-028).
export const EARLIEST_BOOKING = 6 * 60; // 06:00 (D-034)
export const LATEST_BOOKING = 20 * 60; // 20:00 is the last booking time (D-037)

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function toTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function toMinutes(time: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return NaN;
  const [hours, minutes] = [Number(match[1]), Number(match[2])];
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : NaN;
}

const minutesField = (label: string, min: number, max: number) =>
  z.coerce.number().int(`${label} must be a whole number`).min(min, `${label} must be at least ${min}`).max(max, `${label} must be at most ${max}`);

const settingsSchema = z
  .object({
    slotMinutes: minutesField("Slot length", 5, 60).refine((slot) => 60 % slot === 0, "Slot length must divide an hour (5, 10, 15, 20, 30 or 60)"),
    diningMinutes: minutesField("Dining duration", 15, 360),
    reservedSoonMinutes: minutesField("Reserved soon", 0, 240),
    lateGraceMinutes: minutesField("Late grace", 0, 120),
  })
  .refine((s) => s.diningMinutes % s.slotMinutes === 0, "Dining duration must be a multiple of the slot length");

export type HoursRow = { dayOfWeek: number; firstBookingAt: number; lastBookingAt: number };

// Parses the "Booking hours & slots" form. Returns an error message or the values to save.
export function parseBookingHoursForm(form: FormData) {
  const settings = settingsSchema.safeParse(Object.fromEntries(["slotMinutes", "diningMinutes", "reservedSoonMinutes", "lateGraceMinutes"].map((key) => [key, form.get(key)])));
  if (!settings.success) return { error: settings.error.issues[0].message } as const;
  const { slotMinutes } = settings.data;

  const hours: HoursRow[] = [];
  for (const [dayOfWeek, day] of WEEKDAYS.entries()) {
    const first = toMinutes(String(form.get(`first-${dayOfWeek}`)));
    const last = toMinutes(String(form.get(`last-${dayOfWeek}`)));
    if (Number.isNaN(first) || Number.isNaN(last)) return { error: `${day}: enter times as HH:MM` } as const;
    if (first < EARLIEST_BOOKING || last > LATEST_BOOKING) return { error: `${day}: bookings must start between 06:00 and 20:00` } as const;
    if (first > last) return { error: `${day}: first booking must be before the last booking` } as const;
    if (first % slotMinutes || last % slotMinutes) return { error: `${day}: times must fall on ${slotMinutes}-minute slots` } as const;
    hours.push({ dayOfWeek, firstBookingAt: first, lastBookingAt: last });
  }
  return { settings: settings.data, hours } as const;
}

export const tableSchema = z
  .object({
    minSeats: z.coerce.number().int().min(1, "Min seats must be at least 1"),
    maxSeats: z.coerce.number().int().max(30, "Max seats must be at most 30"),
    areaId: z.string().min(1, "Pick a section"),
    // Checkboxes send "on" when ticked and nothing when not.
    combinable: z.preprocess((value) => value === "on", z.boolean()),
    active: z.preprocess((value) => value === "on", z.boolean()),
  })
  .refine((t) => t.maxSeats >= t.minSeats, "Max seats must be at least min seats");

export const areaNameSchema = z.string().trim().min(1, "Section name can't be empty").max(40, "Section name is too long");
