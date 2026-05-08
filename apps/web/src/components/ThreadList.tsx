"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteThread } from "@/lib/actions/threads";

type Thread = {
  id: string;
  title: string;
  status: string;
};

type Props = {
  threads: Thread[];
};

export function ThreadList({ threads }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    setDeleting(true);
    try {
      await deleteThread(pendingDeleteId);
      if (pathname === `/dashboard/${pendingDeleteId}`) router.push("/dashboard");
    } finally {
      setDeleting(false);
      setPendingDeleteId(null);
    }
  }

  const pendingThread = threads.find((t) => t.id === pendingDeleteId);

  return (
    <>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontal className="h-4 w-4" />
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() => setPendingDeleteId(thread.id)}
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

      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete thread?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{pendingThread?.title}&rdquo; and all its beads will be permanently deleted.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              variant="destructive"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
