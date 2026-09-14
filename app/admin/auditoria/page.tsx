"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { AuditEvent } from "@/lib/mock-data";

function fmtDate(d: string) {
  const date = new Date(d);
  return (
    date.toLocaleDateString("pt-BR") +
    " " +
    date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

export default function AuditoriaPage() {
  const [items, setItems] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState("all");
  const [eventType, setEventType] = useState("all");
  const [correlation, setCorrelation] = useState("");

  useEffect(() => {
    api.admin
      .auditEvents()
      .then(setItems)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Falha ao carregar logs."))
      .finally(() => setLoading(false));
  }, []);

  const companies = useMemo(
    () => Array.from(new Set(items.map((e) => e.company_name))).sort(),
    [items],
  );

  const filtered = useMemo(() => {
    return items.filter((e) => {
      if (company !== "all" && e.company_name !== company) return false;
      if (eventType !== "all") {
        const q = eventType.toLowerCase();
        if (!e.event.toLowerCase().includes(q)) return false;
      }
      if (correlation && !e.correlation_id.toLowerCase().includes(correlation.toLowerCase())) return false;
      return true;
    });
  }, [items, company, eventType, correlation]);

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Plataforma</span>
        <h1 className="font-display text-2xl md:text-3xl mt-1">
          Logs &amp; <span className="italic text-brand">Auditoria</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Trilha de eventos de todos os escritórios, para investigação técnica e conformidade.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-3 mb-4 grid grid-cols-1 md:grid-cols-3 gap-2">
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Escritório</span>
          <select
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="mt-1 h-10 w-full px-3 rounded-lg bg-secondary/60 border border-border text-sm outline-none focus:border-brand/60"
          >
            <option value="all">Todos</option>
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Tipo de evento</span>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="mt-1 h-10 w-full px-3 rounded-lg bg-secondary/60 border border-border text-sm outline-none focus:border-brand/60"
          >
            <option value="all">Todos</option>
            <option value="Recebimento">Recebimento</option>
            <option value="Falha">Falha</option>
            <option value="entregue">Entrega</option>
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Correlation ID</span>
          <input
            value={correlation}
            onChange={(e) => setCorrelation(e.target.value)}
            placeholder="c-8f21a"
            className="mt-1 h-10 w-full px-3 rounded-lg bg-secondary/60 border border-border text-sm outline-none focus:border-brand/60"
          />
        </label>
      </div>

      <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_1.2fr_1.2fr_1fr_1.6fr] gap-3 px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border bg-secondary/30">
          <div>Data</div>
          <div>Escritório</div>
          <div>Evento</div>
          <div>Correlation ID</div>
          <div>Detalhe técnico</div>
        </div>
        {loading ? (
          <div className="p-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {api.useMockData
              ? "Nenhum evento encontrado."
              : "Sem API de auditoria ainda. Ative NEXT_PUBLIC_USE_MOCK_DATA=true para ver o mock."}
          </div>
        ) : (
          filtered.map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-[1fr_1.2fr_1.2fr_1fr_1.6fr] gap-3 px-4 py-3 text-sm items-center border-b border-border/60"
            >
              <div className="text-muted-foreground text-xs">{fmtDate(e.at)}</div>
              <div>{e.company_name}</div>
              <div>{e.event}</div>
              <div className="font-mono text-xs">{e.correlation_id}</div>
              <div className="font-mono text-xs text-muted-foreground truncate">{e.detail}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
