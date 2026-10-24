"use client";

import { type ReactNode, useState } from "react";
import { UserPlus } from "lucide-react";
import { seatWalkIn } from "@/app/(dashboard)/bookings/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionToast } from "@/components/use-action-toast";

/** Quick walk-in: seats a party at this table now (wiki/modules/booking.md). */
export function WalkInButton({
  tableId,
  tableLabel,
  maxSeats,
  children,
}: {
  tableId: string;
  tableLabel: string;
  maxSeats: number;
  /** Custom trigger, e.g. a table on the floor plan. Defaults to a "Seat walk-in" button. */
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [onSubmit, pending] = useActionToast(seatWalkIn, `Walk-in seated at table ${tableLabel}`, () => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button size="sm" variant="outline">
            <UserPlus />
            Seat walk-in
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Walk-in at table {tableLabel}</DialogTitle>
          <DialogDescription>
            Seats the party now. Table {tableLabel} has {maxSeats} seats.
          </DialogDescription>
        </DialogHeader>
        {/* key resets the fields each time the dialog opens */}
        <form key={String(open)} onSubmit={onSubmit} className="grid gap-4">
          <input type="hidden" name="tableIds" value={tableId} />
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor={`walk-in-size-${tableId}`}>Guests</Label>
              <Input id={`walk-in-size-${tableId}`} name="partySize" type="number" min={1} max={60} defaultValue={Math.min(2, maxSeats)} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`walk-in-name-${tableId}`}>Name</Label>
              <Input id={`walk-in-name-${tableId}`} name="guestName" maxLength={80} placeholder="Optional" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`walk-in-phone-${tableId}`}>Phone</Label>
            <Input id={`walk-in-phone-${tableId}`} name="guestPhone" type="tel" maxLength={30} placeholder="Optional" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Seating…" : "Seat now"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
