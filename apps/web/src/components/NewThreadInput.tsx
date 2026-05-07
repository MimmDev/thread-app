"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createThread } from "@/lib/actions/threads";

export function NewThreadInput() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setPending(true);
    try {
      const thread = await createThread(trimmed);
      setTitle("");
      setOpen(false);
      router.push(`/dashboard/${thread.id}`);
    } finally {
      setPending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setTitle("");
      setOpen(false);
    }
  }

  return (
    <div className="px-2 pb-2">
      {open ? (
        <form onSubmit={handleSubmit}>
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (!title.trim()) setOpen(false); }}
            placeholder="Thread name…"
            disabled={pending}
            className="h-8 text-sm"
          />
        </form>
      ) : null}
    </div>
  );
}
