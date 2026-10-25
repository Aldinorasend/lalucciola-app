import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { BookingActions } from "@/components/bookings/booking-actions";
import { TABLE_STATE_STYLE, toBookingRow } from "@/components/bookings/status";
import { WalkInButton } from "@/components/bookings/walk-in-button";
import { RequirePermission } from "@/components/require-permission";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatLocalTime, localParts, shiftDate, type TableState, tableState, toInstant } from "@/lib/bookings";
import { closedAreas } from "@/lib/booking-writes";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Tables" };

type CardState = TableState | "CLOSED";

const STATES: Record<CardState, { label: string; badge: string; card: string }> = TABLE_STATE_STYLE;
const FILTERS = [
  { value: "", label: "All" },
  { value: "FREE", label: "Free" },
  { value: "SOON", label: "Reserved soon" },
  { value: "SEATED", label: "Seated" },
  { value: "CLOSED", label: "Closed" },
];

// Live status of every table right now (wiki/modules/floor-plan.md#tables-display-bookingstables).
export default function TablesPage({ searchParams }: PageProps<"/bookings/tables">) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tables</h1>
        <p className="text-muted-foreground">Who is sitting where, and which tables are free right now. Updates every minute.</p>
      </div>
      <RequirePermission permission="bookings.manage">
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <TablesNow searchParams={searchParams} />
        </Suspense>
      </RequirePermission>
    </div>
  );
}

async function TablesNow({ searchParams }: { searchParams: PageProps<"/bookings/tables">["searchParams"] }) {
  const { status: requestedStatus, section: requestedSection } = await searchParams;
  const now = new Date();
  const today = localParts(now).date;

  // Active bookings still running now or starting later today.
  const upcoming = { status: { in: ["BOOKED" as const, "SEATED" as const] }, endAt: { gt: now }, startAt: { lt: toInstant(shiftDate(today, 1), 0) } };
  const [settings, closed, tables] = await Promise.all([
    db.bookingSettings.findUnique({ where: { id: 1 } }),
    closedAreas(today),
    db.table.findMany({
      // Switched-off tables still show while they hold a booking, so no guest goes missing.
      where: { OR: [{ active: true }, { bookings: { some: { booking: upcoming } } }] },
      orderBy: [{ area: { sortOrder: "asc" } }, { label: "asc" }],
      select: {
        id: true,
        label: true,
        active: true,
        maxSeats: true,
        areaId: true,
        area: { select: { name: true } },
        // Active bookings still running now or starting later today.
        bookings: {
          where: { booking: upcoming },
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
                seatedAt: true,
                tables: { select: { tableId: true, table: { select: { label: true } } } },
              },
            },
          },
        },
      },
    }),
  ]);
  if (!settings) return <p className="text-sm text-destructive">Booking settings are missing. Run `npm run db:seed`.</p>;

  const cards = tables.map((table) => {
    const live = tableState(table.bookings.map((link) => link.booking), now, settings.reservedSoonMinutes);
    // A closed section can't hold active bookings (closing is refused while it has any), so Closed wins.
    return { ...table, ...live, state: (closed.has(table.areaId) ? "CLOSED" : live.state) as CardState };
  });
  const counts = Object.fromEntries((["FREE", "SOON", "SEATED", "CLOSED"] as const).map((state) => [state, cards.filter((card) => card.state === state).length]));
  const status = typeof requestedStatus === "string" && requestedStatus in STATES ? (requestedStatus as CardState) : null;
  const sections = [...new Set(cards.map((card) => card.area.name))];
  const section = typeof requestedSection === "string" && sections.includes(requestedSection) ? requestedSection : null;
  const shown = cards.filter((card) => (!status || card.state === status) && (!section || card.area.name === section));
  const href = (params: { status?: string | null; section?: string | null }) => {
    const query = new URLSearchParams();
    const nextStatus = params.status === undefined ? status : params.status;
    const nextSection = params.section === undefined ? section : params.section;
    if (nextStatus) query.set("status", nextStatus);
    if (nextSection) query.set("section", nextSection);
    return `?${query}`;
  };

  return (
    <div className="grid gap-4">
      <AutoRefresh seconds={60} />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by status">
          {FILTERS.map((filter) => (
            <Button key={filter.label} size="sm" variant={(status ?? "") === filter.value ? "secondary" : "ghost"} asChild>
              <Link href={href({ status: filter.value || null })}>
                {filter.label}
                {filter.value && <span className="text-muted-foreground tabular-nums">{counts[filter.value]}</span>}
              </Link>
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by section">
          {[null, ...sections].map((name) => (
            <Button key={name ?? "all"} size="sm" variant={section === name ? "secondary" : "ghost"} asChild>
              <Link href={href({ section: name })}>{name ?? "All sections"}</Link>
            </Button>
          ))}
        </div>
      </div>

      {shown.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No tables match these filters.</p>}

      {sections
        .filter((name) => shown.some((card) => card.area.name === name))
        .map((name) => (
          <section key={name} className="grid gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">{name}</h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-3">
              {shown
                .filter((card) => card.area.name === name)
                .map((card) => {
                  const state = STATES[card.state];
                  const booking = card.current ?? (card.state === "SOON" ? card.next : undefined);
                  const row = booking && toBookingRow(booking, now, settings.lateGraceMinutes);
                  return (
                    <Card key={card.id} className={`gap-2 py-3 ${state.card}`}>
                      <CardContent className="grid gap-2 px-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-lg font-semibold leading-none">
                              {card.label}
                              {!card.active && <span className="ml-1 text-xs font-normal text-muted-foreground">(off)</span>}
                            </div>
                            <div className="text-xs text-muted-foreground">{card.maxSeats} seats</div>
                          </div>
                          <Badge className={state.badge}>{state.label}</Badge>
                        </div>

                        <div className="min-h-10 text-sm">
                          {card.state === "SEATED" && card.current && (
                            <>
                              <div className="truncate font-medium">{card.current.guestName}</div>
                              <div className="text-xs text-muted-foreground">
                                {card.current.partySize} {card.current.partySize === 1 ? "guest" : "guests"} · seated {Math.max(0, Math.round((now.getTime() - (card.current.seatedAt ?? card.current.startAt).getTime()) / 60_000))} min
                              </div>
                            </>
                          )}
                          {card.state === "SOON" && card.next && (
                            <>
                              <div className="truncate font-medium">{card.next.guestName}</div>
                              <div className="text-xs text-muted-foreground">
                                {card.next.partySize} {card.next.partySize === 1 ? "guest" : "guests"} · {formatLocalTime(card.next.startAt)}
                                {row?.late && <span className="font-medium text-amber-600"> · Late</span>}
                              </div>
                            </>
                          )}
                          {card.state === "CLOSED" && <div className="text-xs text-muted-foreground">Section closed today</div>}
                          {card.state === "FREE" && (
                            <div className="text-xs text-muted-foreground">
                              {card.next ? `Next: ${card.next.guestName}, ${formatLocalTime(card.next.startAt)}` : "No more bookings today"}
                            </div>
                          )}
                        </div>

                        {card.state === "CLOSED" || (card.state === "FREE" && !card.active) ? null : card.state === "FREE" ? (
                          <WalkInButton tableId={card.id} tableLabel={card.label} maxSeats={card.maxSeats} />
                        ) : (
                          row && (
                            <BookingActions booking={row} slotMinutes={settings.slotMinutes}>
                              <Button size="sm" variant="outline">
                                {card.state === "SEATED" ? "Actions" : "Seat or change"}
                              </Button>
                            </BookingActions>
                          )
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </section>
        ))}
    </div>
  );
}
