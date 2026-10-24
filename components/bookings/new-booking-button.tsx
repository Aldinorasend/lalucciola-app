"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { BookingForm } from "@/components/bookings/booking-form";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function NewBookingButton({ date, time, slotMinutes }: { date: string; time: string; slotMinutes: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus />
          New booking
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>New booking</SheetTitle>
          <SheetDescription>For a phone or WhatsApp reservation.</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          {/* key resets the form each time the sheet opens */}
          <BookingForm
            key={String(open)}
            initial={{ guestName: "", guestPhone: "", partySize: 2, date, time, source: "PHONE", notes: "", tableIds: [] }}
            slotMinutes={slotMinutes}
            onDone={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
