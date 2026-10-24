import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BookingRow } from "@/components/bookings/booking-row";
import { NewBookingButton } from "@/components/bookings/new-booking-button";
import { RequirePermission } from "@/components/require-permission";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toTime } from "@/lib/booking-settings";
import { formatLocalTime, isLate, localParts, toInstant } from "@/lib/bookings";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Timeline" };

// Phase 1b: the day's bookings as a list. The table × time grid and the calendar arrive in 1c.
export default function TimelinePage({ searchParams }: PageProps<"/bookings/timeline">) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground">The day&apos;s reservations, in time order.</p>
      </div>
      <RequirePermission permission="bookings.manage">
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <DayBookings searchParams={searchParams} />
        </Suspense>
      </RequirePermission>
    </div>
  );
}

function shiftDate(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function formatDay(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

async function DayBookings({ searchParams }: { searchParams: PageProps<"/bookings/timeline">["searchParams"] }) {
  const { date: requested } = await searchParams;
  const now = new Date();
  const today = localParts(now).date;
  const date = typeof requested === "string" && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : today;

  const [settings, hours, bookings] = await Promise.all([
    db.bookingSettings.findUnique({ where: { id: 1 } }),
    db.openingHours.findUnique({ where: { dayOfWeek: new Date(`${date}T00:00:00Z`).getUTCDay() } }),
    db.booking.findMany({
      where: { startAt: { gte: toInstant(date, 0), lt: toInstant(shiftDate(date, 1), 0) } },
      orderBy: { startAt: "asc" },
      include: { tables: { select: { tableId: true, table: { select: { label: true } } } } },
    }),
  ]);
  if (!settings || !hours) {
    return <p className="text-sm text-destructive">Booking settings are missing. Run `npm run db:seed`.</p>;
  }

  // Default new bookings to the next slot today, or the first slot on other days.
  const nextSlot = Math.ceil((localParts(now).minutes + 1) / settings.slotMinutes) * settings.slotMinutes;
  const defaultTime = toTime(date === today ? Math.min(Math.max(nextSlot, hours.firstBookingAt), hours.lastBookingAt) : hours.firstBookingAt);
  const active = bookings.filter((booking) => booking.status === "BOOKED" || booking.status === "SEATED");
  const covers = active.reduce((sum, booking) => sum + booking.partySize, 0);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" asChild>
            <Link href={`?date=${shiftDate(date, -1)}`} aria-label="Previous day">
              <ChevronLeft />
            </Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href={`?date=${shiftDate(date, 1)}`} aria-label="Next day">
              <ChevronRight />
            </Link>
          </Button>
          {date !== today && (
            <Button variant="ghost" asChild>
              <Link href="?">Today</Link>
            </Button>
          )}
          <div className="ml-2">
            <div className="font-medium">{formatDay(date)}</div>
            <div className="text-sm text-muted-foreground">
              {active.length} active {active.length === 1 ? "booking" : "bookings"} · {covers} covers · booking {toTime(hours.firstBookingAt)}–
              {toTime(hours.lastBookingAt)}
            </div>
          </div>
        </div>
        <NewBookingButton date={date} time={defaultTime} slotMinutes={settings.slotMinutes} />
      </div>

      <Card>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No bookings on this day yet.</p>
          ) : (
            <ul>
              {bookings.map((booking) => {
                const start = localParts(booking.startAt);
                return (
                  <BookingRow
                    key={booking.id}
                    slotMinutes={settings.slotMinutes}
                    booking={{
                      id: booking.id,
                      guestName: booking.guestName,
                      guestPhone: booking.guestPhone ?? "",
                      partySize: booking.partySize,
                      date: start.date,
                      time: toTime(start.minutes),
                      endTime: formatLocalTime(booking.endAt),
                      source: booking.source,
                      notes: booking.notes ?? "",
                      status: booking.status,
                      late: isLate(booking, now, settings.lateGraceMinutes),
                      tableIds: booking.tables.map((link) => link.tableId),
                      tableLabels: booking.tables.map((link) => link.table.label),
                    }}
                  />
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
