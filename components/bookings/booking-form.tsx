"use client";

import { useState } from "react";
import { saveBooking } from "@/app/(dashboard)/bookings/actions";
import { TablePicker } from "@/components/bookings/table-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActionToast } from "@/components/use-action-toast";

export type BookingFormValues = {
  id?: string;
  guestName: string;
  guestPhone: string;
  partySize: number;
  date: string;
  time: string;
  source: string;
  notes: string;
  tableIds: string[];
};

// Walk-ins get their own quick flow in Phase 2 (wiki/modules/booking.md).
const SOURCES = [
  { value: "PHONE", label: "Phone" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "OTHER", label: "Other" },
];

export function BookingForm({ initial, slotMinutes, onDone }: { initial: BookingFormValues; slotMinutes: number; onDone: () => void }) {
  // Editing a walk-in: phone optional, any minute, source stays Walk-in.
  const walkIn = initial.source === "WALK_IN";
  const sources = walkIn ? [{ value: "WALK_IN", label: "Walk-in" }, ...SOURCES] : SOURCES;
  const [onSubmit, pending] = useActionToast(saveBooking, initial.id ? "Booking updated" : "Booking saved", onDone);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [partySize, setPartySize] = useState(initial.partySize);

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid gap-1.5">
        <Label htmlFor="guestName">Guest name</Label>
        <Input id="guestName" name="guestName" defaultValue={initial.guestName} required maxLength={80} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="guestPhone">Phone</Label>
          <Input id="guestPhone" name="guestPhone" type="tel" defaultValue={initial.guestPhone} required={!walkIn} maxLength={30} placeholder={walkIn ? "Optional" : undefined} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="partySize">Guests</Label>
          <Input
            id="partySize"
            name="partySize"
            type="number"
            min={1}
            max={60}
            value={partySize}
            onChange={(event) => setPartySize(Number(event.target.value))}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="time">Time</Label>
          <Input
            id="time"
            name="time"
            type="time"
            step={walkIn ? 60 : slotMinutes * 60}
            value={time}
            onChange={(event) => setTime(event.target.value)}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Source</Label>
          <Select name="source" defaultValue={initial.source}>
            <SelectTrigger aria-label="Source" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sources.map((source) => (
                <SelectItem key={source.value} value={source.value}>
                  {source.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="notes">Note</Label>
          <Input id="notes" name="notes" defaultValue={initial.notes} maxLength={200} placeholder="Internal, optional" />
        </div>
      </div>

      <TablePicker date={date} time={time} partySize={partySize} excludeBookingId={initial.id} initialSelected={initial.tableIds} />

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : initial.id ? "Save changes" : "Save booking"}
      </Button>
    </form>
  );
}
