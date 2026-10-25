"use server";

import { refresh } from "next/cache";
import type { ActionResult } from "@/components/use-action-toast";
import { areaNameSchema, parseBookingHoursForm, tableSchema } from "@/lib/booking-settings";
import { localParts, shiftDate, toInstant } from "@/lib/bookings";
import { getCurrentUser, hasPermission } from "@/lib/dal";
import { db } from "@/lib/db";

const NO_ACCESS = { error: "Only the owner can change settings." };

export async function saveBookingHours(_previous: ActionResult, form: FormData): Promise<ActionResult> {
  if (!(await hasPermission("settings.manage"))) return NO_ACCESS;
  const parsed = parseBookingHoursForm(form);
  if ("error" in parsed) return { error: parsed.error };

  await db.$transaction([
    db.bookingSettings.upsert({ where: { id: 1 }, update: parsed.settings, create: { id: 1, ...parsed.settings } }),
    ...parsed.hours.map(({ dayOfWeek, ...hours }) =>
      db.openingHours.upsert({ where: { dayOfWeek }, update: hours, create: { dayOfWeek, ...hours } }),
    ),
  ]);
  refresh();
  return { ok: true };
}

export async function renameArea(_previous: ActionResult, form: FormData): Promise<ActionResult> {
  if (!(await hasPermission("settings.manage"))) return NO_ACCESS;
  const name = areaNameSchema.safeParse(form.get("name"));
  if (!name.success) return { error: name.error.issues[0].message };

  const taken = await db.area.findFirst({ where: { name: name.data, NOT: { id: String(form.get("id")) } } });
  if (taken) return { error: `Another section is already called "${name.data}".` };

  await db.area.update({ where: { id: String(form.get("id")) }, data: { name: name.data } });
  refresh();
  return { ok: true };
}

export async function updateTable(_previous: ActionResult, form: FormData): Promise<ActionResult> {
  if (!(await hasPermission("settings.manage"))) return NO_ACCESS;
  const parsed = tableSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.table.update({ where: { id: String(form.get("id")) }, data: parsed.data });
  refresh();
  return { ok: true };
}

/** Closes a section for one day (D-033). Refused while it still has active bookings that day. */
export async function closeSection(_previous: ActionResult, form: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!(await hasPermission("settings.manage"))) return NO_ACCESS;

  const areaId = String(form.get("areaId"));
  const date = String(form.get("date"));
  const reason = String(form.get("reason") ?? "").trim().slice(0, 200) || null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Pick a date." };
  if (date < localParts(new Date()).date) return { error: "Pick today or a later date." };

  const area = await db.area.findUnique({ where: { id: areaId }, select: { name: true } });
  if (!area) return { error: "This section no longer exists." };
  const bookings = await db.booking.count({
    where: {
      status: { in: ["BOOKED", "SEATED"] },
      startAt: { gte: toInstant(date, 0), lt: toInstant(shiftDate(date, 1), 0) },
      tables: { some: { table: { areaId } } },
    },
  });
  if (bookings > 0) {
    return { error: `${area.name} has ${bookings} active ${bookings === 1 ? "booking" : "bookings"} that day. Move or cancel them first.` };
  }

  const existing = await db.areaClosure.findUnique({ where: { areaId_date: { areaId, date: new Date(`${date}T00:00:00Z`) } } });
  if (existing) return { error: `${area.name} is already closed that day.` };
  await db.areaClosure.create({ data: { areaId, date: new Date(`${date}T00:00:00Z`), reason, createdById: user.id } });
  refresh();
  return { ok: true };
}

export async function reopenSection(_previous: ActionResult, form: FormData): Promise<ActionResult> {
  if (!(await hasPermission("settings.manage"))) return NO_ACCESS;
  await db.areaClosure.deleteMany({ where: { id: String(form.get("id")) } });
  refresh();
  return { ok: true };
}
