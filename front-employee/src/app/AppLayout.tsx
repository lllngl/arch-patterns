import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { AppBreadcrumbs } from "./AppBreadcrumbs";
import { HomeIcon } from "lucide-react";
import { NavUser } from "@/components/custom/NavUser";
import { UserIcon } from "lucide-react";

const items = [
  {
    title: "Главная",
    url: "/",
    icon: HomeIcon,
  },
  {
    title: "Профиль",
    url: "/profile",
    icon: UserIcon,
  },
];

const user = {
  name: "Test User",
  email: "m@example.com",
  avatar: "",
};

export default function AppLayout() {
  const { pathname } = useLocation();
  return (
    <SidebarProvider>
      <Sidebar>
        <div className="px-2 pt-2 pb-4">
          <span className="text-xl font-bold">Bank</span>
        </div>
        <SidebarContent>
          <SidebarMenu>
            {items.map((item) => {
              const active =
                item.url === "/"
                  ? pathname === "/"
                  : pathname === item.url ||
                    pathname.startsWith(item.url + "/");
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={active}>
                    <NavLink to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="flex flex-col min-w-0 h-svh">
        <div className="border-b px-4 py-2 flex items-center gap-2">
          <SidebarTrigger />
          <nav className="text-sm font-normal leading-5 tracking-normal font-sans flex items-center gap-1">
            <AppBreadcrumbs />
          </nav>
        </div>
        <div className="flex-1 min-h-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
