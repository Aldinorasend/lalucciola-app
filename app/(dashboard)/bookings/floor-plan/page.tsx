import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { FloorPlanCanvas, type FloorState } from "@/components/bookings/floor-plan-canvas";
import { bookingStyle, toBookingRow } from "@/components/bookings/status";
import { RequirePermission } from "@/components/require-permission";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toMinutes, toTime } from "@/lib/booking-settings";
import { closedAreas } from "@/lib/booking-writes";
import { dayOfWeek, formatDay, formatLocalTime, localParts, shiftDate, tableState, toInstant } from "@/lib/bookings";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Floor plan" };

const WINDOW_HOURS = 2;
const SHOW = [
  { value: "", label: "Active" },
  { value: "BOOKED", label: "Booked" },
  { value: "SEATED", label: "Seated" },
];

// The room as drawn by the owner (wiki/modules/floor-plan.md#floor-plan-screen-bookingsfloor-plan).
export default function FloorPlanPage({ searchParams }: PageProps<"/bookings/floor-plan">) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Floor plan</h1>
        <p className="text-muted-foreground">The room right now, or at a later time today.</p>
      </div>
      <RequirePermission permission="bookings.manage">
        <Suspense fallback={<Skeleton className="h-[32rem] w-full" />}>
          <FloorPlan searchParams={searchParams} />
        </Suspense>
      </RequirePermission>
    </div>
  );
}

