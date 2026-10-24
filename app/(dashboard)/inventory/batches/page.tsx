import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Batches & expiry" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Batches & expiry"
      description="Batches that are expired or expiring soon."
      phase="Phase 4"
    />
  );
}
