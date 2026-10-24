import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { STATUS_BADGE } from "@/components/bookings/status";
import { RequirePermission } from "@/components/require-permission";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDay, formatLocalTime, localParts, monthWeeks, shiftDate, toInstant, weekDates } from "@/lib/bookings";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Calendar" };

// Week and month overviews for planning ahead. "Day" is the Timeline page.
export default function CalendarPage({ searchParams }: PageProps<"/bookings/calendar">) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">Bookings and covers by week or month. Cancelled and no-show bookings are left out.</p>
      </div>
      <RequirePermission permission="bookings.manage">
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <CalendarView searchParams={searchParams} />
        </Suspense>
      </RequirePermission>
    </div>
  );
}

function shiftMonth(date: string, months: number) {
  const [year, month] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 + months, 1)).toISOString().slice(0, 10);
}

async function CalendarView({ searchParams }: { searchParams: PageProps<"/bookings/calendar">["searchParams"] }) {
  const { date: requested, view: requestedView } = await searchParams;
  const today = localParts(new Date()).date;
  const date = typeof requested === "string" && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : today;
  const view = requestedView === "month" ? "month" : "week";

  const weeks = view === "month" ? monthWeeks(date) : [weekDates(date)];
  const days = weeks.flat();
  const bookings = await db.booking.findMany({
    where: {
      startAt: { gte: toInstant(days[0], 0), lt: toInstant(shiftDate(days.at(-1)!, 1), 0) },
      status: { in: ["BOOKED", "SEATED", "COMPLETED"] },
    },
    orderBy: { startAt: "asc" },
    select: {
      id: true,
      guestName: true,
      partySize: true,
      startAt: true,
      status: true,
      tables: { select: { table: { select: { label: true } } } },
    },
  });
  const byDay = Map.groupBy(bookings, (booking) => localParts(booking.startAt).date);

  const href = (params: { date?: string; view?: string }) =>
    `?${new URLSearchParams({ ...(params.date && params.date !== today && { date: params.date }), ...((params.view ?? view) === "month" && { view: "month" }) })}`;
  const previous = view === "month" ? shiftMonth(date, -1) : shiftDate(date, -7);
  const next = view === "month" ? shiftMonth(date, 1) : shiftDate(date, 7);
  const title = view === "month" ? formatDay(date, { month: "long", year: "numeric" }) : `${formatDay(days[0], { day: "numeric", month: "short" })} – ${formatDay(days[6], { day: "numeric", month: "short", year: "numeric" })}`;
  const showsToday = days.includes(today) && (view === "week" || today.slice(0, 7) === date.slice(0, 7));

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" asChild>
            <Link href={href({ date: previous })} aria-label={`Previous ${view}`}>
              <ChevronLeft />
            </Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href={href({ date: next })} aria-label={`Next ${view}`}>
              <ChevronRight />
            </Link>
          </Button>
          <div className="ml-2 font-medium">{title}</div>
        </div>
        {!showsToday && (
          <Button variant="outline" asChild>
            <Link href={href({})}>
              <CalendarDays />
              Go to today
            </Link>
          </Button>
        )}
      </div>

      <div className="flex gap-1" role="group" aria-label="View">
        {(["week", "month"] as const).map((option) => (
          <Button key={option} size="sm" variant={view === option ? "secondary" : "ghost"} aria-current={view === option ? "page" : undefined} asChild>
            <Link href={href({ date, view: option })}>{option === "week" ? "Week" : "Month"}</Link>
          </Button>
        ))}
        <Button size="sm" variant="ghost" asChild>
          <Link href={`/bookings/timeline${date !== today ? `?date=${date}` : ""}`}>Day</Link>
        </Button>
      </div>

      {view === "month" ? (
        <Card className="py-0">
          <CardContent className="px-0">
            <div className="grid grid-cols-7 border-b text-center text-xs text-muted-foreground">
              {days.slice(0, 7).map((day) => (
                <div key={day} className="py-2">
                  {formatDay(day, { weekday: "short" })}
                </div>
              ))}
            </div>
            {weeks.map((week) => (
              <div key={week[0]} className="grid grid-cols-7 border-b last:border-0">
                {week.map((day) => {
                  const list = byDay.get(day) ?? [];
                  const covers = list.reduce((sum, booking) => sum + booking.partySize, 0);
                  const inMonth = day.slice(0, 7) === date.slice(0, 7);
                  return (
                    <Link
                      key={day}
                      href={`/bookings/timeline?date=${day}`}
                      className={`grid min-h-20 content-start gap-1 border-r p-2 text-sm last:border-r-0 hover:bg-muted/50 ${inMonth ? "" : "text-muted-foreground/60"}`}
                    >
                      <span className={`w-fit rounded-full px-1.5 tabular-nums ${day === today ? "bg-primary text-primary-foreground" : ""}`}>
                        {Number(day.slice(8))}
                      </span>
                      {list.length > 0 && (
                        <span className="text-xs">
                          <span className="font-medium">{list.length}</span> {list.length === 1 ? "booking" : "bookings"}
                          <span className="block text-muted-foreground">{covers} covers</span>
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          <ul aria-label="Colour key" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {(["BOOKED", "SEATED", "COMPLETED"] as const).map((status) => (
              <li key={status} className="flex items-center gap-1.5">
                <span aria-hidden className={`inline-block h-3 w-5 rounded-sm border ${STATUS_BADGE[status].className}`} />
                {STATUS_BADGE[status].label}
              </li>
            ))}
          </ul>
          <div className="grid gap-3 xl:grid-cols-7">
            {days.map((day) => {
              const list = byDay.get(day) ?? [];
              const covers = list.reduce((sum, booking) => sum + booking.partySize, 0);
              return (
                <Card key={day} className="gap-2 py-3">
                  <CardContent className="grid gap-2 px-3">
                    <Link href={`/bookings/timeline?date=${day}`} className="grid hover:underline">
                      <span className={`text-sm font-medium ${day === today ? "text-primary" : ""}`}>
                        {formatDay(day, { weekday: "short", day: "numeric", month: "short" })}
                        {day === today && " · Today"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {list.length ? `${list.length} · ${covers} covers` : "No bookings"}
                      </span>
                    </Link>
                    {list.map((booking) => (
                      <div
                        key={booking.id}
                        title={STATUS_BADGE[booking.status].label}
                        className={`grid gap-0.5 rounded-md px-2 py-1 text-xs ${STATUS_BADGE[booking.status].className}`}
                      >
                        <span className="font-medium tabular-nums">
                          {formatLocalTime(booking.startAt)}
                          <span className="sr-only"> {STATUS_BADGE[booking.status].label}</span>
                        </span>
                        <span className="truncate">{booking.guestName}</span>
                        <span className="opacity-80">
                          {booking.partySize} · {booking.tables.map((link) => link.table.label).join("+")}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
