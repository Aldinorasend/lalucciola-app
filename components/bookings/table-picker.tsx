"use client";

import { useEffect, useState, useTransition } from "react";
import { getTableOptions, type TableOption } from "@/app/(dashboard)/bookings/actions";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Tables by section with the ones taken at that date and time crossed out.
 * Posts the chosen tables as "tableIds". Used by the booking form and the waitlist.
 */
export function TablePicker({
  date,
  time,
  partySize,
  excludeBookingId,
  initialSelected = [],
}: {
  date: string;
  time: string;
  partySize: number;
  excludeBookingId?: string;
  initialSelected?: string[];
}) {
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [options, setOptions] = useState<TableOption[] | null>(null);
  const [loading, startLoading] = useTransition();

  useEffect(() => {
    startLoading(async () => setOptions(await getTableOptions(date, time, excludeBookingId)));
  }, [date, time, excludeBookingId]);

  const chosen = options?.filter((table) => selected.includes(table.id)) ?? [];
  const seats = chosen.reduce((sum, table) => sum + table.maxSeats, 0);
  const sections = [...new Set(options?.map((table) => table.section))];

  function toggle(id: string, checked: boolean) {
    setSelected((current) => (checked ? [...current, id] : current.filter((tableId) => tableId !== id)));
  }

  return (
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
                      title={busy ? (table.busyWith ?? "") : `${table.maxSeats} seats${table.combinable ? ", combinable" : ""}`}
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
      <p className="text-xs text-muted-foreground">Crossed-out tables are taken at this time or in a closed section. Only combinable tables can be joined.</p>
    </fieldset>
  );
}
