import "server-only";
import { ACTIVE_STATUSES } from "@/lib/bookings";
import { db } from "@/lib/db";

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
export async function writeBooking({
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

/** Closed sections on a restaurant-local date ("YYYY-MM-DD"), as area id → section name (D-033). */
export async function closedAreas(date: string) {
  const closures = await db.areaClosure.findMany({
    where: { date: new Date(`${date}T00:00:00Z`) },
    select: { areaId: true, area: { select: { name: true } } },
  });
  return new Map(closures.map((closure) => [closure.areaId, closure.area.name]));
}
