"use client";

import { useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { BookingActions } from "@/components/bookings/booking-actions";
import type { BookingRowData } from "@/components/bookings/booking-row";
import { bookingStyle } from "@/components/bookings/status";
import { WalkInButton } from "@/components/bookings/walk-in-button";
import { Button } from "@/components/ui/button";

export type FloorState = "FREE" | "SOON" | "SEATED" | "CLOSED";
export type FloorTable = {
  id: string;
  label: string;
  shape: "ROUND" | "SQUARE" | "RECT";
  rotation: number;
  posX: number;
  posY: number;
  maxSeats: number;
  state: FloorState;
  booking: BookingRowData | null;
};

// Same colours as the Tables page and the timeline (wiki/architecture/ui-components.md).
function tableColour(table: FloorTable) {
  if (table.state === "CLOSED") return "border-2 border-dashed border-muted-foreground/40 bg-muted text-muted-foreground";
  if (table.state === "FREE") return "border-2 border-emerald-600 bg-background text-foreground";
  if (table.state === "SOON") return `bg-amber-500 text-white ${table.booking?.late ? "ring-2 ring-red-500 ring-offset-1" : ""}`;
  return table.booking ? bookingStyle(table.booking.status, table.booking.source).className : "bg-emerald-600 text-white";
}

// Size from shape and seats, in canvas pixels (the reference plan is about 1180 × 650).
function tableSize(table: FloorTable) {
  if (table.shape === "ROUND") {
    const size = 36 + table.maxSeats * 5;
    return { width: size, height: size };
  }
  if (table.shape === "SQUARE") return { width: 40, height: 40 };
  return { width: 34 + table.maxSeats * 9, height: 40 };
}

const LEGEND = [
  { label: "Free", swatch: "border-2 border-emerald-600 bg-background" },
  { label: "Reserved soon", swatch: "bg-amber-500" },
  { label: "Seated", swatch: "bg-emerald-600" },
  { label: "Walk-in", swatch: "bg-violet-600" },
  { label: "Closed section", swatch: "border-2 border-dashed border-muted-foreground/40 bg-muted" },
];

/** The room with every table at its real position, coloured by its state at the chosen moment. */
export function FloorPlanCanvas({ tables, slotMinutes, live }: { tables: FloorTable[]; slotMinutes: number; live: boolean }) {
  const [zoom, setZoom] = useState(1);
  const width = Math.max(...tables.map((table) => table.posX)) + 100;
  const height = Math.max(...tables.map((table) => table.posY)) + 80;

  return (
    <div className="grid min-w-0 gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ul aria-label="Colour key" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {LEGEND.map((item) => (
            <li key={item.label} className="flex items-center gap-1.5">
              <span aria-hidden className={`inline-block size-3 rounded-full ${item.swatch}`} />
              {item.label}
            </li>
          ))}
        </ul>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" aria-label="Zoom out" disabled={zoom <= 0.6} onClick={() => setZoom((value) => Math.round((value - 0.2) * 10) / 10)}>
            <ZoomOut />
          </Button>
          <Button variant="outline" size="icon" aria-label="Zoom in" disabled={zoom >= 1.6} onClick={() => setZoom((value) => Math.round((value + 0.2) * 10) / 10)}>
            <ZoomIn />
          </Button>
        </div>
      </div>

      <div className="min-w-0 overflow-auto rounded-xl border bg-muted/20">
        <div className="relative" style={{ width: width * zoom, height: height * zoom }}>
          <div className="absolute top-0 left-0 origin-top-left" style={{ width, height, transform: `scale(${zoom})` }}>
            {tables.map((table) => {
              const { width: w, height: h } = tableSize(table);
              const title = [
                `Table ${table.label}, ${table.maxSeats} seats`,
                table.state === "CLOSED" ? "section closed" : table.booking ? `${table.booking.guestName}, ${table.booking.partySize} ${table.booking.partySize === 1 ? "guest" : "guests"}, ${table.booking.time}` : "free",
              ].join(" · ");
              const shape = (
                <button
                  type="button"
                  aria-label={title}
                  title={title}
                  disabled={table.state === "CLOSED" || (table.state === "FREE" && !live)}
                  className={`absolute grid place-items-center text-xs leading-tight font-semibold shadow-sm transition enabled:hover:brightness-95 enabled:cursor-pointer ${table.shape === "ROUND" ? "rounded-full" : "rounded-md"} ${tableColour(table)}`}
                  style={{ left: table.posX, top: table.posY, width: w, height: h, transform: `translate(-50%, -50%) rotate(${table.rotation}deg)` }}
                >
                  <span>
                    {table.label}
                    {table.booking && table.state !== "FREE" && <span className="block text-[10px] font-normal opacity-90">{table.booking.partySize} pax</span>}
                  </span>
                </button>
              );
              if (table.state === "FREE" && live) {
                return (
                  <WalkInButton key={table.id} tableId={table.id} tableLabel={table.label} maxSeats={table.maxSeats}>
                    {shape}
                  </WalkInButton>
                );
              }
              if (table.booking && (table.state === "SOON" || table.state === "SEATED")) {
                return (
                  <BookingActions key={table.id} booking={table.booking} slotMinutes={slotMinutes}>
                    {shape}
                  </BookingActions>
                );
              }
              return <span key={table.id}>{shape}</span>;
            })}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {live ? "Click a free table to seat a walk-in, or a booked table for its actions." : "Showing a future moment. Go back to Live to seat walk-ins."}
      </p>
    </div>
  );
}
