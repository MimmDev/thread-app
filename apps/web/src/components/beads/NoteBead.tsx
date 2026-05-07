"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type BeadWithHistory } from "@/lib/actions/beads";

type Props = { bead: BeadWithHistory };

export function NoteBead({ bead }: Props) {
  const [showHistory, setShowHistory] = useState(false);
  const content = bead.content as { title: string; content: string };
  const historyCount = bead.history.length;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-2 py-0.5 font-medium">
          note
        </span>
        <span className="text-xs text-muted-foreground">{formatTime(bead.createdAt)}</span>
      </div>

      <p className="font-semibold mt-3">{content.title}</p>
      <div className="prose prose-sm dark:prose-invert mt-1 max-w-none">
        <ReactMarkdown>{content.content}</ReactMarkdown>
      </div>

      {historyCount > 0 && (
        <div className="mt-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-7"
            onClick={() => setShowHistory((v) => !v)}
          >
            <History className="h-3.5 w-3.5" />
            {historyCount} previous version{historyCount > 1 ? "s" : ""}
          </Button>

          {showHistory && (
            <div className="mt-3 flex flex-col gap-2 border-l-2 border-muted pl-4">
              {bead.history.map((prev) => {
                const prevContent = prev.content as { title: string; content: string };
                return (
                  <div key={prev.id} className="opacity-60">
                    <p className="text-xs text-muted-foreground mb-1">{formatTime(prev.createdAt)}</p>
                    <p className="text-sm font-medium">{prevContent.title}</p>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{prevContent.content}</ReactMarkdown>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
