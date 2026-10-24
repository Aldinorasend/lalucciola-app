import { test } from "node:test";
import assert from "node:assert/strict";
import { can, ROLES, type Permission } from "../lib/permissions";

// Mirrors the matrix in wiki/architecture/roles-permissions.md. A change here
// must match a decision in the wiki.
const ALLOWED: Record<Permission, string> = {
  "dashboard.view": "OWNER MANAGER STAFF",
  "dashboard.viewCosts": "OWNER MANAGER",
  "bookings.manage": "OWNER MANAGER STAFF",
  "bookings.delete": "OWNER",
  "inventory.view": "OWNER MANAGER STAFF",
  "inventory.recordUsage": "OWNER MANAGER STAFF",
  "inventory.receive": "OWNER MANAGER",
  "inventory.adjust": "OWNER MANAGER",
  "inventory.editItems": "OWNER MANAGER",
  "inventory.viewCosts": "OWNER MANAGER",
  "reports.view": "OWNER MANAGER",
  "settings.manage": "OWNER",
  "users.manage": "OWNER",
};

test("role permissions match the wiki matrix", () => {
  for (const [permission, roles] of Object.entries(ALLOWED) as [Permission, string][]) {
    for (const role of ROLES) {
      assert.equal(can(role, permission), roles.split(" ").includes(role), `${role} ${permission}`);
    }
  }
});
