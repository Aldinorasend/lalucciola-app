import { Suspense } from "react";
import type { Metadata } from "next";
import { AutoRefresh } from "@/components/auto-refresh";
import { AddToWaitlistForm, WaitingRow } from "@/components/bookings/waitlist";
import { RequirePermission } from "@/components/require-permission";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toTime } from "@/lib/booking-settings";
import { formatLocalTime, localParts, toInstant } from "@/lib/bookings";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Waitlist" };

// Walk-in parties waiting for a table (wiki/modules/booking.md#walk-ins--waitlist).
export default function WaitlistPage() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Waitlist</h1>
        <p className="text-muted-foreground">Parties waiting for a table, longest wait first. Updates every minute.</p>
      </div>
      <RequirePermission permission="bookings.manage">
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <Waitlist />
        </Suspense>
      </RequirePermission>
    </div>
  );
}

async function Waitlist() {
  const now = new Date();
  const { date: today, minutes } = localParts(now);
  const [waiting, doneToday] = await Promise.all([
    db.waitlistEntry.findMany({ where: { status: "WAITING" }, orderBy: { addedAt: "asc" } }),
    db.waitlistEntry.findMany({
      where: { status: { in: ["SEATED", "LEFT"] }, closedAt: { gte: toInstant(today, 0) } },
      orderBy: { closedAt: "desc" },
      include: { booking: { select: { tables: { select: { table: { select: { label: true } } } } } } },
    }),
  ]);

  return (
    <div className="grid gap-4">
      <AutoRefresh seconds={60} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a party</CardTitle>
        </CardHeader>
        <CardContent>
          <AddToWaitlistForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Waiting <span className="text-muted-foreground tabular-nums">{waiting.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {waiting.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nobody is waiting.</p>
          ) : (
            <ul>
              {waiting.map((entry) => (
                <WaitingRow
                  key={entry.id}
                  date={today}
                  time={toTime(minutes)}
                  party={{
                    id: entry.id,
                    guestName: entry.guestName,
                    guestPhone: entry.guestPhone,
                    partySize: entry.partySize,
                    quotedWaitMin: entry.quotedWaitMin,
                    waitedMinutes: Math.max(0, Math.floor((now.getTime() - entry.addedAt.getTime()) / 60_000)),
                  }}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {doneToday.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Earlier today</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 text-sm">
              {doneToday.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center gap-2">
                  <Badge variant={entry.status === "SEATED" ? "default" : "outline"}>{entry.status === "SEATED" ? "Seated" : "Left"}</Badge>
                  <span>
                    {entry.guestName} · {entry.partySize} {entry.partySize === 1 ? "guest" : "guests"}
                  </span>
                  <span className="text-muted-foreground">
                    {entry.closedAt && formatLocalTime(entry.closedAt)}
                    {entry.booking && ` · Table ${entry.booking.tables.map((link) => link.table.label).join(" + ")}`}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
