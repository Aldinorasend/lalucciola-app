import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Waitlist" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Waitlist"
      description="Parties waiting for a table."
      phase="Phase 2"
    />
  );
}
