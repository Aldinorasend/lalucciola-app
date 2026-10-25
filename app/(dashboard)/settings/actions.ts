"use server";

import { refresh } from "next/cache";
import type { ActionResult } from "@/components/use-action-toast";
import { areaNameSchema, parseBookingHoursForm, tableSchema } from "@/lib/booking-settings";
import { closeArea } from "@/lib/booking-writes";
import { localParts } from "@/lib/bookings";
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

  const error = await closeArea({ areaId, date, reason, createdById: user.id });
  if (error) return { error };
  refresh();
  return { ok: true };
}

export async function reopenSection(_previous: ActionResult, form: FormData): Promise<ActionResult> {
  if (!(await hasPermission("settings.manage"))) return NO_ACCESS;
  await db.areaClosure.deleteMany({ where: { id: String(form.get("id")) } });
  refresh();
  return { ok: true };
}
