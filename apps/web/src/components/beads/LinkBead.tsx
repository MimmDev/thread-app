import { type BeadWithHistory } from "@/lib/actions/beads";

type Props = { bead: BeadWithHistory };

export function LinkBead({ bead }: Props) {
  const content = bead.content as { url: string; label: string };
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-xs rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 font-medium">link</span>
        <span className="text-xs text-muted-foreground">{formatTime(bead.createdAt)}</span>
      </div>
      <a
        href={content.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-500 hover:underline mt-2 block"
      >
        {content.label}
      </a>
    </div>
  );
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
