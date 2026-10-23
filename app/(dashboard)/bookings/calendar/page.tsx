import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Calendar" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Calendar"
      description="Bookings by day, week and month."
      phase="Phase 1"
    />
  );
}
