"use client";

import { useEffect, useState } from "react";
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

type Thread = { id: string; title: string; status: string };

export function SpotlightSearch({ threads }: { threads: Thread[] }) {
  const [open, setOpen] = useState(false);
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

  function select(id: string) {
    setOpen(false);
    router.push(`/dashboard/${id}`);
  }

  const active = threads.filter((t) => t.status === "active");
  const tied = threads.filter((t) => t.status === "tied");

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command>
        <CommandInput placeholder="Search threads..." />
        <CommandList>
          <CommandEmpty>No threads found.</CommandEmpty>
          {active.length > 0 && (
            <CommandGroup heading="Active">
              {active.map((t) => (
                <CommandItem
                  key={t.id}
                  value={t.title}
                  onSelect={() => select(t.id)}
                >
                  {t.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {tied.length > 0 && (
            <CommandGroup heading="Tied">
              {tied.map((t) => (
                <CommandItem
                  key={t.id}
                  value={t.title}
                  onSelect={() => select(t.id)}
                >
                  {t.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
