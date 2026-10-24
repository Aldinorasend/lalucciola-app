"use server";

import { refresh } from "next/cache";
import type { ActionResult } from "@/components/use-action-toast";
import { toMinutes } from "@/lib/booking-settings";
import {
  ACTIVE_STATUSES,
  type BookingStatus,
  canTransition,
  checkStartTime,
  checkTables,
  dayOfWeek,
  parseBookingForm,
  parseWalkInForm,
  toInstant,
} from "@/lib/bookings";
import { getCurrentUser, hasPermission } from "@/lib/dal";
import { db } from "@/lib/db";

const NO_ACCESS = { error: "Your role can't manage bookings." };

class BookingConflict extends Error {}

type BookingData = {
  guestName: string;
  guestPhone: string | null;
  partySize: number;
  source: "PHONE" | "WHATSAPP" | "WALK_IN" | "OTHER";
  notes: string | null;
  startAt: Date;
  endAt: Date;
  status?: "SEATED";
  seatedAt?: Date;
};

/**
 * Creates or updates a booking unless one of its tables is taken at that time.
 * Returns the clash message, or null when saved.
 */
async function writeBooking({
  id,
  tableIds,
  startAt,
  endAt,
  data,
  createdById,
}: {
  id?: string;
  tableIds: string[];
  startAt: Date;
  endAt: Date;
  data: BookingData;
  createdById: string;
}) {
  const links = tableIds.map((tableId) => ({ tableId }));
  try {
    await db.$transaction(async (tx) => {
      // Serialize saves per table so two staff can't book the same table at once.
      for (const tableId of [...tableIds].sort()) {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${tableId}))::text`;
      }
      const clash = await tx.bookingTable.findFirst({
        where: {
          tableId: { in: tableIds },
          bookingId: id ? { not: id } : undefined,
          booking: { status: { in: [...ACTIVE_STATUSES] }, startAt: { lt: endAt }, endAt: { gt: startAt } },
        },
        select: { table: { select: { label: true } }, booking: { select: { guestName: true } } },
      });
      if (clash) throw new BookingConflict(`Table ${clash.table.label} is already booked then (${clash.booking.guestName}).`);

      if (id) {
        await tx.booking.update({ where: { id }, data: { ...data, tables: { deleteMany: {}, create: links } } });
      } else {
        await tx.booking.create({ data: { ...data, createdById, tables: { create: links } } });
      }
    });
  } catch (error) {
    if (error instanceof BookingConflict) return error.message;
    throw error;
  }
  return null;
}

export async function saveBooking(_previous: ActionResult, form: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!(await hasPermission("bookings.manage"))) return NO_ACCESS;

  const parsed = parseBookingForm(form);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { date, time, tableIds, ...guest } = parsed.data;
  const id = form.get("id") ? String(form.get("id")) : undefined;

  const minutes = toMinutes(time);
  const [settings, hours, tables, existing] = await Promise.all([
    db.bookingSettings.findUnique({ where: { id: 1 } }),
    db.openingHours.findUnique({ where: { dayOfWeek: dayOfWeek(date) } }),
    db.table.findMany({ where: { id: { in: tableIds } } }),
    id ? db.booking.findUnique({ where: { id }, select: { status: true } }) : null,
  ]);
  if (!settings || !hours) return { error: "Booking settings are missing. Ask the owner to check Settings." };
  if (id && !existing) return { error: "This booking no longer exists." };
  if (existing && !(ACTIVE_STATUSES as readonly string[]).includes(existing.status)) {
    return { error: "Only booked or seated bookings can be edited." };
  }
  if (tables.length !== tableIds.length) return { error: "A chosen table no longer exists. Reload and try again." };

  const problem = checkStartTime(minutes, hours, settings.slotMinutes) ?? checkTables(tables, guest.partySize);
  if (problem) return { error: problem };

  const startAt = toInstant(date, minutes);
  const endAt = new Date(startAt.getTime() + settings.diningMinutes * 60_000);
  const data = { ...guest, guestPhone: guest.guestPhone ?? null, notes: guest.notes ?? null, startAt, endAt };

  const conflict = await writeBooking({ id, tableIds, startAt, endAt, data, createdById: user.id });
  if (conflict) return { error: conflict };

  refresh();
  return { ok: true };
}

export async function changeBookingStatus(_previous: ActionResult, form: FormData): Promise<ActionResult> {
  if (!(await hasPermission("bookings.manage"))) return NO_ACCESS;

  const id = String(form.get("id"));
  const to = String(form.get("status")) as BookingStatus;
  const booking = await db.booking.findUnique({ where: { id }, select: { status: true } });
  if (!booking) return { error: "This booking no longer exists." };
  if (!canTransition(booking.status, to)) return { error: `A ${booking.status.toLowerCase()} booking can't become ${to.toLowerCase()}.` };

  const reason = String(form.get("reason") ?? "").trim();
  if (to === "CANCELLED" && !reason) return { error: "Enter a reason for cancelling." };

  const now = new Date();
  const stamps = {
    SEATED: { seatedAt: now },
    COMPLETED: { completedAt: now },
    CANCELLED: { cancelledAt: now, cancelReason: reason.slice(0, 200) },
    NO_SHOW: {},
    BOOKED: {},
  }[to];

  // Only apply if nobody changed the status in the meantime.
  const { count } = await db.booking.updateMany({ where: { id, status: booking.status }, data: { status: to, ...stamps } });
  if (count === 0) return { error: "Someone else just changed this booking. Reload to see it." };

  refresh();
  return { ok: true };
}

export type TableOption = {
  id: string;
  label: string;
  section: string;
  maxSeats: number;
  combinable: boolean;
  busyWith: string | null;
};

/** Active tables with who holds them at the given date and time, for the booking form. */
export async function getTableOptions(date: string, time: string, excludeBookingId?: string): Promise<TableOption[]> {
  if (!(await hasPermission("bookings.manage"))) return [];
  const minutes = toMinutes(time);
  const settings = await db.bookingSettings.findUnique({ where: { id: 1 } });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(minutes) || !settings) return [];

  const startAt = toInstant(date, minutes);
  const endAt = new Date(startAt.getTime() + settings.diningMinutes * 60_000);
  const tables = await db.table.findMany({
    where: { active: true },
    orderBy: [{ area: { sortOrder: "asc" } }, { label: "asc" }],
    select: {
      id: true,
      label: true,
      maxSeats: true,
      combinable: true,
      area: { select: { name: true } },
      bookings: {
        where: {
          bookingId: excludeBookingId ? { not: excludeBookingId } : undefined,
          booking: { status: { in: [...ACTIVE_STATUSES] }, startAt: { lt: endAt }, endAt: { gt: startAt } },
        },
        select: { booking: { select: { guestName: true } } },
        take: 1,
      },
    },
  });

  return tables.map((table) => ({
    id: table.id,
    label: table.label,
    section: table.area.name,
    maxSeats: table.maxSeats,
    combinable: table.combinable,
    busyWith: table.bookings[0]?.booking.guestName ?? null,
  }));
}

/** Seats a walk-in party now at the chosen tables (wiki/modules/booking.md). */
export async function seatWalkIn(_previous: ActionResult, form: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!(await hasPermission("bookings.manage"))) return NO_ACCESS;

  const parsed = parseWalkInForm(form);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { tableIds, ...guest } = parsed.data;

  const [settings, tables] = await Promise.all([
    db.bookingSettings.findUnique({ where: { id: 1 } }),
    db.table.findMany({ where: { id: { in: tableIds } } }),
  ]);
  if (!settings) return { error: "Booking settings are missing. Ask the owner to check Settings." };
  if (tables.length !== tableIds.length) return { error: "A chosen table no longer exists. Reload and try again." };
  const problem = checkTables(tables, guest.partySize);
  if (problem) return { error: problem };

  // Walk-ins are already here, so booking hours and slots don't apply.
  const startAt = new Date(Math.floor(Date.now() / 60_000) * 60_000);
  const endAt = new Date(startAt.getTime() + settings.diningMinutes * 60_000);
  const conflict = await writeBooking({
    tableIds,
    startAt,
    endAt,
    createdById: user.id,
    data: { ...guest, guestPhone: guest.guestPhone ?? null, notes: null, source: "WALK_IN", status: "SEATED", seatedAt: startAt, startAt, endAt },
  });
  if (conflict) return { error: conflict };

  refresh();
  return { ok: true };
}
