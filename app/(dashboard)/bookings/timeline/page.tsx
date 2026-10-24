import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { BookingRow } from "@/components/bookings/booking-row";
import { toBookingRow } from "@/components/bookings/status";
import { TimelineGrid } from "@/components/bookings/timeline-grid";
import { NewBookingButton } from "@/components/bookings/new-booking-button";
import { RequirePermission } from "@/components/require-permission";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toTime } from "@/lib/booking-settings";
import { dayOfWeek, formatDay, localParts, shiftDate, toInstant } from "@/lib/bookings";
import { closedAreas } from "@/lib/booking-writes";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Timeline" };

// Grid: tables × time slots with bookings as bars. List: the same bookings in time order.
export default function TimelinePage({ searchParams }: PageProps<"/bookings/timeline">) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground">The day&apos;s reservations by table and time.</p>
      </div>
      <RequirePermission permission="bookings.manage">
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <DayBookings searchParams={searchParams} />
        </Suspense>
      </RequirePermission>
    </div>
  );
}

async function DayBookings({ searchParams }: { searchParams: PageProps<"/bookings/timeline">["searchParams"] }) {
  const { date: requested, view: requestedView } = await searchParams;
  const view = requestedView === "list" ? "list" : "grid";
  const now = new Date();
  const today = localParts(now).date;
  const date = typeof requested === "string" && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : today;

  const dayRange = { gte: toInstant(date, 0), lt: toInstant(shiftDate(date, 1), 0) };
  const [settings, hours, bookings, tables, closed] = await Promise.all([
    db.bookingSettings.findUnique({ where: { id: 1 } }),
    db.openingHours.findUnique({ where: { dayOfWeek: dayOfWeek(date) } }),
    db.booking.findMany({
      where: { startAt: dayRange },
      orderBy: { startAt: "asc" },
      include: { tables: { select: { tableId: true, table: { select: { label: true } } } } },
    }),
    db.table.findMany({
      // Switched-off tables still show when they hold a booking that day, so no guest goes missing.
      where: { OR: [{ active: true }, { bookings: { some: { booking: { startAt: dayRange } } } }] },
      orderBy: [{ area: { sortOrder: "asc" } }, { label: "asc" }],
      select: { id: true, label: true, active: true, areaId: true, area: { select: { name: true } } },
    }),
    closedAreas(date),
  ]);
  if (!settings || !hours) {
    return <p className="text-sm text-destructive">Booking settings are missing. Run `npm run db:seed`.</p>;
  }

  // Default new bookings to the next slot today, or the first slot on other days.
  const nextSlot = Math.ceil((localParts(now).minutes + 1) / settings.slotMinutes) * settings.slotMinutes;
  const defaultTime = toTime(date === today ? Math.min(Math.max(nextSlot, hours.firstBookingAt), hours.lastBookingAt) : hours.firstBookingAt);
  const active = bookings.filter((booking) => booking.status === "BOOKED" || booking.status === "SEATED");
  const covers = active.reduce((sum, booking) => sum + booking.partySize, 0);
  const rows = bookings.map((booking) => {
    const start = localParts(booking.startAt);
    const end = localParts(booking.endAt);
    return {
      ...toBookingRow(booking, now, settings.lateGraceMinutes),
      startMinutes: start.minutes,
      // A booking that runs past midnight is drawn up to the end of the day.
      endMinutes: end.date === date ? end.minutes : 24 * 60,
    };
  });
  // Show the booking window plus one dining duration, widened to fit any booking outside it.
  const windowStart = Math.min(hours.firstBookingAt, ...rows.map((row) => row.startMinutes));
  const windowEnd = Math.max(hours.lastBookingAt + settings.diningMinutes, ...rows.map((row) => row.endMinutes));
  const query = (params: Record<string, string>) => `?${new URLSearchParams({ ...(date !== today && { date }), ...(view === "list" && { view }), ...params })}`;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" asChild>
            <Link href={query({ date: shiftDate(date, -1) })} aria-label="Previous day">
              <ChevronLeft />
            </Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href={query({ date: shiftDate(date, 1) })} aria-label="Next day">
              <ChevronRight />
            </Link>
          </Button>
          <div className="ml-2">
            <div className="font-medium">{formatDay(date)}</div>
            <div className="text-sm text-muted-foreground">
              {active.length} active {active.length === 1 ? "booking" : "bookings"} · {covers} covers · booking {toTime(hours.firstBookingAt)}–
              {toTime(hours.lastBookingAt)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Kept away from the date heading so it never reads as a label for the shown day */}
          {date !== today && (
            <Button variant="outline" asChild>
              <Link href={view === "list" ? "?view=list" : "?"}>
                <CalendarDays />
                Go to today
              </Link>
            </Button>
          )}
          <NewBookingButton date={date} time={defaultTime} slotMinutes={settings.slotMinutes} />
        </div>
      </div>

      <div className="flex gap-1" role="group" aria-label="View">
        {(["grid", "list"] as const).map((option) => (
          <Button key={option} size="sm" variant={view === option ? "secondary" : "ghost"} aria-current={view === option ? "page" : undefined} asChild>
            <Link href={`?${new URLSearchParams({ ...(date !== today && { date }), ...(option === "list" && { view: option }) })}`}>
              {option === "grid" ? "Grid" : "List"}
            </Link>
          </Button>
        ))}
      </div>

      {view === "grid" ? (
        <TimelineGrid
          tables={tables.map((table) => ({ id: table.id, label: table.active ? table.label : `${table.label} (off)`, section: closed.has(table.areaId) ? `${table.area.name} · closed this day` : table.area.name }))}
          bookings={rows}
          windowStart={windowStart}
          windowEnd={windowEnd}
          slotMinutes={settings.slotMinutes}
          nowMinutes={date === today ? localParts(now).minutes : null}
        />
      ) : (
        <Card>
          <CardContent>
            {rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No bookings on this day yet.</p>
            ) : (
              <ul>
                {rows.map((row) => (
                  <BookingRow key={row.id} slotMinutes={settings.slotMinutes} booking={row} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
