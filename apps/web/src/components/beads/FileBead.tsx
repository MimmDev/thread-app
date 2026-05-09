"use client";

import { useState, useEffect } from "react";
import { FileText, FileImage, FileVideo, FileAudio, File, MoreVertical, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getFileDownloadUrl, getFileDisplayUrl } from "@/lib/actions/beads";
import { type BeadWithHistory } from "@/lib/actions/beads";

type Props = {
  bead: BeadWithHistory;
  isSelected?: boolean;
  onDelete?: () => void;
  onSelect?: () => void;
};

function FileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  if (mimeType.startsWith("image/")) return <FileImage className={className} />;
  if (mimeType.startsWith("video/")) return <FileVideo className={className} />;
  if (mimeType.startsWith("audio/")) return <FileAudio className={className} />;
  if (mimeType.includes("pdf") || mimeType.includes("text")) return <FileText className={className} />;
  return <File className={className} />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileBead({ bead, isSelected, onDelete, onSelect }: Props) {
  const content = bead.content as { key: string; filename: string; size: number; mimeType: string };
  const [downloading, setDownloading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const isImage = content.mimeType.startsWith("image/");

  useEffect(() => {
    if (!isImage) return;
    getFileDisplayUrl(bead.id).then(setImageUrl).catch(() => {});
  }, [bead.id, isImage]);

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      const url = await getFileDownloadUrl(bead.id);
      const a = document.createElement("a");
      a.href = url;
      a.download = content.filename;
      a.click();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Card
      className={`p-4 transition-all ${isSelected ? "ring-2 ring-blue-500" : ""}`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 px-2 py-0.5 font-medium">
          file
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

      <div className="flex items-center gap-3 mt-2">
        <FileIcon mimeType={content.mimeType} className="h-8 w-8 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{content.filename}</p>
          <p className="text-xs text-muted-foreground">{formatBytes(content.size)}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); handleDownload(); }}
          disabled={downloading}
          className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      {isImage && imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={content.filename}
          className="mt-2 rounded-md object-contain max-h-80 self-start"
        />
      ) : null}
    </Card>
  );
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}
