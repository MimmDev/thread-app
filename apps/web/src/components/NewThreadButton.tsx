"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createThread } from "@/lib/actions/threads";

export function NewThreadButton() {
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
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center justify-between pl-2 pr-1 mb-1">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Threads
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={() => setCreatingThread(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {creatingThread && (
        <form onSubmit={handleSubmit}>
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
    </div>
  );
}
