"use client";

import { saveBookingHours } from "@/app/(dashboard)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type HoursRow, toTime, WEEKDAYS } from "@/lib/booking-settings";
import { useActionToast } from "./use-action-toast";

type Settings = {
  slotMinutes: number;
  diningMinutes: number;
  reservedSoonMinutes: number;
  lateGraceMinutes: number;
};

const SETTING_FIELDS: { name: keyof Settings; label: string; hint: string }[] = [
  { name: "slotMinutes", label: "Slot length (min)", hint: "Booking times snap to this." },
  { name: "diningMinutes", label: "Dining duration (min)", hint: "How long a table is held." },
  { name: "reservedSoonMinutes", label: "Reserved soon (min)", hint: "Flag a table this long before a booking." },
  { name: "lateGraceMinutes", label: "Late after (min)", hint: "When a booking shows as Late." },
];

export function BookingHoursForm({ settings, hours }: { settings: Settings; hours: HoursRow[] }) {
  const [onSubmit, pending] = useActionToast(saveBookingHours, "Booking hours saved");

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SETTING_FIELDS.map((field) => (
          <div key={field.name} className="grid gap-1.5">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input id={field.name} name={field.name} type="number" min={0} defaultValue={settings[field.name]} required />
            <p className="text-xs text-muted-foreground">{field.hint}</p>
          </div>
        ))}
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">
          Booking start times <span className="font-normal text-muted-foreground">(between 06:00 and 20:00)</span>
        </legend>
        {hours.map((day) => (
          <div key={day.dayOfWeek} className="grid grid-cols-[7rem_1fr_1fr] items-center gap-3 sm:max-w-md">
            <span className="text-sm">{WEEKDAYS[day.dayOfWeek]}</span>
            <Input
              aria-label={`${WEEKDAYS[day.dayOfWeek]} first booking`}
              name={`first-${day.dayOfWeek}`}
              type="time"
              min="06:00"
              max="20:00"
              step={settings.slotMinutes * 60}
              defaultValue={toTime(day.firstBookingAt)}
              required
            />
            <Input
              aria-label={`${WEEKDAYS[day.dayOfWeek]} last booking`}
              name={`last-${day.dayOfWeek}`}
              type="time"
              min="06:00"
              max="20:00"
              step={settings.slotMinutes * 60}
              defaultValue={toTime(day.lastBookingAt)}
              required
            />
          </div>
        ))}
      </fieldset>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Save booking hours"}
      </Button>
    </form>
  );
}
