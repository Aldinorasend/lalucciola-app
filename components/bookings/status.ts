import type { BookingRowData } from "@/components/bookings/booking-row";
import { toTime } from "@/lib/booking-settings";
import { type BookingStatus, formatLocalTime, isLate, localParts } from "@/lib/bookings";

// Plain module (no "use client") so server pages and client components can both read it.
// Colours from wiki/architecture/ui-components.md#status-colors-badges
export const STATUS_BADGE: Record<BookingStatus, { label: string; className: string }> = {
  BOOKED: { label: "Booked", className: "bg-blue-600 text-white" },
  SEATED: { label: "Seated", className: "bg-emerald-600 text-white" },
  COMPLETED: { label: "Completed", className: "bg-muted text-muted-foreground" },
  CANCELLED: { label: "Cancelled", className: "bg-transparent text-muted-foreground line-through border-border" },
  NO_SHOW: { label: "No-show", className: "bg-destructive text-white" },
};

export function isActive(status: BookingStatus) {
  return status === "BOOKED" || status === "SEATED";
}

export const WALK_IN_STYLE = { label: "Walk-in", className: "bg-violet-600 text-white" };

/** Colour for a booking on the calendar and timeline: walk-ins stand apart from bookings until completed. */
export function bookingStyle(status: BookingStatus, source: string) {
  return source === "WALK_IN" && isActive(status) ? WALK_IN_STYLE : STATUS_BADGE[status];
}

/** Shapes a booking from the database for the booking rows, bars and cards. */
export function toBookingRow(
  booking: {
    id: string;
    guestName: string;
    guestPhone: string | null;
    partySize: number;
    startAt: Date;
    endAt: Date;
    source: string;
    notes: string | null;
    status: BookingStatus;
    tables: { tableId: string; table: { label: string } }[];
  },
  now: Date,
  lateGraceMinutes: number,
): BookingRowData {
  const start = localParts(booking.startAt);
  return {
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
    late: isLate(booking, now, lateGraceMinutes),
    tableIds: booking.tables.map((link) => link.tableId),
    tableLabels: booking.tables.map((link) => link.table.label),
  };
}
