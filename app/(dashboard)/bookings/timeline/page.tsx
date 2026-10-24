import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Timeline" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Timeline"
      description="Today's service: tables down the side, 15-minute slots across."
      phase="Phase 1"
    />
  );
}
