"use client";

import { BookingActions } from "@/components/bookings/booking-actions";
import type { BookingRowData } from "@/components/bookings/booking-row";
import { isActive } from "@/components/bookings/status";
import { toTime } from "@/lib/booking-settings";

export type GridTable = { id: string; label: string; section: string };
export type GridBooking = BookingRowData & { startMinutes: number; endMinutes: number };

const SLOT_REM = 1.25; // width of one slot column
const BAR_STYLE: Record<string, string> = {
  BOOKED: "bg-blue-600 text-white hover:bg-blue-700",
  SEATED: "bg-emerald-600 text-white hover:bg-emerald-700",
  COMPLETED: "bg-muted text-muted-foreground",
};

const LEGEND = [
  { label: "Booked", swatch: `h-3 w-5 rounded-sm ${BAR_STYLE.BOOKED}` },
  { label: "Seated", swatch: `h-3 w-5 rounded-sm ${BAR_STYLE.SEATED}` },
  { label: "Completed", swatch: `h-3 w-5 rounded-sm border ${BAR_STYLE.COMPLETED}` },
  { label: "Late (guest not here yet)", swatch: "h-3 w-5 rounded-sm bg-blue-600 ring-2 ring-amber-500 ring-offset-1" },
  { label: "Now", swatch: "h-3 w-px bg-red-500" },
];

/** Rows = tables, columns = time slots, bookings as bars (wiki/modules/booking.md). */
export function TimelineGrid({
  tables,
  bookings,
  windowStart,
  windowEnd,
  slotMinutes,
  nowMinutes,
}: {
  tables: GridTable[];
  bookings: GridBooking[];
  windowStart: number;
  windowEnd: number;
  slotMinutes: number;
  nowMinutes: number | null;
}) {
  const toRem = (minutes: number) => ((minutes - windowStart) / slotMinutes) * SLOT_REM;
  const width = toRem(windowEnd);
  const hours = Array.from({ length: Math.floor((windowEnd - windowStart) / 60) + 1 }, (_, index) => Math.ceil(windowStart / 60) * 60 + index * 60).filter(
    (minutes) => minutes <= windowEnd,
  );
  // Cancelled and no-show bookings free their tables, so they don't appear on the grid.
  const shown = bookings.filter((booking) => isActive(booking.status) || booking.status === "COMPLETED");
  const sections = [...new Set(tables.map((table) => table.section))];
  const background = `repeating-linear-gradient(to right, var(--border) 0 1px, transparent 1px ${SLOT_REM * (60 / slotMinutes)}rem)`;

  return (
    <div className="grid min-w-0 gap-2">
      <ul aria-label="Colour key" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {LEGEND.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <span aria-hidden className={`inline-block ${item.swatch}`} />
            {item.label}
          </li>
        ))}
      </ul>
      <div className="min-w-0 overflow-x-auto rounded-xl border">
        <div style={{ width: `calc(4.5rem + ${width}rem)` }}>
          <div className="sticky top-0 flex border-b bg-background text-xs text-muted-foreground">
            <div className="sticky left-0 z-10 w-18 shrink-0 border-r bg-background px-2 py-1.5">Table</div>
            <div className="relative h-7" style={{ width: `${width}rem` }}>
              {hours.map((minutes) => (
                <span key={minutes} className="absolute top-1.5 pl-1 tabular-nums" style={{ left: `${toRem(minutes)}rem` }}>
                  {toTime(minutes)}
                </span>
              ))}
            </div>
          </div>

          {sections.map((section) => (
            <div key={section}>
              <div className="border-b bg-muted/40 py-1 text-xs font-medium">
                <span className="sticky left-0 px-2">{section}</span>
              </div>
              {tables
                .filter((table) => table.section === section)
                .map((table) => (
                  <div key={table.id} className="flex border-b last:border-0">
                    <div className="sticky left-0 z-10 w-18 shrink-0 border-r bg-background px-2 py-2 text-sm font-medium">{table.label}</div>
                    <div className="relative h-10" style={{ width: `${width}rem`, backgroundImage: background, backgroundPositionX: `${toRem(Math.ceil(windowStart / 60) * 60)}rem` }}>
                      {nowMinutes !== null && nowMinutes >= windowStart && nowMinutes <= windowEnd && (
                        <div aria-hidden className="absolute inset-y-0 w-px bg-red-500" style={{ left: `${toRem(nowMinutes)}rem` }} />
                      )}
                      {shown
                        .filter((booking) => booking.tableIds.includes(table.id))
                        .map((booking) => {
                          const label = `${booking.time}–${booking.endTime} ${booking.guestName}, ${booking.partySize} guests`;
                          const bar = (
                            <button
                              type="button"
                              title={label}
                              aria-label={label}
                              disabled={!isActive(booking.status)}
                              className={`absolute inset-y-1 overflow-hidden rounded-md px-1.5 text-left text-xs leading-tight whitespace-nowrap ${BAR_STYLE[booking.status]} ${booking.late ? "ring-2 ring-amber-500 ring-offset-1" : ""}`}
                              style={{ left: `${toRem(booking.startMinutes)}rem`, width: `${toRem(booking.endMinutes) - toRem(booking.startMinutes)}rem` }}
                            >
                              <span className="font-medium">{booking.guestName}</span> · {booking.partySize}
                              {booking.late && " · Late"}
                            </button>
                          );
                          return isActive(booking.status) ? (
                            <BookingActions key={booking.id} booking={booking} slotMinutes={slotMinutes}>
                              {bar}
                            </BookingActions>
                          ) : (
                            <span key={booking.id}>{bar}</span>
                          );
                        })}
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
