import { type BeadWithHistory } from "@/lib/actions/beads";

type Props = { bead: BeadWithHistory };

export function TaskBead({ bead }: Props) {
  const content = bead.content as { title: string; due_at: string | null; done: boolean };
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-xs rounded-full bg-green-100 text-green-700 px-2 py-0.5 font-medium">task</span>
        <span className="text-xs text-muted-foreground">{formatTime(bead.createdAt)}</span>
      </div>
      <p className={`text-sm mt-2 ${content.done ? "line-through text-muted-foreground" : ""}`}>
        {content.title}
      </p>
    </div>
  );
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
