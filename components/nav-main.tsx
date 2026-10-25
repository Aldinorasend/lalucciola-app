"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NAV_GROUPS } from "@/lib/navigation";
import { can, type Role } from "@/lib/permissions";

/** badges: counts shown next to items, keyed by href (e.g. parties waiting). */
export function NavMain({ role, badges = {} }: { role: Role; badges?: Record<string, number> }) {
  const pathname = usePathname();

  return NAV_GROUPS.map((group, index) => {
    const items = group.items.filter((item) => can(role, item.permission));
    if (items.length === 0) return null;

    return (
      <SidebarGroup key={group.label ?? index}>
        {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.title}
                // The default active tint matches the hover tint and is nearly invisible; use the solid primary colour.
                className="data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:hover:bg-sidebar-primary/90 data-active:hover:text-sidebar-primary-foreground"
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
              {badges[item.href] > 0 && <SidebarMenuBadge>{badges[item.href]}</SidebarMenuBadge>}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    );
  });
}
