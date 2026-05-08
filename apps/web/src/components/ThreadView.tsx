"use client";

import { useState, useRef, useCallback } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BeadFeed } from "@/components/BeadFeed";
import { submitDump, joinBeads, type BeadWithHistory } from "@/lib/actions/beads";

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
    type: "_placeholder",
    content: {},
    supersedes: null,
    createdAt: new Date(),
    history: [],
    mergedBeads: [],
  };
}

export function ThreadView({ threadId, initialBeads }: Props) {
  const [beads, setBeads] = useState<BeadWithHistory[]>(initialBeads);
  const [dump, setDump] = useState("");
  const [pending, setPending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleJoin(idA: string, idB: string) {
    const updatedBeads = await joinBeads(idA, idB);
    setBeads(updatedBeads as BeadWithHistory[]);
  }

  const handleSubmit = useCallback(async () => {
    const text = dump.trim();
    if (!text || pending) return;

    const placeholder = makePlaceholder(threadId);
    setBeads((prev) => [...prev, placeholder]);
    setDump("");
    setPending(true);

    try {
      const updatedBeads = await submitDump(threadId, text);
      setBeads(updatedBeads as BeadWithHistory[]);
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
        <BeadFeed beads={beads} onJoin={handleJoin} />
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
