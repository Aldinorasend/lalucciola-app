// Role × action matrix from wiki/architecture/roles-permissions.md (D-027).
// The server check is the real guard; the sidebar only uses this to hide items.

export const ROLES = ["OWNER", "MANAGER", "STAFF"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  STAFF: "Staff",
};

const PERMISSIONS = {
  "dashboard.view": ["OWNER", "MANAGER", "STAFF"],
  "dashboard.viewCosts": ["OWNER", "MANAGER"],
  "bookings.manage": ["OWNER", "MANAGER", "STAFF"],
  "bookings.delete": ["OWNER"],
  "inventory.view": ["OWNER", "MANAGER", "STAFF"],
  "inventory.recordUsage": ["OWNER", "MANAGER", "STAFF"],
  "inventory.receive": ["OWNER", "MANAGER"],
  "inventory.adjust": ["OWNER", "MANAGER"],
  "inventory.editItems": ["OWNER", "MANAGER"],
  "inventory.viewCosts": ["OWNER", "MANAGER"],
  "reports.view": ["OWNER", "MANAGER"],
  "settings.manage": ["OWNER"],
  "users.manage": ["OWNER"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}
