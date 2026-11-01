"use client";
import { useEffect, useMemo, useState } from "react";
import { Building2, Loader2, Pencil, Plus, Power, Search, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { api } from "@/lib/api-client";
import { maskCnpj, maskPhone } from "@/lib/masks";
import type { Company, CompanyLifecycle, FirmUser } from "@/lib/types";
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
  const [pendingDelete, setPendingDelete] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [userFor, setUserFor] = useState<Company | null>(null);

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

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.clients.remove(pendingDelete.id);
      setItems((xs) => xs.filter((c) => c.id !== pendingDelete.id));
      setPendingDelete(null);
      toast.success("Escritório excluído");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao excluir.");
    } finally {
      setDeleting(false);
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
                  <Line label="Usuários do portal" value={String(c.users_count ?? 0)} />
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
                    onClick={() => setUserFor(c)}
                    title="Usuários do portal"
                    className="h-9 px-3 rounded-lg border border-border text-muted-foreground hover:text-brand hover:border-brand/40 hover:bg-brand/10 transition"
                  >
                    <Users className="size-4" />
                  </button>
                  <button
                    onClick={() => setPendingDelete(c)}
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
      {userFor ? (
        <FirmUsersPanel
          company={userFor}
          onClose={() => setUserFor(null)}
          onUsersChanged={(count) => {
            setItems((xs) => xs.map((c) => (c.id === userFor.id ? { ...c, users_count: count } : c)));
          }}
        />
      ) : null}
      {pendingDelete ? (
        pendingDelete.cases_count > 0 ? (
          <ConfirmDialog
            title="Não é possível excluir"
            description={`O escritório “${pendingDelete.name}” já tem casos de triagem e não pode ser removido. Marque-o como inativo.`}
            onClose={() => setPendingDelete(null)}
          />
        ) : (
          <ConfirmDialog
            title="Excluir escritório"
            description={`Tem certeza que deseja excluir “${pendingDelete.name}”? Esta ação não pode ser desfeita.`}
            confirmLabel="Excluir"
            busy={deleting}
            onConfirm={() => void confirmDelete()}
            onClose={() => {
              if (!deleting) setPendingDelete(null);
            }}
          />
        )
      ) : null}
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

function normalizePersonText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prevDiag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = prev[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, prevDiag + cost);
      prevDiag = temp;
    }
  }
  return prev[b.length];
}

function textsLookSimilar(a: string, b: string) {
  const na = normalizePersonText(a);
  const nb = normalizePersonText(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 4 && nb.length >= 4 && (na.includes(nb) || nb.includes(na))) return true;
  const maxLen = Math.max(na.length, nb.length);
  return maxLen >= 5 && levenshtein(na, nb) / maxLen <= 0.28;
}

function findSimilarFirmUsers(users: FirmUser[], name: string, email: string, excludeId?: string) {
  const local = email.includes("@") ? email.split("@")[0] : email;
  return users.filter((u) => {
    if (excludeId && u.id === excludeId) return false;
    const uLocal = u.email.includes("@") ? u.email.split("@")[0] : u.email;
    return textsLookSimilar(u.name, name) || textsLookSimilar(u.email, email) || textsLookSimilar(uLocal, local);
  });
}

function fmtUserDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
}

