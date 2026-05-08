"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { History, GitMerge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type BeadWithHistory } from "@/lib/actions/beads";

type Props = {
  bead: BeadWithHistory;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: () => void;
};

export function NoteBead({
  bead,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: Props) {
  const [showHistory, setShowHistory] = useState(false);
  const [showMerged, setShowMerged] = useState(false);
  const content = bead.content as { title: string; content: string };
  const historyCount = bead.history.length;
  const mergedBeads = bead.mergedBeads ?? [];

  return (
    <Card
      className={cn(
        "p-4 transition-all cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40",
        isDropTarget && "ring-2 ring-primary"
      )}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-2 py-0.5 font-medium">
          note
        </span>
        <span className="text-xs text-muted-foreground">{formatTime(bead.createdAt)}</span>
      </div>

      <p className="font-semibold mt-1">{content.title}</p>
      <div className="prose prose-sm dark:prose-invert mt-1 max-w-none">
        <ReactMarkdown>{content.content}</ReactMarkdown>
      </div>

      {(historyCount > 0 || mergedBeads.length > 0) && (
        <div className="mt-3">
          <div className="flex gap-2">
            {historyCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-7"
                onClick={() => setShowHistory((v) => !v)}
              >
                <History className="h-3.5 w-3.5" />
                {historyCount} previous version{historyCount > 1 ? "s" : ""}
              </Button>
            )}
            {mergedBeads.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-7"
                onClick={() => setShowMerged((v) => !v)}
              >
                <GitMerge className="h-3.5 w-3.5" />
                Merged from {mergedBeads.length} notes
              </Button>
            )}
          </div>

          {showHistory && (
            <div className="mt-3 flex flex-col gap-1 border-l-2 border-muted pl-4">
              {bead.history.map((prev) => {
                const prevContent = prev.content as { title: string; content: string };
                return (
                  <p key={prev.id} className="text-xs text-muted-foreground">
                    {prevContent.title} &mdash; {formatTime(prev.createdAt)}
                  </p>
                );
              })}
            </div>
          )}

          {showMerged && (
            <div className="mt-3 flex flex-col gap-2 border-l-2 border-muted pl-4">
              {mergedBeads.map((src: typeof bead.history[number]) => {
                const srcContent = src.content as { title: string; content: string };
                return (
                  <div key={src.id} className="opacity-60">
                    <p className="text-xs text-muted-foreground mb-1">{formatTime(src.createdAt)}</p>
                    <p className="text-sm font-medium">{srcContent.title}</p>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{srcContent.content}</ReactMarkdown>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}
