import {
  BarChart3,
  Boxes,
  CalendarDays,
  Clock,
  LayoutDashboard,
  LayoutGrid,
  Map,
  Package,
  PackageMinus,
  Settings,
  Users,
  ArrowLeftRight,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/lib/permissions";

// Sidebar structure from wiki/modules/layout-sidebar.md.
export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  permission: Permission;
};

export type NavGroup = {
  label?: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard, permission: "dashboard.view" },
    ],
  },
  {
    label: "Bookings",
    items: [
      { title: "Calendar", href: "/bookings/calendar", icon: CalendarDays, permission: "bookings.manage" },
      { title: "Timeline", href: "/bookings/timeline", icon: Clock, permission: "bookings.manage" },
      { title: "Tables", href: "/bookings/tables", icon: LayoutGrid, permission: "bookings.manage" },
      { title: "Floor plan", href: "/bookings/floor-plan", icon: Map, permission: "bookings.manage" },
      { title: "Waitlist", href: "/bookings/waitlist", icon: Users, permission: "bookings.manage" },
    ],
  },
  {
    label: "Inventory",
    items: [
      { title: "Items", href: "/inventory/items", icon: Package, permission: "inventory.view" },
      { title: "Stock movements", href: "/inventory/movements", icon: ArrowLeftRight, permission: "inventory.view" },
      { title: "Batches & expiry", href: "/inventory/batches", icon: Boxes, permission: "inventory.view" },
      { title: "Low stock", href: "/inventory/low-stock", icon: PackageMinus, permission: "inventory.view" },
    ],
  },
  {
    label: "Admin",
    items: [
      { title: "Reports", href: "/reports", icon: BarChart3, permission: "reports.view" },
      { title: "Settings", href: "/settings", icon: Settings, permission: "settings.manage" },
    ],
  },
];

export function findNavItem(pathname: string) {
  for (const group of NAV_GROUPS) {
    const item = group.items.find((entry) => entry.href === pathname);
    if (item) return { group, item };
  }
  return null;
}
