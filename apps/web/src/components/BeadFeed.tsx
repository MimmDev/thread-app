"use client";

import { useState } from "react";
import { type BeadWithHistory } from "@/lib/actions/beads";
import { NoteBead } from "@/components/beads/NoteBead";
import { TaskBead } from "@/components/beads/TaskBead";
import { LinkBead } from "@/components/beads/LinkBead";
import { Card } from "@/components/ui/card";

type Props = {
  beads: BeadWithHistory[];
  onJoin: (idA: string, idB: string) => Promise<void>;
  onTaskComplete: (beadId: string) => void;
  onDelete: (beadId: string) => void;
  selectedBeadId?: string | null;
  onSelectBead?: (bead: BeadWithHistory) => void;
};

export function BeadFeed({ beads, onJoin, onTaskComplete, onDelete, selectedBeadId, onSelectBead }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  function handleDrop(targetId: string) {
    if (draggingId && draggingId !== targetId) {
      onJoin(draggingId, targetId);
    }
    setDraggingId(null);
    setDropTargetId(null);
  }

  if (beads.length === 0) {
    return (
      <p className="text-muted-foreground text-sm px-6 py-8">
        No beads yet. Dump your thoughts below.
      </p>
    );
  }

  const visibleBeads = beads.filter((bead) => {
    if (bead.type !== "task") return true;
    const content = bead.content as { done?: boolean };
    return !content.done;
  });

  return (
    <div className="flex flex-col gap-3 px-6 py-4">
      {visibleBeads.map((bead) => {
        if (bead.type === "note") return (
          <NoteBead
            key={bead.id}
            bead={bead}
            isDragging={draggingId === bead.id}
            isDropTarget={dropTargetId === bead.id && draggingId !== bead.id}
            isSelected={selectedBeadId === bead.id}
            onDragStart={() => setDraggingId(bead.id)}
            onDragEnd={() => { setDraggingId(null); setDropTargetId(null); }}
            onDragOver={(e: React.DragEvent) => { e.preventDefault(); setDropTargetId(bead.id); }}
            onDragLeave={() => setDropTargetId(null)}
            onDrop={() => handleDrop(bead.id)}
            onDelete={() => onDelete(bead.id)}
            onSelect={() => onSelectBead?.(bead)}
          />
        );
        if (bead.type === "task") return (
          <TaskBead
            key={bead.id}
            bead={bead}
            isSelected={selectedBeadId === bead.id}
            onComplete={() => onTaskComplete(bead.id)}
            onDelete={() => onDelete(bead.id)}
            onSelect={() => onSelectBead?.(bead)}
          />
        );
        if (bead.type === "link") return (
          <LinkBead
            key={bead.id}
            bead={bead}
            isSelected={selectedBeadId === bead.id}
            onDelete={() => onDelete(bead.id)}
            onSelect={() => onSelectBead?.(bead)}
          />
        );
        if (bead.type === "_placeholder") return (
          <Card key={bead.id} className="p-4 text-sm text-muted-foreground animate-pulse">
            Processing info dump...
          </Card>
        );
        return null;
      })}
    </div>
  );
}
