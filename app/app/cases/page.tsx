"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Inbox,
  Loader2,
  RefreshCw,
  Search,
  Settings2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { buildTimeline } from "@/lib/pipeline";
import type { CaseStatus, CompanySummary, LegalCase } from "@/lib/types";
import { CASE_STATUSES, SESSION_STATUS_LABELS } from "@/lib/types";

const STATUS_META: Record<CaseStatus, { label: string; cls: string }> = {
  recebido: { label: "Recebido", cls: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
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

export default function CasesPage() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CaseStatus>("all");
  const [companyFilter, setCompanyFilter] = useState<"all" | string>("all");
  const [areaFilter, setAreaFilter] = useState<"all" | string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadData = useCallback(async (notify = false) => {
    setLoading(true);
    try {
      const [caseRows, clientRows] = await Promise.all([api.cases.list(), api.clients.list()]);
      setCases(caseRows);
      setCompanies(clientRows.map(({ id, name, plan }) => ({ id, name, plan })));
      setSelectedId((current) => current ?? caseRows[0]?.id ?? null);
      if (notify) toast.success("Dados atualizados");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const areas = useMemo(
    () => [...new Set(cases.map((c) => c.area).filter((a): a is string => Boolean(a)))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [cases],
  );

  const filtered = useMemo(
    () =>
      cases.filter((c) => {
        if (statusFilter !== "all" && c.status !== statusFilter) return false;
        if (companyFilter !== "all" && c.company_id !== companyFilter) return false;
        if (areaFilter !== "all" && c.area !== areaFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          const haystack = [c.protocol, c.title, c.company?.name, c.correlation_id].filter(Boolean).join(" ").toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      }),
    [cases, statusFilter, companyFilter, areaFilter, search],
  );

  const selected = filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null;

  const kpis = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeOffices = new Set(cases.map((c) => c.company_id)).size;
    return {
      recebidosHoje: cases.filter((c) => new Date(c.submitted_at) >= today).length,
      emProc: cases.filter((c) => c.status === "em_processamento").length,
      falhas: cases.filter((c) => c.status === "falha").length,
      escritoriosAtivos: activeOffices,
    };
  }, [cases]);

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Operação · Visão geral</span>
          <h1 className="font-display text-2xl md:text-3xl mt-1">
            Rastreamento de <span className="italic text-brand">Cases Jurídicos</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sessões de triagem recebidas pelo orquestrador, de todos os escritórios clientes.
            {api.useMockData ? (
              <span className="ml-2 text-[11px] text-brand/80">· modo mock</span>
            ) : null}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard icon={<Inbox className="size-5" />} label="Recebidos hoje" value={kpis.recebidosHoje} accent="text-sky-300" />
        <KpiCard icon={<Settings2 className="size-5" />} label="Em processamento" value={kpis.emProc} accent="text-amber-300" />
        <KpiCard icon={<AlertTriangle className="size-5" />} label="Com falha" value={kpis.falhas} accent="text-rose-300" />
        <KpiCard
          icon={<Building2 className="size-5" />}
          label="Escritórios ativos"
          value={kpis.escritoriosAtivos}
          accent="text-brand"
          sub="Com casos no período"
        />
      </div>

      <div className="items-center mb-4">
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Buscar case</span>
            <div className="mt-1 flex items-center gap-2 h-10 px-3 rounded-lg bg-secondary/60 border border-border focus-within:border-brand/60">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Protocolo, título, escritório ou correlation ID"
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>
          </label>
          <FilterSelect label="Status" value={statusFilter} onChange={(v) => setStatusFilter(v as "all" | CaseStatus)}>
            {CASE_STATUSES.map((k) => (
              <option key={k} value={k}>
                {STATUS_META[k].label}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Escritório" value={companyFilter} onChange={setCompanyFilter}>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Área" value={areaFilter} onChange={setAreaFilter}>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </FilterSelect>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4">
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden">
          <div className="grid grid-cols-[1.1fr_1.6fr_1.3fr_1fr_1fr_1.1fr] gap-3 px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border bg-secondary/30">
            <div>Protocolo</div>
            <div>Caso</div>
            <div>Escritório</div>
            <div>Área</div>
            <div>Status</div>
            <div>Última atualização</div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="p-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Carregando cases...
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState />
            ) : (
              filtered.map((c) => {
                const meta = STATUS_META[c.status];
                const active = selected?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left grid grid-cols-[1.1fr_1.6fr_1.3fr_1fr_1fr_1.1fr] gap-3 px-4 py-3 text-sm items-center border-b border-border/60 transition ${
                      active ? "bg-brand/10" : "hover:bg-secondary/40"
                    }`}
                  >
                    <div className="font-mono text-xs text-foreground">{c.protocol}</div>
                    <div className="truncate">{c.title ?? <span className="text-muted-foreground italic">Sem título</span>}</div>
                    <div className="truncate text-muted-foreground">{c.company?.name ?? "—"}</div>
                    <div className="text-muted-foreground">{c.area ?? "—"}</div>
                    <div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] ${meta.cls}`}>{meta.label}</span>
                    </div>
                    <div className="text-muted-foreground">{fmtDate(c.updated_at)}</div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <DetailsPanel caseRow={selected} />
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-10 px-3 rounded-lg bg-secondary/60 border border-border text-sm outline-none focus:border-brand/60 w-full"
      >
        <option value="all">Todos</option>
        {children}
      </select>
    </label>
  );
}

function KpiCard({
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
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-4 flex items-center gap-4">
      <div className={`size-11 rounded-lg border border-border bg-secondary/60 flex items-center justify-center ${accent}`}>{icon}</div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
        <div className={`text-2xl font-display mt-0.5 ${accent}`}>{value}</div>
        {sub ? <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div> : null}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-12 text-center">
      <div className="mx-auto size-12 rounded-full bg-secondary/60 border border-border flex items-center justify-center mb-3">
        <Inbox className="size-5 text-muted-foreground" />
      </div>
      <div className="font-medium">Nenhum case encontrado</div>
      <p className="text-sm text-muted-foreground mt-1">Ajuste os filtros. Os casos chegam pela API do orquestrador.</p>
    </div>
  );
}

function DetailsPanel({ caseRow }: { caseRow: LegalCase | null }) {
  if (!caseRow) {
    return (
      <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6 text-sm text-muted-foreground">
        Selecione um case para ver detalhes.
      </div>
    );
  }

  const timeline = buildTimeline({ status: caseRow.pipeline_status, delivered: caseRow.status === "enviado" });

  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5 h-fit sticky top-20">
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Detalhes do case</div>
        <div className="font-mono text-brand mt-0.5">{caseRow.protocol}</div>
        {caseRow.title ? <div className="text-sm mt-1">{caseRow.title}</div> : null}
      </div>

      <ol className="space-y-3 mb-5">
        {timeline.map((s, i) => {
          const done = s.status === "done";
          const current = s.status === "running";
          const failed = s.status === "failed";
          return (
            <li key={s.title} className="flex items-start gap-3">
              <div
                className={`mt-0.5 size-6 rounded-full flex items-center justify-center text-[10px] border ${
                  done
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : failed
                      ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                      : current
                        ? "bg-brand/20 border-brand/50 text-brand"
                        : "bg-secondary/60 border-border text-muted-foreground"
                }`}
              >
                {done ? <CheckCircle2 className="size-3.5" /> : failed ? <XCircle className="size-3.5" /> : i + 1}
              </div>
              <div className="flex-1">
                <div
                  className={`text-sm ${
                    failed ? "text-rose-300 font-medium" : current ? "text-brand font-medium" : done ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {s.title}
                </div>
                <div className="text-[11px] text-muted-foreground">{s.meta}</div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="space-y-2 text-sm border-t border-border pt-4">
        <Row label="Escritório" value={caseRow.company?.name ?? "—"} />
        <Row label="Plano" value={caseRow.company?.plan || "—"} />
        <Row label="Área" value={caseRow.area ?? "—"} />
        <Row label="Tipo de caso" value={caseRow.case_type ?? "—"} />
        <Row label="Status no orquestrador" value={SESSION_STATUS_LABELS[caseRow.pipeline_status]} />
        <Row label="Remetente cadastrado" value={caseRow.sender_registered ? "Sim" : "Não"} />
        <Row label="Recebido em" value={fmtDate(caseRow.submitted_at)} />
        <Row label="Correlation ID" value={<span className="font-mono text-xs break-all">{caseRow.correlation_id}</span>} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-right text-foreground">{value}</span>
    </div>
  );
}
