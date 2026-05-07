"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createThread } from "@/lib/actions/threads";
import { signOut } from "next-auth/react";

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
  const router = useRouter();
  const [creatingThread, setCreatingThread] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creatingThread) inputRef.current?.focus();
  }, [creatingThread]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setPending(true);
    try {
      const thread = await createThread(trimmed);
      setNewTitle("");
      setCreatingThread(false);
      router.push(`/dashboard/${thread.id}`);
    } finally {
      setPending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setNewTitle("");
      setCreatingThread(false);
    }
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="flex flex-row items-center justify-between px-4 py-3">
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-widest">
            Threads
          </SidebarGroupLabel>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setCreatingThread(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              {creatingThread && (
                <form onSubmit={handleSubmit} className="px-2 pb-2">
                  <Input
                    ref={inputRef}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => { if (!newTitle.trim()) setCreatingThread(false); }}
                    placeholder="Thread name…"
                    disabled={pending}
                    className="h-8 text-sm"
                  />
                </form>
              )}
              <SidebarMenu>
                {threads.map((thread) => {
                  const isActive = pathname === `/dashboard/${thread.id}`;
                  const isTied = thread.status === "tied";
                  return (
                    <SidebarMenuItem key={thread.id}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={`/dashboard/${thread.id}`}>
                          <span className={isTied ? "line-through text-muted-foreground" : ""}>
                            {thread.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={() => signOut()}
          >
            Sign out
          </Button>
        </SidebarFooter>
      </Sidebar>
      <main className="flex flex-col flex-1 min-h-screen">{children}</main>
    </SidebarProvider>
  );
}
