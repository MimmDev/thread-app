"use client";

import { useState, useRef, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { updateThread } from "@/lib/actions/threads";

type Props = {
  thread: { id: string; title: string; status: string; tags: string[] };
};

export function ThreadHeader({ thread }: Props) {
  const [tags, setTags] = useState<string[]>(thread.tags);
  const [addingTag, setAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingTag) tagInputRef.current?.focus();
  }, [addingTag]);

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

  const isActive = thread.status === "active";

  return (
    <div className="px-6 py-4 border-b">
      <div className="flex items-center gap-3">
        <h1 className="flex-1 text-2xl font-bold">{thread.title}</h1>
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Tied up"}
        </Badge>
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
