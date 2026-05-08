"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { GitMerge, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { type BeadWithHistory } from "@/lib/actions/beads";

type Props = {
  bead: BeadWithHistory;
  isDragging?: boolean;
  isDropTarget?: boolean;
  isSelected?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: () => void;
  onDelete?: () => void;
  onSelect?: () => void;
};

export function NoteBead({
  bead,
  isDragging,
  isDropTarget,
  isSelected,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onDelete,
  onSelect,
}: Props) {
  const [showMerged, setShowMerged] = useState(false);
  const content = bead.content as { title: string; content: string };
  const mergedBeads = bead.mergedBeads ?? [];

  return (
    <Card
      className={cn(
        "p-4 transition-all cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40",
        isDropTarget && "ring-2 ring-primary",
        isSelected && "ring-2 ring-blue-500"
      )}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-2 py-0.5 font-medium">
          note
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{formatTime(bead.createdAt)}</span>
          {onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-destructive" onClick={onDelete}>Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <p className="font-semibold mt-1">{content.title}</p>
      <div className="prose prose-sm dark:prose-invert mt-1 max-w-none">
        <ReactMarkdown>{content.content}</ReactMarkdown>
      </div>

      {mergedBeads.length > 0 && (
        <div className="mt-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-7"
            onClick={() => setShowMerged((v) => !v)}
          >
            <GitMerge className="h-3.5 w-3.5" />
            Merged from {mergedBeads.length} notes
          </Button>

          {showMerged && (
            <div className="mt-3 flex flex-col gap-1 border-l-2 border-muted pl-4">
              {mergedBeads.map((src: typeof bead.mergedBeads[number]) => {
                const srcContent = src.content as { title: string; content: string };
                return (
                  <p key={src.id} className="text-xs text-muted-foreground">
                    {srcContent.title} &mdash; {formatTime(src.createdAt)}
                  </p>
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
