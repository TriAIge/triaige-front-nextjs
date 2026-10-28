"use client";
import { useEffect, useMemo, useState } from "react";
import { Building2, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { maskCnpj, maskPhone } from "@/lib/masks";
import type { Company, CompanyLifecycle } from "@/lib/types";
import { PLANS } from "@/lib/types";

const LIFECYCLE_META: Record<CompanyLifecycle, { label: string; cls: string }> = {
  ativa: { label: "Ativa", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  onboarding: { label: "Onboarding", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  inativa: { label: "Inativa", cls: "bg-secondary/60 text-muted-foreground border-border" },
};

const PLAN_META: Record<string, string> = {
  Enterprise: "border-brand/40 bg-brand/15 text-brand",
  Profissional: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  Starter: "border-border bg-secondary/50 text-muted-foreground",
};

function formatCnpj(cnpj: string | null) {
  if (!cnpj) return null;
  const masked = maskCnpj(cnpj);
  return masked || null;
}

function resolveLifecycle(c: Company): CompanyLifecycle {
  if (c.lifecycle_status) return c.lifecycle_status;
  if ((c.notes ?? "").toLowerCase().includes("onboarding")) return "onboarding";
  return "ativa";
}

export default function ClientsPage() {
  const [items, setItems] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Company | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    api.clients
      .list()
      .then(setItems)
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    const digits = search.replace(/\D/g, "");
    return items.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (digits.length > 0 && (c.cnpj ?? "").replace(/\D/g, "").includes(digits)) ||
        (c.contact_email ?? "").toLowerCase().includes(q),
    );
  }, [items, search]);

  async function remove(id: string) {
    if (!confirm("Excluir este escritório?")) return;
    try {
      await api.clients.remove(id);
      setItems((xs) => xs.filter((c) => c.id !== id));
      toast.success("Escritório excluído");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao excluir.");
    }
  }
  function openNew() {
    setEditing(null);
    setShowForm(true);
  }
  function openEdit(c: Company) {
    setEditing(c);
    setShowForm(true);
  }
  async function save(
    payload: Omit<Company, "id" | "created_at" | "cases_count"> & { lifecycle_status?: CompanyLifecycle },
  ) {
    try {
      if (editing) {
        const updated = await api.clients.update(editing.id, payload);
        setItems((xs) => xs.map((c) => (c.id === editing.id ? updated : c)));
        toast.success("Escritório atualizado");
      } else {
        const created = await api.clients.create(payload);
        setItems((xs) => [created, ...xs]);
        toast.success("Escritório cadastrado");
      }
      setShowForm(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar.");
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Carteira</span>
          <h1 className="font-display text-2xl md:text-3xl mt-1">
            Escritórios <span className="italic text-brand">Clientes</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastre e gerencie os escritórios e departamentos jurídicos que utilizam a operação triAIge.
            {api.useMockData ? <span className="ml-2 text-[11px] text-brand/80">· modo mock</span> : null}
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-brand text-brand-foreground font-semibold text-sm brand-glow hover:opacity-95 transition"
        >
          <Plus className="size-4" /> Novo escritório
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-3 mb-4">
        <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-secondary/60 border border-border focus-within:border-brand/60">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, CNPJ ou email"
            className="w-full bg-transparent outline-none text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card/60 p-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando escritórios...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-12 text-center">
          <div className="mx-auto size-12 rounded-full bg-secondary/60 border border-border flex items-center justify-center mb-3">
            <Building2 className="size-5 text-muted-foreground" />
          </div>
          <div className="font-medium">Nenhum escritório encontrado</div>
          <p className="text-sm text-muted-foreground mt-1">Ajuste sua busca ou cadastre o primeiro cliente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const life = resolveLifecycle(c);
            const lifeMeta = LIFECYCLE_META[life];
            return (
              <div key={c.id} className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5 group hover:border-brand/40 transition">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-lg bg-brand/15 border border-brand/30 text-brand flex items-center justify-center font-display shrink-0">
                      {c.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">{c.name}</div>
                      <div className="text-[11px] text-muted-foreground">{formatCnpj(c.cnpj) ?? "CNPJ não informado"}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] ${PLAN_META[c.plan] ?? PLAN_META.Starter}`}>
                      {c.plan || "Sem plano"}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] ${lifeMeta.cls}`}>{lifeMeta.label}</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  <Line label="Email" value={c.contact_email || "—"} />
                  <Line label="Telefone" value={c.contact_phone ? maskPhone(c.contact_phone) : "—"} />
                  <Line label="Cases" value={String(c.cases_count)} />
                </div>
                {c.notes ? (
                  <p className="mt-3 text-xs text-muted-foreground rounded-lg bg-secondary/40 border border-border p-2 line-clamp-2">{c.notes}</p>
                ) : null}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                  <button
                    onClick={() => openEdit(c)}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-9 rounded-lg border border-border text-sm hover:bg-secondary transition"
                  >
                    <Pencil className="size-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => remove(c.id)}
                    className="h-9 px-3 rounded-lg border border-border text-muted-foreground hover:text-rose-300 hover:border-rose-500/40 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <CompanyForm initial={editing} onClose={() => setShowForm(false)} onSave={save} />}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground truncate">{value}</span>
    </div>
  );
}

function CompanyForm({
  initial,
  onClose,
  onSave,
}: {
  initial: Company | null;
  onClose: () => void;
  onSave: (payload: Omit<Company, "id" | "created_at" | "cases_count"> & { lifecycle_status?: CompanyLifecycle }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [cnpj, setCnpj] = useState(formatCnpj(initial?.cnpj ?? null) ?? "");
  const [email, setEmail] = useState(initial?.contact_email ?? "");
  const [phone, setPhone] = useState(initial?.contact_phone ? maskPhone(initial.contact_phone) : "");
  const [plan, setPlan] = useState(initial?.plan || "Starter");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [lifecycle, setLifecycle] = useState<CompanyLifecycle>(resolveLifecycle(initial ?? ({ notes: null } as Company)));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      name,
      cnpj: cnpj || null,
      contact_email: email || null,
      contact_phone: phone || null,
      plan,
      notes: notes || null,
      lifecycle_status: lifecycle,
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">{initial ? "Editar escritório" : "Novo escritório"}</h2>
          <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-3">
          <Field label="Nome do escritório / departamento">
            <input required value={name} onChange={(e) => setName(e.target.value)} className="modal-input" placeholder="Silva & Advogados" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="CNPJ">
              <input
                value={cnpj}
                inputMode="numeric"
                autoComplete="off"
                maxLength={18}
                onChange={(e) => setCnpj(maskCnpj(e.target.value))}
                className="modal-input"
                placeholder="00.000.000/0000-00"
              />
            </Field>
            <Field label="Plano">
              <select value={plan} onChange={(e) => setPlan(e.target.value)} className="modal-input">
                {PLANS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email de contato">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="modal-input" placeholder="contato@escritorio.com" />
            </Field>
            <Field label="Telefone">
              <input
                value={phone}
                inputMode="tel"
                autoComplete="tel"
                maxLength={15}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                className="modal-input"
                placeholder="(11) 90000-0000"
              />
            </Field>
          </div>
          <Field label="Status do ciclo">
            <select value={lifecycle} onChange={(e) => setLifecycle(e.target.value as CompanyLifecycle)} className="modal-input">
              {(Object.keys(LIFECYCLE_META) as CompanyLifecycle[]).map((k) => (
                <option key={k} value={k}>
                  {LIFECYCLE_META[k].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Observações">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="modal-input resize-none" placeholder="Anotações internas…" />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg border border-border text-sm">
            Cancelar
          </button>
          <button className="h-10 px-4 rounded-lg bg-brand text-brand-foreground font-semibold text-sm">{initial ? "Salvar" : "Cadastrar"}</button>
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
