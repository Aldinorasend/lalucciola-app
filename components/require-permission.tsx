import { Suspense, type ReactNode } from "react";
import { AccessDenied } from "@/components/page-placeholder";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission } from "@/lib/dal";
import type { Permission } from "@/lib/permissions";

// Server-side role gate. The session read streams in behind its own boundary
// so the rest of the page stays in the static shell (Cache Components).
export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<Skeleton className="h-28 w-full" />}>
      <Gate permission={permission}>{children}</Gate>
    </Suspense>
  );
}

async function Gate({ permission, children }: { permission: Permission; children: ReactNode }) {
  if (!(await hasPermission(permission))) return <AccessDenied />;
  return children;
}
