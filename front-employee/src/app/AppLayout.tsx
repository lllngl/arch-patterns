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
import { NavUser } from "@/components/custom/NavUser";
import {
  HomeIcon,
  Users,
  Wallet,
  UserIcon,
  Percent,
  Banknote,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

const items = [
  {
    title: "Главная",
    url: "/",
    icon: HomeIcon,
  },
  {
    title: "Пользователи",
    url: "/users",
    icon: Users,
  },
  {
    title: "Счета",
    url: "/accounts",
    icon: Wallet,
  },
  {
    title: "Тарифы",
    url: "/tariffs",
    icon: Percent,
  },
  {
    title: "Кредиты",
    url: "/loans",
    icon: Banknote,
  },
  {
    title: "Профиль",
    url: "/profile",
    icon: UserIcon,
  },
];

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
          <NavUser />
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
        <div className="flex-1 min-h-0 overflow-auto">
          <Outlet />
        </div>
      </SidebarInset>
      <Toaster richColors position="bottom-right" />
    </SidebarProvider>
  );
}
