"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Inbox, Loader2, RefreshCw, Search, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { CaseChannel, CaseStatus, LegalCase } from "@/lib/types";
import { CASE_CHANNELS, CASE_STATUSES } from "@/lib/types";

const STATUS_META: Record<CaseStatus, { label: string; cls: string }> = {
  recebido: { label: "Recebido", cls: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  em_validacao: { label: "Em validação", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  em_processamento: { label: "Em processamento", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  relatorio_gerado: { label: "Relatório gerado", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  enviado: { label: "Enviado", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  falha: { label: "Falha", cls: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  return (
    date.toLocaleDateString("pt-BR") +
    " " +
    date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

export default function PortalCasesPage() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CaseStatus>("all");
  const [channelFilter, setChannelFilter] = useState<"all" | CaseChannel>("all");

  const loadData = useCallback(async (notify = false) => {
    setLoading(true);
    try {
      const rows = await api.portal.cases();
      setCases(rows);
      if (notify) toast.success("Dados atualizados");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao carregar casos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = useMemo(
    () =>
      cases.filter((c) => {
        if (statusFilter !== "all" && c.status !== statusFilter) return false;
        if (channelFilter !== "all" && c.channel !== channelFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          if (!c.case_code.toLowerCase().includes(q)) return false;
        }
        return true;
      }),
    [cases, statusFilter, channelFilter, search],
  );

  const kpis = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      recebidosHoje: cases.filter((c) => new Date(c.submitted_at) >= today).length,
      emProc: cases.filter((c) => c.status === "em_processamento" || c.status === "em_validacao").length,
      falhas: cases.filter((c) => c.status === "falha").length,
    };
  }, [cases]);

  return (
    <div className="p-4 md:p-8 max-w-[1360px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Operação</span>
          <h1 className="font-display text-2xl md:text-3xl mt-1">
            Meus <span className="italic text-brand">Casos</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe em tempo real cada caso enviado à triAIge e o status do processamento.
          </p>
        </div>
        <button
          onClick={() => void loadData(true)}
          disabled={loading}
          className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-border text-sm hover:bg-secondary transition disabled:opacity-60"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Kpi icon={<Inbox className="size-5" />} label="Recebidos hoje" value={kpis.recebidosHoje} accent="text-sky-300" sub="Últimas 24h" />
        <Kpi icon={<Settings2 className="size-5" />} label="Em processamento" value={kpis.emProc} accent="text-amber-300" sub="Aguardando etapas de IA" />
        <Kpi icon={<AlertTriangle className="size-5" />} label="Falhas de envio" value={kpis.falhas} accent="text-rose-300" sub="Relatório não entregue" />
      </div>

      <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-3 mb-4 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 items-end">
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Buscar caso</span>
          <div className="mt-1 flex items-center gap-2 h-10 px-3 rounded-lg bg-secondary/60 border border-border focus-within:border-brand/60">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ID do caso ou protocolo"
              className="w-full bg-transparent outline-none text-sm"
            />
          </div>
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | CaseStatus)}
            className="mt-1 h-10 px-3 rounded-lg bg-secondary/60 border border-border text-sm outline-none focus:border-brand/60 w-full"
          >
            <option value="all">Todos</option>
            {CASE_STATUSES.map((k) => (
              <option key={k} value={k}>
                {STATUS_META[k].label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Canal</span>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as "all" | CaseChannel)}
            className="mt-1 h-10 px-3 rounded-lg bg-secondary/60 border border-border text-sm outline-none focus:border-brand/60 w-full"
          >
            <option value="all">Todos</option>
            {CASE_CHANNELS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden">
        <div className="grid grid-cols-[1.2fr_1.3fr_1.2fr_0.8fr_1.2fr] gap-3 px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border bg-secondary/30">
          <div>Caso</div>
          <div>Data de envio</div>
          <div>Status</div>
          <div>Canal</div>
          <div>Última atualização</div>
        </div>
        {loading ? (
          <div className="p-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando casos...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Nenhum caso encontrado.</div>
        ) : (
          filtered.map((c) => {
            const meta = STATUS_META[c.status];
            return (
              <Link
                key={c.id}
                href={`/portal/cases/${c.id}`}
                className="grid grid-cols-[1.2fr_1.3fr_1.2fr_0.8fr_1.2fr] gap-3 px-4 py-3 text-sm items-center border-b border-border/60 hover:bg-secondary/40 transition"
              >
                <div className="font-mono text-xs text-foreground">{c.case_code}</div>
                <div className="text-muted-foreground">{fmtDate(c.submitted_at)}</div>
                <div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] ${meta.cls}`}>{meta.label}</span>
                </div>
                <div className="text-muted-foreground">{c.channel}</div>
                <div className="text-muted-foreground">{fmtDate(c.updated_at)}</div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  accent,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-4 flex items-center gap-4">
      <div className={`size-11 rounded-lg border border-border bg-secondary/60 flex items-center justify-center ${accent}`}>{icon}</div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
        <div className={`text-2xl font-display mt-0.5 ${accent}`}>{value}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
      </div>
    </div>
  );
}
