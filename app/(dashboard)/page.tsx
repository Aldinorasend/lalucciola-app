import { Suspense } from "react";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/dal";
import { ROLE_LABELS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Dashboard" };

// Widgets from wiki/modules/dashboard.md, filled in during Phase 5.
const WIDGETS = [
  { title: "Today's covers", description: "Booked covers against total seats in open sections." },
  { title: "Upcoming bookings", description: "The next two hours, with quick Seat and No-show actions." },
  { title: "Tables now", description: "Free, seated and reserved-soon tables." },
  { title: "Waitlist", description: "Parties waiting and the longest wait." },
  { title: "Low stock", description: "Items at or below their minimum level." },
  { title: "Expiring soon", description: "Batches expiring within three days." },
];

export default function DashboardPage() {
  return (
    <div className="grid gap-6">
      <Suspense fallback={<Skeleton className="h-14 w-72" />}>
        <Greeting />
      </Suspense>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {WIDGETS.map((widget) => (
          <Card key={widget.title} className="border-dashed">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{widget.title}</CardTitle>
                <Badge variant="secondary">Phase 5</Badge>
              </div>
              <CardDescription>{widget.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

async function Greeting() {
  const user = await getCurrentUser();
  return (
    <div className="grid gap-1">
      <h1 className="text-2xl font-semibold tracking-tight">Hello, {user.name}</h1>
      <p className="text-muted-foreground">
        Signed in as {ROLE_LABELS[user.role]}. Here&apos;s today at La Lucciola.
      </p>
    </div>
  );
}
