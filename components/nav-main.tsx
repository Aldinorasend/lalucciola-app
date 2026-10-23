"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NAV_GROUPS } from "@/lib/navigation";
import { can, type Role } from "@/lib/permissions";

export function NavMain({ role }: { role: Role }) {
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
              <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    );
  });
}
