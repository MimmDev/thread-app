"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateThread } from "@/lib/actions/threads";

type Props = {
  thread: { id: string; title: string; status: string };
};

export function ThreadHeader({ thread }: Props) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(thread.title);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) inputRef.current?.focus();
  }, [renaming]);

  async function submitRename() {
    const trimmed = title.trim();
    if (!trimmed || trimmed === thread.title) {
      setTitle(thread.title);
      setRenaming(false);
      return;
    }
    setPending(true);
    try {
      await updateThread(thread.id, { title: trimmed });
      setRenaming(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleTieUp() {
    await updateThread(thread.id, { status: "tied" });
    router.refresh();
  }

  const isActive = thread.status === "active";

  return (
    <div className="flex items-center gap-3 px-6 py-4 border-b">
      {renaming ? (
        <form
          className="flex-1"
          onSubmit={(e) => { e.preventDefault(); submitRename(); }}
        >
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => { if (e.key === "Escape") { setTitle(thread.title); setRenaming(false); } }}
            disabled={pending}
            className="text-2xl font-bold h-auto py-0 border-none shadow-none focus-visible:ring-0 px-0"
          />
        </form>
      ) : (
        <h1 className="flex-1 text-2xl font-bold">{title}</h1>
      )}
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "Active" : "Tied up"}
      </Badge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setRenaming(true)}>
            Rename
          </DropdownMenuItem>
          {isActive && (
            <DropdownMenuItem onSelect={handleTieUp}>
              Tie up
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
