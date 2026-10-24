import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Low stock" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Low stock"
      description="Items at or below their minimum level."
      phase="Phase 4"
    />
  );
}
