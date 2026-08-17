"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Inbox, Loader2, Plus, RefreshCw, Search, Settings2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

type CaseStatus = "recebido" | "em_validacao" | "em_processamento" | "relatorio_gerado" | "enviado" | "falha";
type CaseChannel = "API" | "Web" | "WhatsApp" | "CRM";

type Company = { id: string; name: string; plan: string };
type CaseRow = {
  id: string;
  case_code: string;
  status: CaseStatus;
  channel: CaseChannel;
  sender_registered: boolean;
  plan: string | null;
  deadline: string | null;
  notes: string | null;
  submitted_at: string;
  updated_at: string;
  company_id: string | null;
  company: Company | null;
};

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
  return date.toLocaleDateString("pt-BR") + " " + date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const MOCK_COMPANIES: Company[] = [
  { id: "c1", name: "Andrade & Sócios Advogados", plan: "Enterprise" },
  { id: "c2", name: "Silva Pereira Jurídico", plan: "Profissional" },
  { id: "c3", name: "Mendonça Tributário", plan: "Starter" },
  { id: "c4", name: "Costa & Lima Consultoria Legal", plan: "Profissional" },
];

const now = Date.now();
const h = (n: number) => new Date(now - n * 3600_000).toISOString();
const MOCK_CASES: CaseRow[] = [
  { id: "1", case_code: "CASE-2026-1042", status: "enviado", channel: "API", sender_registered: true, plan: "Enterprise", deadline: h(-24), notes: "Triagem trabalhista concluída — relatório anexado.", submitted_at: h(2), updated_at: h(1), company_id: "c1", company: MOCK_COMPANIES[0] },
  { id: "2", case_code: "CASE-2026-1041", status: "em_processamento", channel: "WhatsApp", sender_registered: true, plan: "Profissional", deadline: h(-48), notes: "Cliente solicitou priorização.", submitted_at: h(3), updated_at: h(2), company_id: "c2", company: MOCK_COMPANIES[1] },
  { id: "3", case_code: "CASE-2026-1040", status: "relatorio_gerado", channel: "Web", sender_registered: true, plan: "Profissional", deadline: h(-72), notes: null, submitted_at: h(5), updated_at: h(4), company_id: "c4", company: MOCK_COMPANIES[3] },
  { id: "4", case_code: "CASE-2026-1039", status: "em_validacao", channel: "API", sender_registered: false, plan: "Starter", deadline: h(-12), notes: "Documentação parcial — aguardando confirmação.", submitted_at: h(6), updated_at: h(5), company_id: "c3", company: MOCK_COMPANIES[2] },
  { id: "5", case_code: "CASE-2026-1038", status: "falha", channel: "CRM", sender_registered: true, plan: "Enterprise", deadline: null, notes: "Falha na integração com endpoint do cliente.", submitted_at: h(8), updated_at: h(7), company_id: "c1", company: MOCK_COMPANIES[0] },
  { id: "6", case_code: "CASE-2026-1037", status: "recebido", channel: "WhatsApp", sender_registered: true, plan: "Profissional", deadline: h(-96), notes: "Caso de família — divórcio consensual.", submitted_at: h(10), updated_at: h(10), company_id: "c2", company: MOCK_COMPANIES[1] },
  { id: "7", case_code: "CASE-2026-1036", status: "enviado", channel: "API", sender_registered: true, plan: "Profissional", deadline: h(-120), notes: null, submitted_at: h(26), updated_at: h(24), company_id: "c4", company: MOCK_COMPANIES[3] },
  { id: "8", case_code: "CASE-2026-1035", status: "enviado", channel: "Web", sender_registered: true, plan: "Enterprise", deadline: h(-200), notes: "Análise contratual finalizada.", submitted_at: h(30), updated_at: h(28), company_id: "c1", company: MOCK_COMPANIES[0] },
];

