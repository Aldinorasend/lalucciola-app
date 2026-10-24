"use client";

import { useEffect, useState, useTransition } from "react";
import { getTableOptions, saveBooking, type TableOption } from "@/app/(dashboard)/bookings/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [selected, setSelected] = useState<string[]>(initial.tableIds);
  const [options, setOptions] = useState<TableOption[] | null>(null);
  const [loading, startLoading] = useTransition();

  useEffect(() => {
    startLoading(async () => setOptions(await getTableOptions(date, time, initial.id)));
  }, [date, time, initial.id]);

  const chosen = options?.filter((table) => selected.includes(table.id)) ?? [];
  const seats = chosen.reduce((sum, table) => sum + table.maxSeats, 0);
  const sections = [...new Set(options?.map((table) => table.section))];

  function toggle(id: string, checked: boolean) {
    setSelected((current) => (checked ? [...current, id] : current.filter((tableId) => tableId !== id)));
  }

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

      <fieldset className="grid gap-2">
        <legend className="mb-1 flex w-full items-center justify-between text-sm font-medium">
          <span>Tables</span>
          <span className={seats && seats < partySize ? "text-destructive" : "text-muted-foreground"}>
            {chosen.length ? `${chosen.map((table) => table.label).join(" + ")} · ${seats} seats` : "None chosen"}
          </span>
        </legend>
        {!options || loading ? (
          <p className="text-sm text-muted-foreground">Checking free tables…</p>
        ) : (
          sections.map((section) => (
            <div key={section} className="grid gap-1">
              <span className="text-xs text-muted-foreground">{section}</span>
              <div className="flex flex-wrap gap-2">
                {options
                  .filter((table) => table.section === section)
                  .map((table) => {
                    const busy = table.busyWith !== null;
                    return (
                      <label
                        key={table.id}
                        title={busy ? `Booked: ${table.busyWith}` : `${table.maxSeats} seats${table.combinable ? ", combinable" : ""}`}
                        className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm ${busy ? "cursor-not-allowed opacity-50 line-through" : ""}`}
                      >
                        <Checkbox
                          name="tableIds"
                          value={table.id}
                          checked={selected.includes(table.id)}
                          disabled={busy && !selected.includes(table.id)}
                          onCheckedChange={(checked) => toggle(table.id, checked === true)}
                        />
                        {table.label}
                        <span className="text-xs text-muted-foreground">{table.maxSeats}</span>
                      </label>
                    );
                  })}
              </div>
            </div>
          ))
        )}
        <p className="text-xs text-muted-foreground">Crossed-out tables are taken at this time. Only combinable tables can be joined.</p>
      </fieldset>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : initial.id ? "Save changes" : "Save booking"}
      </Button>
    </form>
  );
}
