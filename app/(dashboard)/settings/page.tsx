import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";
import { RequirePermission } from "@/components/require-permission";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <RequirePermission permission="settings.manage">
      <PagePlaceholder
        title="Settings"
        description="Booking hours, slots, sections and tables, inventory defaults, users and roles."
        phase="Phase 1"
      />
    </RequirePermission>
  );
}
