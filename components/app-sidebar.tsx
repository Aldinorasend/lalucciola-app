import { Suspense } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/dal";
import { db } from "@/lib/db";

// The shell renders instantly; the role-filtered nav and user menu stream in.
export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Sparkles className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">La Lucciola</span>
                  <span className="truncate text-xs text-muted-foreground">Staff</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <Suspense fallback={<NavSkeleton />}>
          <RoleNav />
        </Suspense>
      </SidebarContent>
      <SidebarFooter>
        <Suspense fallback={<SidebarMenuSkeleton showIcon />}>
          <UserMenu />
        </Suspense>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

async function RoleNav() {
  const [user, waiting] = await Promise.all([getCurrentUser(), db.waitlistEntry.count({ where: { status: "WAITING" } })]);
  return <NavMain role={user.role} badges={{ "/bookings/waitlist": waiting }} />;
}

async function UserMenu() {
  const user = await getCurrentUser();
  return <NavUser name={user.name} email={user.email} role={user.role} />;
}

function NavSkeleton() {
  return (
    <SidebarMenu className="p-2">
      {["70%", "55%", "80%", "60%", "75%", "50%", "65%", "85%"].map((width, index) => (
        <SidebarMenuItem key={index}>
          <SidebarMenuSkeleton showIcon width={width} />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
