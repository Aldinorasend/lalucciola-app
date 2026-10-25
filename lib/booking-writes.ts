import "server-only";
import { ACTIVE_STATUSES, localParts, shiftDate, toInstant } from "@/lib/bookings";
import { db } from "@/lib/db";

class BookingConflict extends Error {}

const dbDate = (date: string) => new Date(`${date}T00:00:00Z`);

async function lockTables(tx: Pick<typeof db, "$queryRaw">, tableIds: string[]) {
  // Sorted, so concurrent writers always lock in the same order and can't deadlock.
  for (const tableId of [...tableIds].sort()) {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${tableId}))::text`;
  }
}

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
  // Links the waitlist party this walk-in came from.
  waitlistEntry?: { connect: { id: string } };
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
      await lockTables(tx, tableIds);
      const clash = await tx.bookingTable.findFirst({
        where: {
          tableId: { in: tableIds },
          bookingId: id ? { not: id } : undefined,
          booking: { status: { in: [...ACTIVE_STATUSES] }, startAt: { lt: endAt }, endAt: { gt: startAt } },
        },
        select: { table: { select: { label: true } }, booking: { select: { guestName: true } } },
      });
      if (clash) throw new BookingConflict(`Table ${clash.table.label} is already booked then (${clash.booking.guestName}).`);

      // Checked under the same table locks as closeArea, so a closing section can't slip a booking in.
      const closure = await tx.areaClosure.findFirst({
        where: { date: dbDate(localParts(startAt).date), area: { tables: { some: { id: { in: tableIds } } } } },
        select: { area: { select: { name: true } } },
      });
      if (closure) throw new BookingConflict(`${closure.area.name} is closed on that day.`);

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
    where: { date: dbDate(date) },
    select: { areaId: true, area: { select: { name: true } } },
  });
  return new Map(closures.map((closure) => [closure.areaId, closure.area.name]));
}

/**
 * Closes a section for a restaurant-local day unless it has active bookings that day (D-049).
 * Locks every table in the section first, so no booking can be saved into it meanwhile.
 * Returns an error message, or null when closed.
 */
export async function closeArea({ areaId, date, reason, createdById }: { areaId: string; date: string; reason: string | null; createdById: string }) {
  try {
    await db.$transaction(async (tx) => {
      const area = await tx.area.findUnique({ where: { id: areaId }, select: { name: true, tables: { select: { id: true } } } });
      if (!area) throw new BookingConflict("This section no longer exists.");
      await lockTables(tx, area.tables.map((table) => table.id));

      const bookings = await tx.booking.count({
        where: {
          status: { in: [...ACTIVE_STATUSES] },
          startAt: { gte: toInstant(date, 0), lt: toInstant(shiftDate(date, 1), 0) },
          tables: { some: { table: { areaId } } },
        },
      });
      if (bookings > 0) {
        throw new BookingConflict(`${area.name} has ${bookings} active ${bookings === 1 ? "booking" : "bookings"} that day. Move or cancel them first.`);
      }
      if (await tx.areaClosure.findUnique({ where: { areaId_date: { areaId, date: dbDate(date) } } })) {
        throw new BookingConflict(`${area.name} is already closed that day.`);
      }
      await tx.areaClosure.create({ data: { areaId, date: dbDate(date), reason, createdById } });
    });
  } catch (error) {
    if (error instanceof BookingConflict) return error.message;
    throw error;
  }
  return null;
}

/**
 * Seats a waiting party now at the chosen tables as a walk-in booking.
 * The entry is claimed first (WAITING to SEATED in one statement) so two staff can't seat it twice;
 * if the tables turn out to be taken, the claim is undone. Returns an error message, or null.
 */
export async function seatWaitlistEntry({ entryId, tableIds, diningMinutes, createdById }: { entryId: string; tableIds: string[]; diningMinutes: number; createdById: string }) {
  const startAt = new Date(Math.floor(Date.now() / 60_000) * 60_000);
  const claimed = await db.waitlistEntry.updateMany({ where: { id: entryId, status: "WAITING" }, data: { status: "SEATED", closedAt: startAt } });
  if (claimed.count === 0) return "This party was already seated or left.";

  // Any failure after the claim puts the party back in the queue, not just a taken table.
  const backInQueue = () => db.waitlistEntry.update({ where: { id: entryId }, data: { status: "WAITING", closedAt: null } });
  let conflict: string | null;
  try {
    const entry = await db.waitlistEntry.findUniqueOrThrow({ where: { id: entryId } });
    const endAt = new Date(startAt.getTime() + diningMinutes * 60_000);
    conflict = await writeBooking({
      tableIds,
      startAt,
      endAt,
      createdById,
      data: {
        guestName: entry.guestName,
        guestPhone: entry.guestPhone,
        partySize: entry.partySize,
        source: "WALK_IN",
        notes: null,
        status: "SEATED",
        seatedAt: startAt,
        startAt,
        endAt,
        waitlistEntry: { connect: { id: entryId } },
      },
    });
  } catch (error) {
    await backInQueue();
    throw error;
  }
  if (conflict) {
    await backInQueue();
    return conflict;
  }
  return null;
}
