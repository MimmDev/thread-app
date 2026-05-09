"use client";

import { useState } from "react";
import Link from "next/link";
import { Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Thread = {
  id: string;
  title: string;
  status: string;
  tags: string[];
  createdAt: Date;
};

const STATUSES = ["active", "tied"] as const;
type Status = typeof STATUSES[number];

export function ThreadsClient({ threads }: { threads: Thread[] }) {
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [activeStatuses, setActiveStatuses] = useState<Set<Status>>(new Set());

  const allTags = Array.from(new Set(threads.flatMap((t) => t.tags))).sort();

  function toggleTag(tag: string) {
    setActiveTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  }

  function toggleStatus(status: Status) {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      next.has(status) ? next.delete(status) : next.add(status);
      return next;
    });
  }

  const filtered = threads.filter((t) => {
    if (activeStatuses.size > 0 && !activeStatuses.has(t.status as Status)) return false;
    if (activeTags.size > 0 && ![...activeTags].every((tag) => t.tags.includes(tag))) return false;
    return true;
  });

  const filterCount = activeTags.size + activeStatuses.size;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Threads</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={filterCount > 0 ? "secondary" : "outline"} size="sm" className="gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              Filter
              {filterCount > 0 && (
                <span className="rounded-full bg-primary text-primary-foreground text-xs px-1.5 leading-5">
                  {filterCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            {STATUSES.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={activeStatuses.has(status)}
                onCheckedChange={() => toggleStatus(status)}
                onSelect={(e) => e.preventDefault()}
              >
                {status === "active" ? "Active" : "Tied up"}
              </DropdownMenuCheckboxItem>
            ))}
            {allTags.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Tags</DropdownMenuLabel>
                {allTags.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag}
                    checked={activeTags.has(tag)}
                    onCheckedChange={() => toggleTag(tag)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {tag}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">No threads match the selected filters.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((thread) => <ThreadCard key={thread.id} thread={thread} />)}
        </div>
      )}
    </div>
  );
}

function ThreadCard({ thread }: { thread: Thread }) {
  const isActive = thread.status === "active";

  return (
    <Link href={`/dashboard/${thread.id}`}>
      <Card className="px-4 py-3 h-20 flex flex-col justify-between hover:bg-muted/50 transition-colors cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <span className={`font-medium leading-snug line-clamp-1 ${!isActive ? "line-through text-muted-foreground" : ""}`}>
            {thread.title}
          </span>
          <Badge variant={isActive ? "default" : "secondary"} className="shrink-0 text-xs">
            {isActive ? "Active" : "Tied up"}
          </Badge>
        </div>
        <div className="flex items-end justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {new Date(thread.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
          {thread.tags.length > 0 && (
            <div className="flex flex-wrap justify-end gap-1">
              {thread.tags.map((tag) => (
                <span key={tag} className="text-xs bg-secondary text-secondary-foreground rounded-full px-2.5 py-0.5">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
