"use client";

import { useState, useRef, useCallback } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BeadFeed } from "@/components/BeadFeed";
import { submitDump, type BeadWithHistory } from "@/lib/actions/beads";

type Props = {
  threadId: string;
  initialBeads: BeadWithHistory[];
};

type PlaceholderBead = BeadWithHistory & { _placeholder: true };

function makePlaceholder(threadId: string): PlaceholderBead {
  return {
    _placeholder: true,
    id: `placeholder-${Date.now()}`,
    threadId,
    type: "note",
    content: { title: "Processing…", content: "" },
    supersedes: null,
    createdAt: new Date(),
    history: [],
  };
}

export function ThreadView({ threadId, initialBeads }: Props) {
  const [beads, setBeads] = useState<BeadWithHistory[]>(initialBeads);
  const [dump, setDump] = useState("");
  const [pending, setPending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(async () => {
    const text = dump.trim();
    if (!text || pending) return;

    const placeholder = makePlaceholder(threadId);
    setBeads((prev) => [...prev, placeholder]);
    setDump("");
    setPending(true);

    try {
      const newBeads = await submitDump(threadId, text);
      setBeads((prev) =>
        prev
          .filter((b) => b.id !== placeholder.id)
          .concat(newBeads.map((b) => ({ ...b, history: [] })) as BeadWithHistory[])
      );
    } catch {
      setBeads((prev) => prev.filter((b) => b.id !== placeholder.id));
    } finally {
      setPending(false);
    }
  }, [dump, pending, threadId]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <BeadFeed beads={beads} />
      </div>
      <div className="border-t bg-background px-4 py-3">
        <div className="relative flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={dump}
            onChange={(e) => setDump(e.target.value)}
            placeholder="Dump your thoughts..."
            className="min-h-[80px] resize-none pr-12"
            onKeyDown={handleKeyDown}
            disabled={pending}
          />
          <Button
            size="icon"
            className="absolute bottom-2 right-2 h-8 w-8 shrink-0"
            onClick={handleSubmit}
            disabled={pending || !dump.trim()}
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
