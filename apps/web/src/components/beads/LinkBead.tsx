import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { type BeadWithHistory } from "@/lib/actions/beads";

type Props = { bead: BeadWithHistory };

export function LinkBead({ bead }: Props) {
  const content = bead.content as { url: string; label: string };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 font-medium">
          link
        </span>
        <span className="text-xs text-muted-foreground">{formatTime(bead.createdAt)}</span>
      </div>

      <a
        href={content.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 mt-1 text-sm text-blue-500 hover:underline"
      >
        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        {content.label}
      </a>
    </Card>
  );
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}
