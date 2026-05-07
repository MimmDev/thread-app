"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { type BeadWithHistory } from "@/lib/actions/beads";
import { markTaskDone } from "@/lib/actions/beads";

type Props = { bead: BeadWithHistory };

export function TaskBead({ bead }: Props) {
  const content = bead.content as { title: string; due_at: string | null; done: boolean };
  const [done, setDone] = useState(content.done);
  const [pending, setPending] = useState(false);

  async function handleCheck() {
    if (done || pending) return;
    setDone(true); // optimistic
    setPending(true);
    try {
      await markTaskDone(bead.id);
    } catch {
      setDone(false); // revert on error
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2 py-0.5 font-medium">
          task
        </span>
        <span className="text-xs text-muted-foreground">{formatTime(bead.createdAt)}</span>
      </div>

      <div className="flex items-center gap-3 mt-3">
        <Checkbox
          checked={done}
          onCheckedChange={handleCheck}
          disabled={done || pending}
          className="mt-0.5"
        />
        <span className={`text-sm flex-1 ${done ? "line-through text-muted-foreground" : ""}`}>
          {content.title}
        </span>
        {content.due_at && (
          <span className="text-xs text-muted-foreground shrink-0">
            due {formatDue(content.due_at)}
          </span>
        )}
      </div>
    </div>
  );
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDue(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { weekday: "short" });
}
