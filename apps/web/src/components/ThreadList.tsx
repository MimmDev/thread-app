"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { MoreHorizontal, Trash2, Pencil, Anchor } from "lucide-react";
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
  DropdownMenuSeparator,
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
import { Input } from "@/components/ui/input";
import { deleteThread, updateThread } from "@/lib/actions/threads";

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
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus();
  }, [renamingId]);

  function startRename(thread: Thread) {
    setRenameValue(thread.title);
    setRenamingId(thread.id);
  }

  async function submitRename() {
    if (!renamingId) return;
    const trimmed = renameValue.trim();
    if (trimmed) await updateThread(renamingId, { title: trimmed });
    setRenamingId(null);
  }

  async function handleTieUp(id: string) {
    await updateThread(id, { status: "tied" });
    router.refresh();
  }

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
          const isCurrentPage = pathname === `/dashboard/${thread.id}`;
          const isTied = thread.status === "tied";
          return (
            <SidebarMenuItem key={thread.id}>
              {renamingId === thread.id ? (
                <div className="px-2 py-1 flex-1">
                  <Input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={submitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitRename();
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="h-7 text-sm"
                  />
                </div>
              ) : (
                <SidebarMenuButton asChild isActive={isCurrentPage}>
                  <Link href={`/dashboard/${thread.id}`}>
                    <span className={isTied ? "line-through text-muted-foreground" : ""}>
                      {thread.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontal className="h-4 w-4" />
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start">
                  <DropdownMenuItem onSelect={() => startRename(thread)}>
                    <Pencil className="h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  {!isTied && (
                    <DropdownMenuItem onSelect={() => handleTieUp(thread.id)}>
                      <Anchor className="h-4 w-4" />
                      Tie up
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
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
