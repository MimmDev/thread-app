"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { markTaskDone } from "@/lib/actions/beads";

type Props = {
  beadId: string;
  title: string;
  dueAt: string | null;
  threadId: string;
  threadTitle: string;
};

export function DashboardTaskRow({ beadId, title, dueAt, threadId, threadTitle }: Props) {
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleCheck() {
    if (done || pending) return;
    setDone(true);
    setPending(true);
    try {
      await markTaskDone(beadId);
    } catch {
      setDone(false);
    } finally {
      setPending(false);
    }
  }

  if (done) return null;

  return (
    <Card className="flex items-center gap-3 px-4 py-3">
      <Checkbox
        checked={false}
        onCheckedChange={handleCheck}
        disabled={pending}
        className="shrink-0"
      />
      <span className="text-sm flex-1">{title}</span>
      {dueAt && (
        <span className="text-xs text-muted-foreground shrink-0">
          due {new Date(dueAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </span>
      )}
      <Link
        href={`/dashboard/${threadId}`}
        className="text-xs text-muted-foreground hover:text-foreground shrink-0 underline underline-offset-2"
      >
        {threadTitle}
      </Link>
    </Card>
  );
}
