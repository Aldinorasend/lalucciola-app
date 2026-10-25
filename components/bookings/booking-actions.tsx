"use client";

import { type ReactNode, useState } from "react";
import { changeBookingStatus } from "@/app/(dashboard)/bookings/actions";
import { BookingForm } from "@/components/bookings/booking-form";
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
import type { BookingRowData } from "@/components/bookings/booking-row";
import { type BookingStatus, count } from "@/lib/bookings";

const ACTIONS: { to: BookingStatus; label: string; from: BookingStatus[] }[] = [
  { to: "SEATED", label: "Seat", from: ["BOOKED"] },
  { to: "COMPLETED", label: "Complete", from: ["SEATED"] },
  { to: "NO_SHOW", label: "Mark no-show", from: ["BOOKED"] },
];

/** Status actions, edit sheet and cancel dialog for one booking, opened from any trigger. */
export function BookingActions({ booking, slotMinutes, children }: { booking: BookingRowData; slotMinutes: number; children: ReactNode }) {
  const [editing, setEditing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [onStatus, statusPending] = useActionToast(changeBookingStatus, "Booking updated", () => setCancelling(false));

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={statusPending}>
          {children}
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
            {booking.guestName}, {booking.time}, {count(booking.partySize, "guest")}. The table becomes free.
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
    </>
  );
}
