"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchBeads, type SearchResult } from "@/lib/actions/search";

type Thread = { id: string; title: string; status: string };

function beadSnippet(type: string, content: unknown): string {
  const c = content as Record<string, string>;
  if (type === "note") {
    const text = (c.content ?? "").replace(/[#*`_~[\]]/g, "").replace(/\n+/g, " ").trim();
    return text.length > 80 ? text.slice(0, 80) + "…" : text;
  }
  if (type === "task") return c.title ?? "";
  if (type === "link") {
    const domain = (() => { try { return new URL(c.url).hostname.replace(/^www\./, ""); } catch { return c.url; } })();
    return `${c.og_title || c.label} · ${domain}`;
  }
  return "";
}

const badgeClass: Record<string, string> = {
  note: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  task: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  link: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  thread: "bg-muted text-muted-foreground",
};

export function SpotlightSearch({ threads }: { threads: Thread[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function handleOpen() { setOpen(true); }
    document.addEventListener("keydown", handleKey);
    document.addEventListener("spotlight:open", handleOpen);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("spotlight:open", handleOpen);
    };
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await searchBeads(query.trim());
        setResults(r);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, [query]);

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) {
      setQuery("");
      setResults(null);
    }
  }

  function select(threadId: string) {
    handleOpenChange(false);
    router.push(`/dashboard/${threadId}`);
  }

  const active = threads.filter((t) => t.status === "active");
  const tied = threads.filter((t) => t.status === "tied");
  const isSearching = query.trim().length >= 2;

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Search threads..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isSearching ? (
            loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Searching…</div>
            ) : results && results.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : (
              <CommandGroup heading="Results">
                {(results ?? []).map((r) => (
                  <CommandItem
                    key={r.id}
                    value={r.id}
                    onSelect={() => select(r.threadId)}
                    className="flex flex-col items-start gap-0.5 py-2"
                  >
                    <span className="font-medium text-sm">{r.threadTitle}</span>
                    {r.type !== "thread" && (
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs rounded-full px-1.5 py-0 font-medium ${badgeClass[r.type] ?? ""}`}>
                          {r.type}
                        </span>
                        <span className="text-xs text-muted-foreground truncate max-w-64">
                          {beadSnippet(r.type, r.content)}
                        </span>
                      </div>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )
          ) : (
            <>
              {active.length > 0 && (
                <CommandGroup heading="Active">
                  {active.map((t) => (
                    <CommandItem key={t.id} value={t.id} onSelect={() => select(t.id)}>
                      {t.title}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {tied.length > 0 && (
                <CommandGroup heading="Tied">
                  {tied.map((t) => (
                    <CommandItem key={t.id} value={t.id} onSelect={() => select(t.id)}>
                      {t.title}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {threads.length === 0 && <CommandEmpty>No threads yet.</CommandEmpty>}
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
