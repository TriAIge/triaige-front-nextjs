"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Power, Search, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { api } from "@/lib/api-client";
import { STAFF_ROLE_LABELS, STAFF_ROLES, type StaffRole, type StaffUser } from "@/lib/types";
import { useSession } from "@/lib/use-session";

function fmtDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
}

export default function EquipePage() {
  const { session } = useSession("staff");
  const [items, setItems] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<StaffUser | null | "new">(null);
  const [pendingDelete, setPendingDelete] = useState<StaffUser | null>(null);
  const [pendingToggle, setPendingToggle] = useState<StaffUser | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.admin
      .staff()
      .then(setItems)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Falha ao carregar equipe."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.job_title ?? "").toLowerCase().includes(q) ||
        STAFF_ROLE_LABELS[u.role].toLowerCase().includes(q),
    );
  }, [items, search]);

  async function confirmToggle() {
    if (!pendingToggle) return;
    setBusy(true);
    try {
      const { user } = await api.admin.setStaffActive(pendingToggle.id, !pendingToggle.active);
      setItems((xs) => xs.map((u) => (u.id === user.id ? user : u)));
      toast.success(user.active ? "Funcionário reativado" : "Funcionário inativado");
      setPendingToggle(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar status.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await api.admin.removeStaff(pendingDelete.id);
      setItems((xs) => xs.filter((u) => u.id !== pendingDelete.id));
      toast.success("Funcionário excluído");
      setPendingDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao excluir.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Plataforma</div>
          <h1 className="font-display text-3xl mt-1">Equipe triAIge</h1>
          <p className="text-sm text-muted-foreground mt-1">Funcionários com acesso ao painel (admin e operações).</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-brand text-brand-foreground font-semibold text-sm"
        >
          <Plus className="size-4" /> Novo funcionário
        </button>
      </div>

      <div className="relative">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, email, cargo…"
          className="w-full h-10 pl-10 pr-3 rounded-xl border border-border bg-secondary/40 text-sm outline-none focus:border-brand/50"
        />
      </div>

      {loading ? (
        <div className="py-16 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando equipe...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-secondary/20 p-10 text-center">
          <Users className="size-6 text-muted-foreground mx-auto mb-2" />
          <div className="text-sm font-medium">Nenhum funcionário encontrado</div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border/60">
          {filtered.map((u) => {
            const isSelf = session?.user.id === u.id;
            return (
              <div key={u.id} className={`px-4 py-3.5 flex items-start justify-between gap-3 ${u.active ? "" : "opacity-70 bg-secondary/20"}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-medium text-sm truncate">{u.name}</div>
                    <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] border-brand/30 bg-brand/10 text-brand">
                      {STAFF_ROLE_LABELS[u.role]}
                    </span>
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
                    {isSelf ? (
                      <span className="shrink-0 text-[10px] text-muted-foreground uppercase tracking-wider">você</span>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground break-all mt-0.5">{u.email}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {u.job_title ? `${u.job_title} · ` : ""}
                    desde {fmtDate(u.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditing(u)}
                    title="Editar"
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isSelf}
                    onClick={() => setPendingToggle(u)}
                    title={u.active ? "Inativar" : "Reativar"}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-amber-200 hover:border-amber-500/40 hover:bg-amber-500/10 transition disabled:opacity-40"
                  >
                    <Power className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isSelf}
                    onClick={() => setPendingDelete(u)}
                    title="Excluir"
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-rose-300 hover:border-rose-500/40 hover:bg-rose-500/10 transition disabled:opacity-40"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing ? (
        <StaffForm
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(user) => {
            setItems((xs) => {
              const idx = xs.findIndex((u) => u.id === user.id);
              if (idx < 0) return [user, ...xs];
              const next = [...xs];
              next[idx] = user;
              return next;
            });
            setEditing(null);
          }}
        />
      ) : null}

      {pendingToggle ? (
        <ConfirmDialog
          title={pendingToggle.active ? "Inativar funcionário" : "Reativar funcionário"}
          description={
            pendingToggle.active
              ? `“${pendingToggle.name}” perderá o acesso ao painel imediatamente.`
              : `“${pendingToggle.name}” voltará a poder acessar o painel.`
          }
          confirmLabel={pendingToggle.active ? "Inativar" : "Reativar"}
          busy={busy}
          onClose={() => setPendingToggle(null)}
          onConfirm={() => void confirmToggle()}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title="Excluir funcionário"
          description={`Remover permanentemente “${pendingDelete.name}” (${pendingDelete.email})?`}
          confirmLabel="Excluir"
          busy={busy}
          onClose={() => setPendingDelete(null)}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </div>
  );
}

function StaffForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: StaffUser | null;
  onClose: () => void;
  onSaved: (user: StaffUser) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [jobTitle, setJobTitle] = useState(initial?.job_title ?? "");
  const [role, setRole] = useState<StaffRole>(initial?.role ?? "ops");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (initial) {
        const { user } = await api.admin.updateStaff(initial.id, {
          name,
          email,
          role,
          job_title: jobTitle || undefined,
          password: password || undefined,
        });
        toast.success("Funcionário atualizado");
        onSaved(user);
      } else {
        const { user } = await api.admin.createStaff({
          name,
          email,
          password,
          role,
          job_title: jobTitle || undefined,
        });
        toast.success("Funcionário criado");
        onSaved(user);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">{initial ? "Editar funcionário" : "Novo funcionário"}</h2>
          <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-3">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Nome</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="modal-input mt-1" />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Email</span>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="modal-input mt-1" />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Cargo (opcional)</span>
            <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="modal-input mt-1" placeholder="CS / Ops / Eng" />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Perfil</span>
            <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)} className="modal-input mt-1">
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {STAFF_ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              {initial ? "Nova senha provisória (opcional)" : "Senha provisória"}
            </span>
            <input
              required={!initial}
              minLength={6}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="modal-input mt-1"
              placeholder={initial ? "Deixe em branco para manter" : "Mínimo 6 caracteres"}
              autoComplete="new-password"
            />
          </label>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {initial && !password
              ? "Alterar a senha aqui obriga a troca no próximo login."
              : "No primeiro login o funcionário será obrigado a trocar esta senha."}
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg border border-border text-sm">
            Cancelar
          </button>
          <button disabled={saving} className="h-10 px-4 rounded-lg bg-brand text-brand-foreground font-semibold text-sm disabled:opacity-60">
            {saving ? "Salvando…" : initial ? "Salvar" : "Criar"}
          </button>
        </div>
      </form>
    </div>
  );
}
