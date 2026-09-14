"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Inbox,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { CaseChannel, CaseStatus, CompanySummary, LegalCase } from "@/lib/types";
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

export default function CasesPage() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CaseStatus>("all");
  const [companyFilter, setCompanyFilter] = useState<"all" | string>("all");
  const [channelFilter, setChannelFilter] = useState<"all" | CaseChannel>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

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

  const filtered = useMemo(
    () =>
      cases.filter((c) => {
        if (statusFilter !== "all" && c.status !== statusFilter) return false;
        if (companyFilter !== "all" && c.company_id !== companyFilter) return false;
        if (channelFilter !== "all" && c.channel !== channelFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          if (!c.case_code.toLowerCase().includes(q) && !(c.company?.name?.toLowerCase().includes(q) ?? false)) {
            return false;
          }
        }
        return true;
      }),
    [cases, statusFilter, companyFilter, channelFilter, search],
  );

  const selected = filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null;

  const kpis = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeOffices = new Set(
      cases.map((c) => c.company_id).filter((id): id is string => Boolean(id)),
    ).size;
    return {
      recebidosHoje: cases.filter((c) => new Date(c.submitted_at) >= today).length,
      emProc: cases.filter((c) => c.status === "em_processamento" || c.status === "em_validacao").length,
      falhas: cases.filter((c) => c.status === "falha").length,
      escritoriosAtivos: activeOffices,
    };
  }, [cases]);

  async function removeCase(id: string) {
    if (!confirm("Excluir este case?")) return;
    try {
      await api.cases.remove(id);
      setCases((cs) => cs.filter((c) => c.id !== id));
      toast.success("Case excluído");
      setSelectedId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao excluir.");
    }
  }

  async function updateStatus(id: string, next: CaseStatus) {
    try {
      const updated = await api.cases.update(id, { status: next });
      setCases((cs) => cs.map((c) => (c.id === id ? updated : c)));
      toast.success("Status atualizado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar.");
    }
  }

  async function createCase(payload: Omit<LegalCase, "id" | "company" | "submitted_at" | "updated_at">) {
    try {
      const created = await api.cases.create(payload);
      setCases((cs) => [created, ...cs]);
      setSelectedId(created.id);
      toast.success("Case criado");
      setShowNew(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao criar.");
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Operação · Visão geral</span>
          <h1 className="font-display text-2xl md:text-3xl mt-1">
            Rastreamento de <span className="italic text-brand">Cases Jurídicos</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Todos os escritórios clientes, casos e status de processamento em um só lugar.
            {api.useMockData ? (
              <span className="ml-2 text-[11px] text-brand/80">· modo mock</span>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadData(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-border text-sm hover:bg-secondary transition disabled:opacity-60"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-brand text-brand-foreground font-semibold text-sm brand-glow hover:opacity-95 transition"
          >
            <Plus className="size-4" /> Novo case
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard icon={<Inbox className="size-5" />} label="Recebidos hoje" value={kpis.recebidosHoje} accent="text-sky-300" />
        <KpiCard icon={<Settings2 className="size-5" />} label="Em processamento" value={kpis.emProc} accent="text-amber-300" />
        <KpiCard icon={<AlertTriangle className="size-5" />} label="Falhas de envio" value={kpis.falhas} accent="text-rose-300" />
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
                placeholder="ID do case ou escritório"
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
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Escritório</span>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="mt-1 h-10 px-3 rounded-lg bg-secondary/60 border border-border text-sm outline-none focus:border-brand/60 w-full"
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
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4">
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden">
          <div className="grid grid-cols-[1.2fr_1.4fr_1.2fr_1fr_0.8fr_1.2fr] gap-3 px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border bg-secondary/30">
            <div>ID do Case</div>
            <div>Escritório</div>
            <div>Data de envio</div>
            <div>Status</div>
            <div>Canal</div>
            <div>Última atualização</div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="p-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Carregando cases...
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState onCreate={() => setShowNew(true)} />
            ) : (
              filtered.map((c) => {
                const meta = STATUS_META[c.status];
                const active = selected?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left grid grid-cols-[1.2fr_1.4fr_1.2fr_1fr_0.8fr_1.2fr] gap-3 px-4 py-3 text-sm items-center border-b border-border/60 transition ${
                      active ? "bg-brand/10" : "hover:bg-secondary/40"
                    }`}
                  >
                    <div className="font-mono text-xs text-foreground">{c.case_code}</div>
                    <div className="truncate">{c.company?.name ?? <span className="text-muted-foreground italic">—</span>}</div>
                    <div className="text-muted-foreground">{fmtDate(c.submitted_at)}</div>
                    <div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] ${meta.cls}`}>{meta.label}</span>
                    </div>
                    <div className="text-muted-foreground">{c.channel}</div>
                    <div className="text-muted-foreground">{fmtDate(c.updated_at)}</div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <DetailsPanel caseRow={selected} onDelete={removeCase} onUpdateStatus={updateStatus} />
      </div>

      {showNew && <NewCaseModal companies={companies} onClose={() => setShowNew(false)} onCreate={createCase} />}
    </div>
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

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="p-12 text-center">
      <div className="mx-auto size-12 rounded-full bg-secondary/60 border border-border flex items-center justify-center mb-3">
        <Inbox className="size-5 text-muted-foreground" />
      </div>
      <div className="font-medium">Nenhum case encontrado</div>
      <p className="text-sm text-muted-foreground mt-1">Crie um novo case ou ajuste seus filtros.</p>
      <button
        onClick={onCreate}
        className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-brand text-brand-foreground text-sm font-semibold"
      >
        <Plus className="size-4" /> Novo case
      </button>
    </div>
  );
}

function DetailsPanel({
  caseRow,
  onDelete,
  onUpdateStatus,
}: {
  caseRow: LegalCase | null;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, s: CaseStatus) => void;
}) {
  if (!caseRow) {
    return (
      <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6 text-sm text-muted-foreground">
        Selecione um case para ver detalhes.
      </div>
    );
  }

  const steps: { key: CaseStatus; label: string }[] = [
    { key: "recebido", label: "Recebimento" },
    { key: "em_validacao", label: "Validação" },
    { key: "em_processamento", label: "Processamento" },
    { key: "relatorio_gerado", label: "Geração do relatório" },
    { key: "enviado", label: "Envio" },
  ];
  const order: CaseStatus[] = ["recebido", "em_validacao", "em_processamento", "relatorio_gerado", "enviado"];
  const currentIdx = order.indexOf(caseRow.status);

  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5 h-fit sticky top-20">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Detalhes do case</div>
          <div className="font-mono text-brand mt-0.5">{caseRow.case_code}</div>
        </div>
        <button
          onClick={() => onDelete(caseRow.id)}
          className="p-2 rounded-lg text-muted-foreground hover:text-rose-300 hover:bg-rose-500/10 transition"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <ol className="space-y-3 mb-5">
        {steps.map((s, i) => {
          const done = i < currentIdx || caseRow.status === "enviado";
          const current = i === currentIdx;
          return (
            <li key={s.key} className="flex items-start gap-3">
              <div
                className={`mt-0.5 size-6 rounded-full flex items-center justify-center text-[10px] border ${
                  done
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : current
                      ? "bg-brand/20 border-brand/50 text-brand"
                      : "bg-secondary/60 border-border text-muted-foreground"
                }`}
              >
                {done ? <CheckCircle2 className="size-3.5" /> : i + 1}
              </div>
              <div className="flex-1">
                <div className={`text-sm ${current ? "text-brand font-medium" : done ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.label}
                </div>
                <div className="text-[11px] text-muted-foreground">{done ? "Concluído" : current ? "Em andamento" : "Pendente"}</div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="space-y-2 text-sm border-t border-border pt-4">
        <Row label="Escritório" value={caseRow.company?.name ?? "—"} />
        <Row label="Plano" value={caseRow.plan ?? caseRow.company?.plan ?? "—"} />
        <Row label="Canal" value={caseRow.channel} />
        <Row label="Remetente cadastrado" value={caseRow.sender_registered ? "Sim" : "Não"} />
        <Row label="Prazo estimado" value={fmtDate(caseRow.deadline)} />
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Observações</div>
          <div className="text-sm rounded-md bg-secondary/40 border border-border p-2 min-h-[44px]">{caseRow.notes || "—"}</div>
        </div>
      </div>

      <div className="border-t border-border mt-4 pt-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Atualizar status</div>
        <select
          value={caseRow.status}
          onChange={(e) => onUpdateStatus(caseRow.id, e.target.value as CaseStatus)}
          className="w-full h-9 px-2 rounded-lg bg-secondary/60 border border-border text-sm outline-none focus:border-brand/60"
        >
          {CASE_STATUSES.map((k) => (
            <option key={k} value={k}>
              {STATUS_META[k].label}
            </option>
          ))}
        </select>
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

function NewCaseModal({
  companies,
  onClose,
  onCreate,
}: {
  companies: CompanySummary[];
  onClose: () => void;
  onCreate: (payload: Omit<LegalCase, "id" | "company" | "submitted_at" | "updated_at">) => void;
}) {
  const [caseCode, setCaseCode] = useState(() => "CASE-" + new Date().getFullYear() + "-" + Math.floor(Math.random() * 9000 + 1000));
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [channel, setChannel] = useState<CaseChannel>("API");
  const [status, setStatus] = useState<CaseStatus>("recebido");
  const [notes, setNotes] = useState("");
  const [deadline, setDeadline] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onCreate({
      case_code: caseCode,
      company_id: companyId || null,
      channel,
      status,
      sender_registered: true,
      plan: companies.find((c) => c.id === companyId)?.plan ?? null,
      notes: notes || null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">Novo case</h2>
          <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-3">
          <Field label="ID do case">
            <input required value={caseCode} onChange={(e) => setCaseCode(e.target.value)} className="modal-input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Escritório">
              <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="modal-input">
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Canal">
              <select value={channel} onChange={(e) => setChannel(e.target.value as CaseChannel)} className="modal-input">
                {CASE_CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status inicial">
              <select value={status} onChange={(e) => setStatus(e.target.value as CaseStatus)} className="modal-input">
                {CASE_STATUSES.map((k) => (
                  <option key={k} value={k}>
                    {STATUS_META[k].label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Prazo">
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="modal-input" />
            </Field>
          </div>
          <Field label="Observações">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="modal-input resize-none" placeholder="Notas internas…" />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg border border-border text-sm">
            Cancelar
          </button>
          <button className="h-10 px-4 rounded-lg bg-brand text-brand-foreground font-semibold text-sm">Criar case</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
