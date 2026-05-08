"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SpotlightTrigger() {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => document.dispatchEvent(new CustomEvent("spotlight:open"))}
    >
      <Search className="h-4 w-4" />
    </Button>
  );
}
