import type { Metadata } from "next";
import { RequirePermission } from "@/components/require-permission";
import { BookingHoursForm } from "@/components/settings/booking-hours-form";
import { TablesEditor } from "@/components/settings/tables-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Booking hours, slots, sections and tables.</p>
      </div>
      <RequirePermission permission="settings.manage">
        <SettingsTabs />
      </RequirePermission>
    </div>
  );
}

async function SettingsTabs() {
  const [settings, hours, areas, tables] = await Promise.all([
    db.bookingSettings.findUnique({ where: { id: 1 } }),
    db.openingHours.findMany({ orderBy: { dayOfWeek: "asc" } }),
    db.area.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.table.findMany({
      orderBy: { label: "asc" },
      select: { id: true, label: true, areaId: true, minSeats: true, maxSeats: true, combinable: true, active: true },
    }),
  ]);

  if (!settings || hours.length !== 7) {
    return <p className="text-sm text-destructive">Booking settings are missing. Run `npm run db:seed`.</p>;
  }

  return (
    <Tabs defaultValue="hours">
      <TabsList>
        <TabsTrigger value="hours">Booking hours</TabsTrigger>
        <TabsTrigger value="tables">Sections &amp; tables</TabsTrigger>
      </TabsList>
      <TabsContent value="hours" className="pt-4">
        <BookingHoursForm settings={settings} hours={hours} />
      </TabsContent>
      <TabsContent value="tables" className="pt-4">
        <TablesEditor areas={areas} tables={tables} />
      </TabsContent>
    </Tabs>
  );
}
