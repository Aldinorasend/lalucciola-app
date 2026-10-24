import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Stock movements" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Stock movements"
      description="Every stock change: received, used, wasted, counted."
      phase="Phase 3"
    />
  );
}
