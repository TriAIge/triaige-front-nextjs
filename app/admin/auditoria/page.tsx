"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { AUDIT_EVENT_TYPES, type AuditEvent, type CompanySummary } from "@/lib/types";

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
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState("all");
  const [eventType, setEventType] = useState("all");
  const [correlation, setCorrelation] = useState("");
  const [correlationQuery, setCorrelationQuery] = useState("");

  useEffect(() => {
    api.clients
      .list()
      .then((rows) => setCompanies(rows.map(({ id, name, plan }) => ({ id, name, plan }))))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setCorrelationQuery(correlation.trim()), 300);
    return () => clearTimeout(timer);
  }, [correlation]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.admin
      .auditEvents({
        company_id: company === "all" ? undefined : company,
        event_type: eventType === "all" ? undefined : eventType,
        correlation_id: correlationQuery || undefined,
      })
      .then((rows) => active && setItems(rows))
      .catch((error) => toast.error(error instanceof Error ? error.message : "Falha ao carregar logs."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [company, eventType, correlationQuery]);

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
              <option key={c.id} value={c.id}>
                {c.name}
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
            {AUDIT_EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
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
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Nenhum evento encontrado.</div>
        ) : (
          items.map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-[1fr_1.2fr_1.2fr_1fr_1.6fr] gap-3 px-4 py-3 text-sm items-center border-b border-border/60"
            >
              <div className="text-muted-foreground text-xs">{fmtDate(e.at)}</div>
              <div>{e.company_name || "—"}</div>
              <div>
                {e.event}
                {e.source === "backoffice" ? (
                  <span className="ml-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">painel</span>
                ) : null}
              </div>
              <div className="font-mono text-xs truncate" title={e.correlation_id}>{e.correlation_id || "—"}</div>
              <div className="text-xs text-muted-foreground truncate" title={e.detail}>{e.detail}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
