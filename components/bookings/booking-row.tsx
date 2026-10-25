"use client";

import { MoreHorizontal } from "lucide-react";
import { changeBookingStatus } from "@/app/(dashboard)/bookings/actions";
import { BookingActions } from "@/components/bookings/booking-actions";
import type { BookingFormValues } from "@/components/bookings/booking-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useActionToast } from "@/components/use-action-toast";
import { isActive, STATUS_BADGE } from "@/components/bookings/status";
import { type BookingStatus, count } from "@/lib/bookings";

export type BookingRowData = BookingFormValues & {
  id: string;
  endTime: string;
  status: BookingStatus;
  late: boolean;
  tableLabels: string[];
};

export function BookingRow({ booking, slotMinutes }: { booking: BookingRowData; slotMinutes: number }) {
  const [onStatus, statusPending] = useActionToast(changeBookingStatus, "Booking updated");
  const badge = STATUS_BADGE[booking.status];
  const active = isActive(booking.status);

  return (
    <li className={`grid grid-cols-[4.5rem_1fr_auto] items-start gap-3 border-b py-3 last:border-0 ${active ? "" : "opacity-60"}`}>
      <div className="text-sm tabular-nums">
        <div className="font-medium">{booking.time}</div>
        <div className="text-xs text-muted-foreground">to {booking.endTime}</div>
      </div>

      <div className="grid gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{booking.guestName}</span>
          <Badge className={badge.className}>{badge.label}</Badge>
          {booking.late && <Badge className="bg-amber-500 text-white">Late</Badge>}
        </div>
        <div className="text-sm text-muted-foreground">
          {count(booking.partySize, "guest")} · Table {booking.tableLabels.join(" + ")}
          {booking.guestPhone && ` · ${booking.guestPhone}`}
        </div>
        {booking.notes && <div className="text-sm">{booking.notes}</div>}
      </div>

      <div className="flex items-center gap-1">
        {booking.late && (
          <form onSubmit={onStatus}>
            <input type="hidden" name="id" value={booking.id} />
            <input type="hidden" name="status" value="NO_SHOW" />
            <Button type="submit" size="sm" variant="outline" disabled={statusPending}>
              Mark no-show
            </Button>
          </form>
        )}
        {active && (
          <BookingActions booking={booking} slotMinutes={slotMinutes}>
            <Button variant="ghost" size="icon" aria-label={`Actions for ${booking.guestName}`}>
              <MoreHorizontal />
            </Button>
          </BookingActions>
        )}
      </div>
    </li>
  );
}
