"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, X, Plus } from "lucide-react";
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
  thread: { id: string; title: string; status: string; tags: string[] };
};

export function ThreadHeader({ thread }: Props) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(thread.title);
  const [tags, setTags] = useState<string[]>(thread.tags);
  const [addingTag, setAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) inputRef.current?.focus();
  }, [renaming]);

  useEffect(() => {
    if (addingTag) tagInputRef.current?.focus();
  }, [addingTag]);

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

  async function saveTags(next: string[]) {
    setTags(next);
    await updateThread(thread.id, { tags: next });
  }

  async function addTag() {
    const trimmed = tagInput.trim().toLowerCase();
    setTagInput("");
    setAddingTag(false);
    if (!trimmed || tags.includes(trimmed)) return;
    await saveTags([...tags, trimmed]);
  }

  async function removeTag(tag: string) {
    await saveTags(tags.filter((t) => t !== tag));
  }

  async function handleTieUp() {
    await updateThread(thread.id, { status: "tied" });
    router.refresh();
  }

  const isActive = thread.status === "active";

  return (
    <div className="px-6 py-4 border-b">
      <div className="flex items-center gap-3">
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

      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground rounded-full px-2.5 py-0.5"
          >
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:text-foreground text-muted-foreground">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {addingTag ? (
          <form onSubmit={(e) => { e.preventDefault(); addTag(); }}>
            <Input
              ref={tagInputRef}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onBlur={addTag}
              onKeyDown={(e) => { if (e.key === "Escape") { setTagInput(""); setAddingTag(false); } }}
              className="h-6 w-24 text-xs px-2 py-0 rounded-full"
              placeholder="tag name"
            />
          </form>
        ) : (
          <button
            onClick={() => setAddingTag(true)}
            className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
            Add tag
          </button>
        )}
      </div>
    </div>
  );
}
