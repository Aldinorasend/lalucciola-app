"use server";

import { refresh } from "next/cache";
import type { ActionResult } from "@/components/use-action-toast";
import { areaNameSchema, parseBookingHoursForm, tableSchema } from "@/lib/booking-settings";
import { hasPermission } from "@/lib/dal";
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
