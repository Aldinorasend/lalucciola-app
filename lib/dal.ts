import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { can, type Permission, type Role } from "@/lib/permissions";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

// Data Access Layer: the one place pages and actions read the session.
// Reads the request, so callers must sit behind a <Suspense> boundary.
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Re-read the user so deactivation and role changes apply immediately,
  // not when the 12 h session cookie expires.
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
  if (!user?.active) redirect("/login");

  return { id: user.id, name: user.name, email: user.email, role: user.role };
});

export async function hasPermission(permission: Permission): Promise<boolean> {
  const user = await getCurrentUser();
  return can(user.role, permission);
}
