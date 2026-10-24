import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Tables" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Tables"
      description="Live status of every table, grouped by section."
      phase="Phase 2"
    />
  );
}