export default function CasesPage() {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CaseStatus>("all");
  const [companyFilter, setCompanyFilter] = useState<"all" | string>("all");
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
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao carregar dados."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const filtered = useMemo(() => cases.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (companyFilter !== "all" && c.company_id !== companyFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!c.case_code.toLowerCase().includes(q) && !(c.company?.name?.toLowerCase().includes(q))) return false;
    }
    return true;
  }), [cases, statusFilter, companyFilter, search]);

  const selected = filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null;

  const kpis = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return {
      recebidosHoje: cases.filter((c) => new Date(c.submitted_at) >= today).length,
      emProc: cases.filter((c) => c.status === "em_processamento" || c.status === "em_validacao").length,
      falhas: cases.filter((c) => c.status === "falha").length,
    };
  }, [cases]);

  async function removeCase(id: string) {
    if (!confirm("Excluir este case?")) return;
    try {
      await api.cases.remove(id);
      setCases((cs) => cs.filter((c) => c.id !== id));
      toast.success("Case excluído");
      setSelectedId(null);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao excluir."); }
  }

  async function updateStatus(id: string, next: CaseStatus) {
    try {
      const updated = await api.cases.update(id, { status: next });
      setCases((cs) => cs.map((c) => c.id === id ? updated : c));
      toast.success("Status atualizado");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao atualizar."); }
  }

  async function createCase(payload: Omit<CaseRow, "id" | "company" | "submitted_at" | "updated_at">) {
    try {
      const created = await api.cases.create(payload);
      setCases((cs) => [created, ...cs]);
      setSelectedId(created.id);
      toast.success("Case criado");
      setShowNew(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao criar."); }
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Operação</span>
          <h1 className="font-display text-2xl md:text-3xl mt-1">Rastreamento de <span className="italic text-brand">Cases Jurídicos</span></h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe em tempo real cada case enviado por seus escritórios clientes.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void loadData(true)} disabled={loading} className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-border text-sm hover:bg-secondary transition disabled:opacity-60">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </button>
          <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-brand text-brand-foreground font-semibold text-sm brand-glow hover:opacity-95 transition">
            <Plus className="size-4" /> Novo case
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <KpiCard icon={<Inbox className="size-5" />} label="Cases recebidos hoje" value={kpis.recebidosHoje} accent="text-sky-300" />
        <KpiCard icon={<Settings2 className="size-5" />} label="Em processamento" value={kpis.emProc} accent="text-amber-300" />
        <KpiCard icon={<AlertTriangle className="size-5" />} label="Falhas de envio" value={kpis.falhas} accent="text-rose-300" />
      </div>
      <div className="items-center mb-4">
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-3 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 items-end">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Buscar case</span>
            <div className="mt-1 flex items-center gap-2 h-10 px-3 rounded-lg bg-secondary/60 border border-border focus-within:border-brand/60">
              <Search className="size-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ID do case ou escritório" className="w-full bg-transparent outline-none text-sm" />
            </div>
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | CaseStatus)} className="mt-1 h-10 px-3 rounded-lg bg-secondary/60 border border-border text-sm outline-none focus:border-brand/60">
              <option value="all">Todos</option>
              {Object.entries(STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Escritório</span>
            <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="mt-1 h-10 px-3 rounded-lg bg-secondary/60 border border-border text-sm outline-none focus:border-brand/60">
              <option value="all">Todos</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4">
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden">
          <div className="grid grid-cols-[1.2fr_1.4fr_1.2fr_1fr_0.8fr_1.2fr] gap-3 px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border bg-secondary/30">
            <div>ID do Case</div><div>Escritório</div><div>Data de envio</div><div>Status</div><div>Canal</div><div>Última atualização</div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="p-12 flex items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Carregando cases...</div>
            ) : filtered.length === 0 ? (
              <EmptyState onCreate={() => setShowNew(true)} />
            ) : (
              filtered.map((c) => {
                const meta = STATUS_META[c.status];
                const active = selected?.id === c.id;
                return (
                  <button key={c.id} onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left grid grid-cols-[1.2fr_1.4fr_1.2fr_1fr_0.8fr_1.2fr] gap-3 px-4 py-3 text-sm items-center border-b border-border/60 transition ${active ? "bg-brand/10" : "hover:bg-secondary/40"}`}>
                    <div className="font-mono text-xs text-foreground">{c.case_code}</div>
                    <div className="truncate">{c.company?.name ?? <span className="text-muted-foreground italic">—</span>}</div>
                    <div className="text-muted-foreground">{fmtDate(c.submitted_at)}</div>
                    <div><span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] ${meta.cls}`}>{meta.label}</span></div>
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

      {showNew && (
        <NewCaseModal companies={companies} onClose={() => setShowNew(false)} onCreate={createCase} />
      )}
    </div>
  );
}

function KpiCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-4 flex items-center gap-4">
      <div className={`size-11 rounded-lg border border-border bg-secondary/60 flex items-center justify-center ${accent}`}>{icon}</div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
        <div className={`text-2xl font-display mt-0.5 ${accent}`}>{value}</div>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="p-12 text-center">
      <div className="mx-auto size-12 rounded-full bg-secondary/60 border border-border flex items-center justify-center mb-3"><Inbox className="size-5 text-muted-foreground" /></div>
      <div className="font-medium">Nenhum case encontrado</div>
      <p className="text-sm text-muted-foreground mt-1">Crie um novo case ou ajuste seus filtros.</p>
      <button onClick={onCreate} className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-brand text-brand-foreground text-sm font-semibold"><Plus className="size-4" /> Novo case</button>
    </div>
  );
}

function DetailsPanel({ caseRow, onDelete, onUpdateStatus }: { caseRow: CaseRow | null; onDelete: (id: string) => void; onUpdateStatus: (id: string, s: CaseStatus) => void }) {
  const [status, setStatus] = useState<CaseStatus | "">(caseRow?.status ?? "");
  if (!caseRow) {
    return <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6 text-sm text-muted-foreground">Selecione um case para ver detalhes.</div>;
  }
  // sync local
  if (status !== caseRow.status && status === "") setStatus(caseRow.status);

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
        <button onClick={() => onDelete(caseRow.id)} className="p-2 rounded-lg text-muted-foreground hover:text-rose-300 hover:bg-rose-500/10 transition"><Trash2 className="size-4" /></button>
      </div>

      <ol className="space-y-3 mb-5">
        {steps.map((s, i) => {
          const done = i < currentIdx || caseRow.status === "enviado";
          const current = i === currentIdx;
          return (
            <li key={s.key} className="flex items-start gap-3">
              <div className={`mt-0.5 size-6 rounded-full flex items-center justify-center text-[10px] border ${done ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : current ? "bg-brand/20 border-brand/50 text-brand" : "bg-secondary/60 border-border text-muted-foreground"}`}>
                {done ? <CheckCircle2 className="size-3.5" /> : i + 1}
              </div>
              <div className="flex-1">
                <div className={`text-sm ${current ? "text-brand font-medium" : done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</div>
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
        <div className="flex items-center gap-2">
          <select value={caseRow.status} onChange={(e) => onUpdateStatus(caseRow.id, e.target.value as CaseStatus)} className="flex-1 h-9 px-2 rounded-lg bg-secondary/60 border border-border text-sm outline-none focus:border-brand/60">
            {Object.entries(STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
          </select>
        </div>
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

function NewCaseModal({ companies, onClose, onCreate }: { companies: Company[]; onClose: () => void; onCreate: (payload: Omit<CaseRow, "id" | "company" | "submitted_at" | "updated_at">) => void }) {
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
      channel, status,
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
          <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
        </div>
        <div className="space-y-3">
          <Field label="ID do case"><input required value={caseCode} onChange={(e) => setCaseCode(e.target.value)} className="modal-input" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Escritório">
              <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="modal-input">
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Canal">
              <select value={channel} onChange={(e) => setChannel(e.target.value as CaseChannel)} className="modal-input">
                {["API", "Web", "WhatsApp", "CRM"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status inicial">
              <select value={status} onChange={(e) => setStatus(e.target.value as CaseStatus)} className="modal-input">
                {Object.entries(STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
              </select>
            </Field>
            <Field label="Prazo"><input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="modal-input" /></Field>
          </div>
          <Field label="Observações"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="modal-input resize-none" placeholder="Notas internas…" /></Field>
        </div>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg border border-border text-sm">Cancelar</button>
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
