import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";
import { RequirePermission } from "@/components/require-permission";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <RequirePermission permission="reports.view">
      <PagePlaceholder
        title="Reports"
        description="Covers, no-show rate, stock value, usage and waste."
        phase="Phase 5"
      />
    </RequirePermission>
  );
}
