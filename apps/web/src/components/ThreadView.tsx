"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { SendHorizontal, Mic, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BeadFeed } from "@/components/BeadFeed";
import { submitDump, joinBeads, deleteBead, updateBeadContent, type BeadWithHistory } from "@/lib/actions/beads";

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
    mergedFrom: [],
    createdAt: new Date(),
    mergedBeads: [],
  };
}

export function ThreadView({ threadId, initialBeads }: Props) {
  const [beads, setBeads] = useState<BeadWithHistory[]>(initialBeads);
  const [dump, setDump] = useState("");
  const [pending, setPending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [selectedBead, setSelectedBead] = useState<BeadWithHistory | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);
  // Web Speech API — swap recognitionRef for mediaRecorderRef to use Whisper instead (see /api/transcribe)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (shouldScrollRef.current && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
    shouldScrollRef.current = false;
  }, [beads]);

  async function handleJoin(idA: string, idB: string) {
    const updatedBeads = await joinBeads(idA, idB);
    setBeads(updatedBeads as BeadWithHistory[]);
  }

  const handleSubmit = useCallback(async () => {
    const text = dump.trim();
    if (!text || pending) return;

    setDump("");
    setPending(true);

    if (selectedBead) {
      const targetId = selectedBead.id;
      setSelectedBead(null);
      try {
        const updatedBeads = await updateBeadContent(targetId, text);
        setBeads(updatedBeads as BeadWithHistory[]);
      } finally {
        setPending(false);
      }
    } else {
      shouldScrollRef.current = true;
      const placeholder = makePlaceholder(threadId);
      setBeads((prev) => [...prev, placeholder]);
      try {
        const updatedBeads = await submitDump(threadId, text);
        setBeads(updatedBeads as BeadWithHistory[]);
      } catch {
        setBeads((prev) => prev.filter((b) => b.id !== placeholder.id));
      } finally {
        setPending(false);
      }
    }
  }, [dump, pending, selectedBead, threadId]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function startRecording() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          setDump((prev) => (prev ? `${prev} ${t}` : t));
        } else {
          interimText += t;
        }
      }
      setInterim(interimText);
    };

    recognition.onend = () => {
      setRecording(false);
      setInterim("");
    };

    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setRecording(false);
    setInterim("");
  }

  return (
    <>
      <div ref={feedRef} className="flex-1 overflow-y-auto min-h-0">
        <BeadFeed
          beads={beads}
          onJoin={handleJoin}
          onTaskComplete={(id) => setBeads((prev) => prev.filter((b) => b.id !== id))}
          onDelete={async (id) => {
            setBeads((prev) => prev.filter((b) => b.id !== id));
            await deleteBead(id);
          }}
          selectedBeadId={selectedBead?.id}
          onSelectBead={(bead) => setSelectedBead((prev) => prev?.id === bead.id ? null : bead)}
        />
      </div>
      <div className="border-t bg-background px-4 py-3">
        {selectedBead && (
          <div className="flex items-center gap-2 mb-2 text-xs text-blue-600 dark:text-blue-400">
            <span className="font-medium">Targeting:</span>
            <span className="flex-1 truncate">
              {(selectedBead.content as { title?: string }).title ?? selectedBead.type}
            </span>
            <button onClick={() => setSelectedBead(null)} className="hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <div className="relative flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={interim ? `${dump}${dump ? ' ' : ''}${interim}` : dump}
            onChange={(e) => setDump(e.target.value)}
            placeholder={selectedBead ? "Describe your changes..." : "Dump your thoughts..."}
            className="min-h-[80px] resize-none pr-20"
            onKeyDown={handleKeyDown}
            disabled={pending}
          />
          <div className="absolute bottom-2 right-2 flex gap-1">
            <Button
              size="icon"
              variant={recording ? "destructive" : "ghost"}
              className="h-8 w-8 shrink-0"
              onClick={recording ? stopRecording : startRecording}
              disabled={pending}
            >
              {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleSubmit}
              disabled={pending || !dump.trim()}
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