function FirmUsersPanel({
  company,
  onClose,
  onUsersChanged,
}: {
  company: Company;
  onClose: () => void;
  onUsersChanged: (count: number) => void;
}) {
  const [users, setUsers] = useState<FirmUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editing, setEditing] = useState<FirmUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingSimilar, setPendingSimilar] = useState<FirmUser[] | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<FirmUser | null>(null);
  const [pendingToggleUser, setPendingToggleUser] = useState<FirmUser | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  function syncCount(rows: FirmUser[]) {
    onUsersChanged(rows.filter((u) => u.active).length);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.clients
      .listUsers(company.id)
      .then((rows) => {
        if (cancelled) return;
        setUsers(rows);
        syncCount(rows);
      })
      .catch((error) => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Falha ao carregar usuários.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company.id]);

  const similarMatches = useMemo(() => {
    if (mode !== "create") return [];
    if (!name.trim() && !email.trim()) return [];
    return findSimilarFirmUsers(users, name, email);
  }, [mode, users, name, email]);

  function openCreate() {
    setEditing(null);
    setName("");
    setEmail("");
    setJobTitle("");
    setPassword("");
    setPendingSimilar(null);
    setMode("create");
  }

  function openEdit(user: FirmUser) {
    setEditing(user);
    setName(user.name);
    setEmail(user.email);
    setJobTitle(user.job_title ?? "");
    setPassword("");
    setPendingSimilar(null);
    setMode("edit");
  }

  function backToList() {
    setMode("list");
    setEditing(null);
    setPendingSimilar(null);
    setPassword("");
  }

  async function persistCreate() {
    setSaving(true);
    try {
      const { user } = await api.clients.createUser(company.id, {
        name,
        email,
        password,
        job_title: jobTitle || undefined,
      });
      const next = [...users, user];
      setUsers(next);
      syncCount(next);
      toast.success("Usuário do portal criado");
      backToList();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao criar usuário.");
    } finally {
      setSaving(false);
      setPendingSimilar(null);
    }
  }

  async function persistEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      const { user } = await api.clients.updateUser(company.id, editing.id, {
        name,
        email,
        job_title: jobTitle || undefined,
        password: password || undefined,
      });
      setUsers((xs) => {
        const next = xs.map((u) => (u.id === user.id ? user : u));
        syncCount(next);
        return next;
      });
      toast.success("Usuário atualizado");
      backToList();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar usuário.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmToggleActive() {
    if (!pendingToggleUser) return;
    setActionBusy(true);
    try {
      const nextActive = !pendingToggleUser.active;
      const { user } = await api.clients.setUserActive(company.id, pendingToggleUser.id, nextActive);
      setUsers((xs) => {
        const next = xs.map((u) => (u.id === user.id ? user : u));
        syncCount(next);
        return next;
      });
      toast.success(nextActive ? "Usuário reativado" : "Usuário inativado");
      setPendingToggleUser(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar status.");
    } finally {
      setActionBusy(false);
    }
  }

  async function confirmDeleteUser() {
    if (!pendingDeleteUser) return;
    setActionBusy(true);
    try {
      await api.clients.removeUser(company.id, pendingDeleteUser.id);
      setUsers((xs) => {
        const next = xs.filter((u) => u.id !== pendingDeleteUser.id);
        syncCount(next);
        return next;
      });
      toast.success("Usuário excluído");
      setPendingDeleteUser(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao excluir usuário.");
    } finally {
      setActionBusy(false);
    }
  }

  function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    const matches = findSimilarFirmUsers(users, name, email);
    if (matches.length > 0) {
      setPendingSimilar(matches);
      return;
    }
    void persistCreate();
  }

  function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    void persistEdit();
  }

  const title = mode === "create" ? "Novo usuário" : mode === "edit" ? "Editar usuário" : "Usuários do portal";

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-xl">{title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{company.name}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>

        {mode === "list" ? (
          <>
            {loading ? (
              <div className="py-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Carregando usuários...
              </div>
            ) : users.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-6 text-center mb-4">
                <Users className="size-5 text-muted-foreground mx-auto mb-2" />
                <div className="text-sm font-medium">Nenhum usuário cadastrado</div>
                <p className="text-xs text-muted-foreground mt-1">Crie o primeiro acesso ao portal deste escritório.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden mb-4 divide-y divide-border/60">
                {users.map((u) => (
                  <div key={u.id} className={`px-4 py-3 ${u.active ? "" : "opacity-70 bg-secondary/20"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <div className="font-medium truncate text-sm">{u.name}</div>
                          <span
                            className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] ${
                              u.active
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                : "bg-secondary/60 text-muted-foreground border-border"
                            }`}
                          >
                            {u.active ? "Ativo" : "Inativo"}
                          </span>
                          {u.must_change_password ? (
                            <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] bg-amber-500/15 text-amber-200 border-amber-500/30">
                              Aguarda 1º acesso
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-muted-foreground break-all mt-0.5">{u.email}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          {u.job_title ? `${u.job_title} · ` : ""}
                          desde {fmtUserDate(u.created_at)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          title="Editar"
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingToggleUser(u)}
                          title={u.active ? "Inativar" : "Reativar"}
                          className={`h-8 w-8 inline-flex items-center justify-center rounded-lg border transition ${
                            u.active
                              ? "border-border text-muted-foreground hover:text-amber-200 hover:border-amber-500/40 hover:bg-amber-500/10"
                              : "border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
                          }`}
                        >
                          <Power className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteUser(u)}
                          title="Excluir"
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-rose-300 hover:border-rose-500/40 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg border border-border text-sm">
                Fechar
              </button>
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-brand text-brand-foreground font-semibold text-sm"
              >
                <Plus className="size-4" /> Novo usuário
              </button>
            </div>
          </>
        ) : null}

        {mode === "create" ? (
          <form onSubmit={submitCreate} className="space-y-3">
            <Field label="Nome completo">
              <input required value={name} onChange={(e) => setName(e.target.value)} className="modal-input" placeholder="Ana Ribeiro" />
            </Field>
            <Field label="Email de acesso">
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="modal-input" placeholder="ana@escritorio.com" />
            </Field>
            <Field label="Cargo (opcional)">
              <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="modal-input" placeholder="Sócia" />
            </Field>
            <Field label="Senha provisória">
              <input
                required
                minLength={6}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="modal-input"
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
            </Field>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              No primeiro login o usuário será obrigado a trocar esta senha.
            </p>
            {similarMatches.length > 0 ? (
              <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-100/90 leading-relaxed">
                Já existe cadastro parecido neste escritório:{" "}
                {similarMatches.map((u) => `${u.name} (${u.email})`).join("; ")}. Confira antes de criar outro.
              </div>
            ) : null}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button type="button" onClick={backToList} className="h-10 px-4 rounded-lg border border-border text-sm">
                Voltar
              </button>
              <button disabled={saving} className="h-10 px-4 rounded-lg bg-brand text-brand-foreground font-semibold text-sm disabled:opacity-60">
                {saving ? "Criando…" : "Criar usuário"}
              </button>
            </div>
          </form>
        ) : null}

        {mode === "edit" && editing ? (
          <form onSubmit={submitEdit} className="space-y-3">
            <Field label="Nome completo">
              <input required value={name} onChange={(e) => setName(e.target.value)} className="modal-input" placeholder="Ana Ribeiro" />
            </Field>
            <Field label="Email de acesso">
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="modal-input" placeholder="ana@escritorio.com" />
            </Field>
            <Field label="Cargo (opcional)">
              <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="modal-input" placeholder="Sócia" />
            </Field>
            <Field label="Nova senha provisória (opcional)">
              <input
                minLength={6}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="modal-input"
                placeholder="Deixe em branco para manter"
                autoComplete="new-password"
              />
            </Field>
            {password ? (
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Ao salvar, o usuário precisará redefinir a senha no próximo acesso.
              </p>
            ) : null}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button type="button" onClick={backToList} className="h-10 px-4 rounded-lg border border-border text-sm">
                Voltar
              </button>
              <button disabled={saving} className="h-10 px-4 rounded-lg bg-brand text-brand-foreground font-semibold text-sm disabled:opacity-60">
                {saving ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </form>
        ) : null}
      </div>

      {pendingSimilar ? (
        <ConfirmDialog
          title="Usuário parecido já cadastrado"
          description={`Encontramos cadastro parecido neste escritório: ${pendingSimilar
            .map((u) => `${u.name} (${u.email})`)
            .join("; ")}. Deseja criar mesmo assim?`}
          confirmLabel="Criar mesmo assim"
          busy={saving}
          onClose={() => setPendingSimilar(null)}
          onConfirm={() => void persistCreate()}
        />
      ) : null}

      {pendingToggleUser ? (
        <ConfirmDialog
          title={pendingToggleUser.active ? "Inativar usuário" : "Reativar usuário"}
          description={
            pendingToggleUser.active
              ? `“${pendingToggleUser.name}” (${pendingToggleUser.email}) perderá o acesso ao portal imediatamente.`
              : `“${pendingToggleUser.name}” (${pendingToggleUser.email}) voltará a poder acessar o portal.`
          }
          confirmLabel={pendingToggleUser.active ? "Inativar" : "Reativar"}
          busy={actionBusy}
          onClose={() => setPendingToggleUser(null)}
          onConfirm={() => void confirmToggleActive()}
        />
      ) : null}

      {pendingDeleteUser ? (
        <ConfirmDialog
          title="Excluir usuário"
          description={`Remover permanentemente “${pendingDeleteUser.name}” (${pendingDeleteUser.email})? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          busy={actionBusy}
          onClose={() => setPendingDeleteUser(null)}
          onConfirm={() => void confirmDeleteUser()}
        />
      ) : null}
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
