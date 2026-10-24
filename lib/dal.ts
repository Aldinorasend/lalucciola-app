import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
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

  const { id, name, email, role } = session.user;
  return { id, name: name ?? "", email: email ?? "", role };
});

export async function hasPermission(permission: Permission): Promise<boolean> {
  const user = await getCurrentUser();
  return can(user.role, permission);
}
