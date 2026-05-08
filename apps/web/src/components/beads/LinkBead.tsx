import { ExternalLink, MoreVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { type BeadWithHistory } from "@/lib/actions/beads";

type Props = { bead: BeadWithHistory; isSelected?: boolean; onDelete?: () => void; onSelect?: () => void };

export function LinkBead({ bead, isSelected, onDelete, onSelect }: Props) {
  const content = bead.content as {
    url: string;
    label: string;
    og_title?: string;
    og_description?: string;
    og_image?: string;
    og_site_name?: string;
    favicon?: string;
  };

  const displayTitle = content.og_title || content.label;
  const domain = (() => {
    try { return new URL(content.url).hostname.replace(/^www\./, ''); } catch { return content.url; }
  })();

  return (
    <Card className={`p-0 relative${isSelected ? " ring-2 ring-blue-500" : ""}`} onClick={onSelect}>
      {onDelete && (
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.preventDefault()}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      <a
        href={content.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full hover:bg-muted/50 transition-colors"
      >
        <div className="w-28 shrink-0 relative bg-muted">
          {content.og_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={content.og_image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </div>
        <div className="flex flex-col justify-between gap-1 p-4 min-w-0 flex-1">
          <p className="font-semibold text-sm leading-snug line-clamp-2">{displayTitle}</p>

          {content.og_description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{content.og_description}</p>
          )}

          <div className="flex items-center gap-1.5 mt-1">
            {content.favicon && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={content.favicon} alt="" className="h-3.5 w-3.5 rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            )}
            <span className="text-xs text-muted-foreground">{domain}</span>
            <span className="text-xs text-muted-foreground ml-auto shrink-0">{formatTime(bead.createdAt)}</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
          </div>
        </div>
      </a>
    </Card>
  );
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}
