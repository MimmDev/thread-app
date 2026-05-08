"use client";

import { useState } from "react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { markTaskDone, markTaskUndone } from "@/lib/actions/beads";

type Props = {
  bead: { id: string; content: unknown; createdAt: Date };
  thread?: { id: string; title: string };
};

export function TaskBead({ bead, thread }: Props) {
  const content = bead.content as {
    title: string;
    due_at: string | null;
    done: boolean;
    url?: string;
  };
  const [done, setDone] = useState(content.done ?? false);
  const [pending, setPending] = useState(false);
  const [fading, setFading] = useState(false);

  async function handleCheck() {
    if (pending) return;
    setPending(true);
    if (!done) {
      setFading(true);
      setDone(true);
      await new Promise((r) => setTimeout(r, 500));
      try {
        await markTaskDone(bead.id);
      } catch {
        setDone(false);
        setFading(false);
      }
    } else {
      setDone(false);
      try {
        await markTaskUndone(bead.id);
      } catch {
        setDone(true);
      }
    }
    setPending(false);
  }

  return (
    <Card className={`relative p-4 transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}>
      {!done && content.due_at && isPastDue(content.due_at) && (
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-destructive" />
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2 py-0.5 font-medium">
          task
        </span>
        <div className="flex items-center gap-2">
          {thread && (
            <Link
              href={`/dashboard/${thread.id}`}
              className="text-xs text-muted-foreground hover:underline"
            >
              {thread.title}
            </Link>
          )}
          <span className="text-xs text-muted-foreground">
            {formatTime(bead.createdAt)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-0">
        <Checkbox
          checked={done}
          onCheckedChange={handleCheck}
          disabled={pending}
          className="mt-0.5"
        />
        <span className={`text-sm flex-1 ${done ? "line-through text-muted-foreground" : ""}`}>
          {content.title}
          {content.url && (
            <a
              href={content.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-blue-500 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              ({(() => { try { return new URL(content.url).hostname.replace(/^www\./, ''); } catch { return content.url; } })()})
            </a>
          )}
        </span>
        {content.due_at && (
          <span className={`text-xs shrink-0 ${!done && isPastDue(content.due_at) ? "text-destructive font-medium" : "text-muted-foreground"}`}>
            {!done && isPastDue(content.due_at) ? "overdue " : "due "}{formatDue(content.due_at)}
          </span>
        )}
      </div>
    </Card>
  );
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function isPastDue(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(iso) < today;
}

function formatDue(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
