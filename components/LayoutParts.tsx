"use client";

import { Loader2 } from "lucide-react";
import { useApiStatus } from "@/lib/use-session";

const STATUS_META = {
  ok: { label: "Operacional", dot: "bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" },
  down: { label: "Indisponível", dot: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]" },
  checking: { label: "Verificando…", dot: "bg-muted-foreground" },
} as const;

export function ApiStatusCard() {
  const meta = STATUS_META[useApiStatus()];
  return (
    <div className="p-3 rounded-xl border border-border bg-secondary/40">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Status API</div>
      <div className="flex items-center gap-2 text-xs text-foreground">
        <span className={`size-2 rounded-full ${meta.dot}`} />
        {meta.label}
      </div>
    </div>
  );
}

export function SessionLoading() {
  return (
    <div className="p-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> Verificando sessão...
    </div>
  );
}
