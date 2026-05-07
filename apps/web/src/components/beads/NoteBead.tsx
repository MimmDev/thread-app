import { type BeadWithHistory } from "@/lib/actions/beads";

type Props = { bead: BeadWithHistory };

export function NoteBead({ bead }: Props) {
  const content = bead.content as { title: string; content: string };
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-xs rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 font-medium">note</span>
        <span className="text-xs text-muted-foreground">{formatTime(bead.createdAt)}</span>
      </div>
      <p className="font-semibold mt-2">{content.title}</p>
      <p className="text-sm text-muted-foreground mt-1">{content.content}</p>
    </div>
  );
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
