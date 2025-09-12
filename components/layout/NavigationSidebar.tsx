"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Home,
  Layout,
  Package,
  Server,
  Database,
  Cloud,
  Settings,
  FileCode,
  Activity,
  GitBranch,
  Shield,
  Monitor,
  FolderOpen,
  ChevronRight,
  Workflow,
  Network,
  Plus,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const navItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/dashboard",
  },
  {
    title: "Clusters",
    icon: Server,
    href: "/dashboard/clusters",
    submenu: [
      { title: "All Clusters", href: "/dashboard/clusters", icon: Server },
      { title: "Add Cluster", href: "/dashboard/clusters/new", icon: Package },
    ],
  },
  {
    title: "Workflow Designer",
    icon: Workflow,
    href: "/dashboard/workflow",
    submenu: [
      { title: "All Workflows", href: "/dashboard/workflow", icon: FolderOpen },
      { title: "New Workflow", href: "/dashboard/workflow/new", icon: Plus },
      { title: "Templates", href: "/dashboard/workflow/templates", icon: Layout },
    ],
  },
  {
    title: "Deployments",
    icon: Server,
    href: "/deployments",
    submenu: [
      { title: "Active", href: "/deployments/active", icon: Activity },
      { title: "History", href: "/deployments/history", icon: GitBranch },
      { title: "Rollbacks", href: "/deployments/rollbacks", icon: Shield },
    ],
  },
  {
    title: "Resources",
    icon: Database,
    href: "/resources",
    submenu: [
      { title: "Storage", href: "/resources/storage", icon: Database },
      { title: "Networking", href: "/resources/networking", icon: Network },
      { title: "Compute", href: "/resources/compute", icon: Cloud },
    ],
  },
  {
    title: "Monitoring",
    icon: Monitor,
    href: "/monitoring",
    submenu: [
      { title: "Metrics", href: "/monitoring/metrics", icon: Activity },
      { title: "Logs", href: "/monitoring/logs", icon: FileCode },
      { title: "Alerts", href: "/monitoring/alerts", icon: Shield },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
  },
];

export function NavigationSidebar() {
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-border bg-sidebar">
        <SidebarHeader className="border-b border-sidebar-border px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Cloud className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-sidebar-foreground">
              KubeOrch
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-xs uppercase text-sidebar-foreground/60">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map(item => (
                  <SidebarMenuItem key={item.title}>
                    {item.submenu ? (
                      <Collapsible
                        open={openMenus[item.title]}
                        onOpenChange={() => toggleMenu(item.title)}
                      >
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="w-full">
                            <item.icon className="h-4 w-4" />
                            <span className="flex-1">{item.title}</span>
                            <ChevronRight
                              className={`h-4 w-4 transition-transform duration-200 ${
                                openMenus[item.title] ? "rotate-90" : ""
                              }`}
                            />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.submenu.map(subitem => (
                              <SidebarMenuSubItem key={subitem.title}>
                                <SidebarMenuSubButton asChild>
                                  <Link
                                    href={subitem.href}
                                    className="flex items-center gap-2"
                                  >
                                    <subitem.icon className="h-3 w-3" />
                                    <span>{subitem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <SidebarMenuButton asChild>
                        <Link
                          href={item.href}
                          className="flex items-center gap-2"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-2 text-xs text-sidebar-foreground/60">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>All systems operational</span>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarTrigger className="fixed left-4 top-4 z-50 md:hidden" />
    </SidebarProvider>
  );
}
