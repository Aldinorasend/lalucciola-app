"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { changeBookingStatus } from "@/app/(dashboard)/bookings/actions";
import { BookingForm, type BookingFormValues } from "@/components/bookings/booking-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useActionToast } from "@/components/use-action-toast";
import type { BookingStatus } from "@/lib/bookings";

export type BookingRowData = BookingFormValues & {
  id: string;
  endTime: string;
  status: BookingStatus;
  late: boolean;
  tableLabels: string[];
};

// Colours from wiki/architecture/ui-components.md#status-colors-badges
const STATUS_BADGE: Record<BookingStatus, { label: string; className: string }> = {
  BOOKED: { label: "Booked", className: "bg-blue-600 text-white" },
  SEATED: { label: "Seated", className: "bg-emerald-600 text-white" },
  COMPLETED: { label: "Completed", className: "bg-muted text-muted-foreground" },
  CANCELLED: { label: "Cancelled", className: "bg-transparent text-muted-foreground line-through border-border" },
  NO_SHOW: { label: "No-show", className: "bg-destructive text-white" },
};

const ACTIONS: { to: BookingStatus; label: string; from: BookingStatus[] }[] = [
  { to: "SEATED", label: "Seat", from: ["BOOKED"] },
  { to: "COMPLETED", label: "Complete", from: ["SEATED"] },
  { to: "NO_SHOW", label: "Mark no-show", from: ["BOOKED"] },
];

export function BookingRow({ booking, slotMinutes }: { booking: BookingRowData; slotMinutes: number }) {
  const [editing, setEditing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [onStatus, statusPending] = useActionToast(changeBookingStatus, "Booking updated", () => setCancelling(false));
  const badge = STATUS_BADGE[booking.status];
  const active = booking.status === "BOOKED" || booking.status === "SEATED";
  const dimmed = !active ? "opacity-60" : "";

  return (
    <li className={`grid grid-cols-[4.5rem_1fr_auto] items-start gap-3 border-b py-3 last:border-0 ${dimmed}`}>
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
          {booking.partySize} {booking.partySize === 1 ? "guest" : "guests"} · Table {booking.tableLabels.join(" + ")}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for ${booking.guestName}`} disabled={statusPending}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {ACTIONS.filter((action) => action.from.includes(booking.status)).map((action) => (
                <form key={action.to} onSubmit={onStatus}>
                  <input type="hidden" name="id" value={booking.id} />
                  <input type="hidden" name="status" value={action.to} />
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full">
                      {action.label}
                    </button>
                  </DropdownMenuItem>
                </form>
              ))}
              <DropdownMenuItem onSelect={() => setEditing(true)}>Edit</DropdownMenuItem>
              {booking.status === "BOOKED" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => setCancelling(true)}>
                    Cancel booking
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Sheet open={editing} onOpenChange={setEditing}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Edit booking</SheetTitle>
            <SheetDescription>{booking.guestName}</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            <BookingForm initial={booking} slotMinutes={slotMinutes} onDone={() => setEditing(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={cancelling} onOpenChange={setCancelling}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel booking</DialogTitle>
            <DialogDescription>
              {booking.guestName}, {booking.time}, {booking.partySize} guests. The table becomes free.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onStatus} className="grid gap-4">
            <input type="hidden" name="id" value={booking.id} />
            <input type="hidden" name="status" value="CANCELLED" />
            <div className="grid gap-1.5">
              <Label htmlFor={`reason-${booking.id}`}>Reason</Label>
              <Input id={`reason-${booking.id}`} name="reason" required maxLength={200} placeholder="e.g. Guest called to cancel" />
            </div>
            <DialogFooter>
              <Button type="submit" variant="destructive" disabled={statusPending}>
                Cancel booking
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </li>
  );
}
