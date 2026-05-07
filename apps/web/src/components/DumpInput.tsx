"use client";

import { useRef } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  threadId: string;
};

export function DumpInput({ threadId: _threadId }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      // submit wired in next task
    }
  }

  return (
    <div className="border-t bg-background px-4 py-3">
      <div className="relative flex items-end gap-2">
        <Textarea
          ref={ref}
          placeholder="Dump your thoughts..."
          className="min-h-[80px] resize-none pr-12"
          onKeyDown={handleKeyDown}
        />
        <Button
          size="icon"
          className="absolute bottom-2 right-2 h-8 w-8 shrink-0"
          type="submit"
        >
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
