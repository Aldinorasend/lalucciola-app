"use client";

import { useState } from "react";
import { addToWaitlist, markWaitlistLeft, seatFromWaitlist } from "@/app/(dashboard)/bookings/actions";
import { TablePicker } from "@/components/bookings/table-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionToast } from "@/components/use-action-toast";
import { count } from "@/lib/bookings";

export function AddToWaitlistForm() {
  // Bumping the key clears the fields after a successful add.
  const [round, setRound] = useState(0);
  const [onSubmit, pending] = useActionToast(addToWaitlist, "Added to the waitlist", () => setRound((value) => value + 1));

  return (
    <form key={round} onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[1fr_6rem_10rem_7rem_auto] sm:items-end">
      <div className="grid gap-1.5">
        <Label htmlFor="wl-name">Name</Label>
        <Input id="wl-name" name="guestName" required maxLength={80} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="wl-size">Guests</Label>
        <Input id="wl-size" name="partySize" type="number" min={1} max={60} defaultValue={2} required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="wl-phone">Phone</Label>
        <Input id="wl-phone" name="guestPhone" type="tel" maxLength={30} placeholder="Optional" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="wl-quote">Quoted wait</Label>
        <Input id="wl-quote" name="quotedWaitMin" type="number" min={0} max={240} placeholder="min" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add to waitlist"}
      </Button>
    </form>
  );
}

export type WaitingParty = {
  id: string;
  guestName: string;
  guestPhone: string | null;
  partySize: number;
  waitedMinutes: number;
  quotedWaitMin: number | null;
};

export function WaitingRow({ party, date, time }: { party: WaitingParty; date: string; time: string }) {
  const [seating, setSeating] = useState(false);
  const [onSeat, seatPending] = useActionToast(seatFromWaitlist, `${party.guestName} seated`, () => setSeating(false));
  const [onLeft, leftPending] = useActionToast(markWaitlistLeft, `${party.guestName} left the waitlist`);
  const overdue = party.quotedWaitMin !== null && party.waitedMinutes > party.quotedWaitMin;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-b py-3 last:border-0">
      <div className="grid gap-0.5">
        <span className="font-medium">
          {party.guestName} · {count(party.partySize, "guest")}
        </span>
        <span className="text-sm text-muted-foreground">
          <span className={overdue ? "font-medium text-amber-600" : ""}>Waiting {party.waitedMinutes} min</span>
          {party.quotedWaitMin !== null && ` · quoted ${party.quotedWaitMin} min`}
          {party.guestPhone && ` · ${party.guestPhone}`}
        </span>
      </div>
      <div className="flex gap-2">
        <Dialog open={seating} onOpenChange={setSeating}>
          <DialogTrigger asChild>
            <Button size="sm">Seat</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90svh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Seat {party.guestName}</DialogTitle>
              <DialogDescription>
                {count(party.partySize, "guest")}. Pick free tables; they become a walk-in booking starting now.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSeat} className="grid gap-4">
              <input type="hidden" name="id" value={party.id} />
              {seating && <TablePicker date={date} time={time} partySize={party.partySize} />}
              <DialogFooter>
                <Button type="submit" disabled={seatPending}>
                  {seatPending ? "Seating…" : "Seat now"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <form onSubmit={onLeft}>
          <input type="hidden" name="id" value={party.id} />
          <Button type="submit" size="sm" variant="outline" disabled={leftPending}>
            Left
          </Button>
        </form>
      </div>
    </li>
  );
}
