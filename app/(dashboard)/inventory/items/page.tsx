import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Items" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Items"
      description="Ingredients and beverages with stock on hand."
      phase="Phase 3"
    />
  );
}