async function FloorPlan({ searchParams }: { searchParams: PageProps<"/bookings/floor-plan">["searchParams"] }) {
  const { time: requestedTime, show: requestedShow } = await searchParams;
  const now = new Date();
  const today = localParts(now).date;
  const nowMinutes = localParts(now).minutes;
  const requested = typeof requestedTime === "string" ? toMinutes(requestedTime) : NaN;
  // Only today, and only from now on: past moments would need completed bookings too.
  const live = Number.isNaN(requested) || requested <= nowMinutes;
  const moment = live ? now : toInstant(today, requested);
  const show = requestedShow === "BOOKED" || requestedShow === "SEATED" ? requestedShow : "";

  const activeFromMoment = { status: { in: ["BOOKED" as const, "SEATED" as const] }, endAt: { gt: moment }, startAt: { lt: toInstant(shiftDate(today, 1), 0) } };
  const [settings, hours, closed, tables] = await Promise.all([
    db.bookingSettings.findUnique({ where: { id: 1 } }),
    db.openingHours.findUnique({ where: { dayOfWeek: dayOfWeek(today) } }),
    closedAreas(today),
    db.table.findMany({
      // Switched-off tables still show while they hold a booking, so no guest goes missing.
      where: { OR: [{ active: true }, { bookings: { some: { booking: activeFromMoment } } }] },
      orderBy: [{ area: { sortOrder: "asc" } }, { label: "asc" }],
      select: {
        id: true,
        label: true,
        active: true,
        shape: true,
        rotation: true,
        posX: true,
        posY: true,
        maxSeats: true,
        areaId: true,
        area: { select: { name: true } },
        bookings: {
          where: { booking: activeFromMoment },
          select: {
            booking: {
              select: {
                id: true,
                guestName: true,
                guestPhone: true,
                partySize: true,
                startAt: true,
                endAt: true,
                source: true,
                notes: true,
                status: true,
                tables: { select: { tableId: true, table: { select: { label: true } } } },
              },
            },
          },
        },
      },
    }),
  ]);
  if (!settings || !hours) return <p className="text-sm text-destructive">Booking settings are missing. Run `npm run db:seed`.</p>;

  const floor = tables.map((table) => {
    const { state, current, next } = tableState(table.bookings.map((link) => link.booking), moment, settings.reservedSoonMinutes);
    const shown = state === "SEATED" ? current : state === "SOON" ? next : undefined;
    return {
      id: table.id,
      label: table.active ? table.label : `${table.label} (off)`,
      active: table.active,
      shape: table.shape,
      rotation: table.rotation,
      posX: table.posX,
      posY: table.posY,
      maxSeats: table.maxSeats,
      state: (closed.has(table.areaId) ? "CLOSED" : state) as FloorState,
      booking: shown ? toBookingRow(shown, now, settings.lateGraceMinutes) : null,
    };
  });

  // Side panel: bookings seated at the moment or starting within the window.
  const windowEnd = new Date(moment.getTime() + WINDOW_HOURS * 3_600_000);
  const unique = new Map(tables.flatMap((table) => table.bookings.map((link) => [link.booking.id, link.booking] as const)));
  const upcoming = [...unique.values()]
    .filter((booking) => (booking.status === "SEATED" && booking.startAt <= moment) || (booking.startAt >= moment && booking.startAt < windowEnd) || (booking.status === "BOOKED" && booking.startAt < moment))
    .filter((booking) => !show || booking.status === show)
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  const counts = { all: unique.size, BOOKED: [...unique.values()].filter((b) => b.status === "BOOKED").length, SEATED: [...unique.values()].filter((b) => b.status === "SEATED").length };

  const firstSlot = Math.max(hours.firstBookingAt, Math.ceil(nowMinutes / settings.slotMinutes) * settings.slotMinutes);
  const slots = Array.from({ length: Math.max(0, Math.floor((hours.lastBookingAt - firstSlot) / settings.slotMinutes) + 1) }, (_, index) => firstSlot + index * settings.slotMinutes);
  const momentMinutes = localParts(moment).minutes;
  const open = momentMinutes >= hours.firstBookingAt && momentMinutes <= hours.lastBookingAt + settings.diningMinutes;
  const href = (params: { time?: string | null; show?: string }) => {
    const query = new URLSearchParams();
    const time = params.time === undefined ? (live ? null : toTime(momentMinutes)) : params.time;
    const nextShow = params.show ?? show;
    if (time) query.set("time", time);
    if (nextShow) query.set("show", nextShow);
    return `?${query}`;
  };

  return (
    <div className="grid gap-4">
      {live && <AutoRefresh seconds={60} />}
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-lg font-medium">
          {formatDay(today)} · {toTime(momentMinutes)}
        </div>
        <Badge className={open ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}>{open ? "Open" : "Closed"}</Badge>
        <Button size="sm" variant={live ? "secondary" : "outline"} asChild>
          <Link href={href({ time: null })} aria-current={live ? "page" : undefined}>
            <span className={`size-2 rounded-full ${live ? "bg-red-500" : "bg-muted-foreground"}`} />
            Live
          </Link>
        </Button>
      </div>

      {slots.length > 0 && (
        <div className="min-w-0 overflow-x-auto rounded-xl border" role="group" aria-label="Show the room at">
          <div className="flex w-max gap-1 p-1">
            {slots.map((minutes) => {
              const active = !live && minutes === momentMinutes;
              return (
                <Button key={minutes} size="sm" variant={active ? "default" : "ghost"} className="tabular-nums" asChild>
                  <Link href={href({ time: toTime(minutes) })} aria-current={active ? "true" : undefined}>
                    {toTime(minutes)}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <FloorPlanCanvas tables={floor} slotMinutes={settings.slotMinutes} live={live} />

        <Card className="h-fit gap-3 py-4">
          <CardContent className="grid gap-3 px-4">
            <div className="flex flex-wrap gap-1" role="group" aria-label="Show bookings">
              {SHOW.map((option) => (
                <Button key={option.label} size="sm" variant={show === option.value ? "secondary" : "ghost"} asChild>
                  <Link href={href({ show: option.value })}>
                    {option.label}
                    <span className="text-muted-foreground tabular-nums">{option.value ? counts[option.value as "BOOKED" | "SEATED"] : counts.all}</span>
                  </Link>
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Seated now, late, or starting {toTime(momentMinutes)}–{formatLocalTime(windowEnd)}
            </p>
            {[...closed.values()].map((name) => (
              <div key={name} className="rounded-md bg-muted px-3 py-2 text-sm">
                {name} closed today
              </div>
            ))}
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No bookings in this window.</p>
            ) : (
              <ul className="grid gap-2">
                {upcoming.map((booking) => {
                  const style = bookingStyle(booking.status, booking.source);
                  return (
                    <li key={booking.id} className="grid gap-0.5 rounded-md border px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium tabular-nums">{formatLocalTime(booking.startAt)}</span>
                        <Badge className={style.className}>{style.label}</Badge>
                      </div>
                      <span className="truncate">{booking.guestName}</span>
                      <span className="text-xs text-muted-foreground">
                        {booking.partySize} {booking.partySize === 1 ? "guest" : "guests"} · Table {booking.tables.map((link) => link.table.label).join(" + ")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
