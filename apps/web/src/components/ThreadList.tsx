"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Trash2 } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteThread } from "@/lib/actions/threads";

type Thread = {
  id: string;
  title: string;
  status: string;
};

type Props = {
  threads: Thread[];
  activeThreadId?: string;
};

export function ThreadList({ threads, activeThreadId }: Props) {
  const router = useRouter();

  async function handleDelete(threadId: string) {
    await deleteThread(threadId);
    if (activeThreadId === threadId) router.push("/dashboard");
  }

  return (
    <SidebarMenu>
      {threads.map((thread) => {
        const isActive = thread.id === activeThreadId;
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal className="h-4 w-4" />
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => handleDelete(thread.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
