import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Floor plan" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Floor plan"
      description="The room layout with live table status."
      phase="Phase 2"
    />
  );
}
