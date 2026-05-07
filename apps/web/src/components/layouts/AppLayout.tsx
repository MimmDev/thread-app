"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

type Thread = {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
};

type AppLayoutProps = {
  children: React.ReactNode;
  threads?: Thread[];
};

export function AppLayout({ children, threads = [] }: AppLayoutProps) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="flex flex-row items-center justify-between px-4 py-3">
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-widest">
            Threads
          </SidebarGroupLabel>
          <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
            <Link href="/dashboard/new">
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {threads.map((thread) => {
                  const isActive = pathname === `/dashboard/${thread.id}`;
                  return (
                    <SidebarMenuItem key={thread.id}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={`/dashboard/${thread.id}`}>
                          <span>{thread.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <main className="flex flex-col flex-1 min-h-screen">{children}</main>
    </SidebarProvider>
  );
}
