import type { BookingStatus } from "@/lib/bookings";

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
