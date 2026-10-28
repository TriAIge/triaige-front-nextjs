"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { maskPhone } from "@/lib/masks";
import {
  RECIPIENT_CHANNELS,
  type PortalCredential,
  type PortalRecipient,
  type PortalRecipientInput,
  type RecipientChannel,
} from "@/lib/types";

const CREDENTIAL_META: Record<PortalCredential["status"], { label: string; cls: string }> = {
  ativa: { label: "Ativa", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  expirando: { label: "Expirando", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  expirada: { label: "Expirada", cls: "bg-secondary/60 text-muted-foreground border-border" },
  revogada: { label: "Revogada", cls: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
  inativa: { label: "Inativa", cls: "bg-secondary/60 text-muted-foreground border-border" },
  inexistente: { label: "Não emitida", cls: "bg-secondary/60 text-muted-foreground border-border" },
};

function fmtDate(d: string) {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return (
    date.toLocaleDateString("pt-BR") +
    " " +
    date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

export default function PortalConfigPage() {
  const [recipients, setRecipients] = useState<PortalRecipient[]>([]);
  const [credential, setCredential] = useState<PortalCredential | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PortalRecipient | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    Promise.all([api.portal.recipients(), api.portal.credential()])
      .then(([recs, cred]) => {
        setRecipients(recs);
        setCredential(cred);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Falha ao carregar configurações."))
      .finally(() => setLoading(false));
  }, []);

  function openNew() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(r: PortalRecipient) {
    setEditing(r);
    setShowForm(true);
  }

  async function save(payload: PortalRecipientInput) {
    try {
      if (editing) {
        const updated = await api.portal.updateRecipient(editing.id, payload);
        setRecipients((xs) => xs.map((r) => (r.id === editing.id ? updated : r)));
        toast.success("Destinatário atualizado");
      } else {
        const created = await api.portal.createRecipient(payload);
        setRecipients((xs) => [...xs, created]);
        toast.success("Destinatário cadastrado");
      }
      setShowForm(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar destinatário.");
    }
  }

  async function remove(r: PortalRecipient) {
    if (!confirm(`Remover ${r.name} dos destinatários de relatório?`)) return;
    try {
      await api.portal.removeRecipient(r.id);
      setRecipients((xs) => xs.filter((x) => x.id !== r.id));
      toast.success("Destinatário removido");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao remover destinatário.");
    }
  }

  const credentialMeta = credential ? CREDENTIAL_META[credential.status] : null;

  return (
    <div className="p-4 md:p-8 max-w-[1360px] mx-auto">
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Conta</span>
        <h1 className="font-display text-2xl md:text-3xl mt-1">
          Canais &amp; <span className="italic text-brand">Notificações</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Defina quem recebe os relatórios gerados e acompanhe sua credencial de integração.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card/60 p-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando...
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5 mb-4">
            <h3 className="text-sm font-semibold">Destinatários de relatório</h3>
            <p className="text-xs text-muted-foreground mb-4">Pessoas que recebem o relatório final de cada caso</p>

            {recipients.length === 0 ? (
              <p className="text-sm text-muted-foreground mb-4">Nenhum destinatário cadastrado.</p>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden mb-4">
                <div className="grid grid-cols-[1.2fr_1.4fr_1fr_1fr_0.9fr] gap-3 px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border bg-secondary/30">
                  <div>Nome</div>
                  <div>E-mail</div>
                  <div>Telefone</div>
                  <div>Canal preferencial</div>
                  <div />
                </div>
                {recipients.map((r) => (
                  <div
                    key={r.id}
                    className="grid grid-cols-[1.2fr_1.4fr_1fr_1fr_0.9fr] gap-3 px-4 py-3 text-sm items-center border-b border-border/60 last:border-0"
                  >
                    <div>{r.name}</div>
                    <div className="text-muted-foreground truncate">{r.email || "—"}</div>
                    <div className="text-muted-foreground">{r.phone ? maskPhone(r.phone) : "—"}</div>
                    <div>{r.preferred_channel}</div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        className="h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(r)}
                        aria-label={`Remover ${r.name}`}
                        className="h-8 px-2 rounded-lg border border-border text-muted-foreground hover:text-rose-300 hover:border-rose-500/40 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={openNew}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-brand text-brand-foreground font-semibold text-sm brand-glow"
            >
              <Plus className="size-4" /> Novo destinatário
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5">
            <h3 className="text-sm font-semibold">Credencial de API</h3>
            <p className="text-xs text-muted-foreground mb-4">Utilizada para enviar documentos automaticamente à triAIge</p>
            <div className="rounded-lg bg-secondary/40 border border-border p-4 text-sm text-muted-foreground leading-relaxed">
              Status:{" "}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] ${credentialMeta?.cls ?? ""}`}>
                {credentialMeta?.label ?? "—"}
              </span>
              {credential && credential.status !== "inexistente" ? (
                <>
                  {" · "}
                  Último uso: {fmtDate(credential.last_used)}
                  {" · "}
                  {credential.expires_at
                    ? `Expira em: ${new Date(credential.expires_at).toLocaleDateString("pt-BR")}`
                    : "Sem expiração"}
                </>
              ) : null}
              <div className="text-[11px] text-muted-foreground mt-2">
                {credential?.status === "inexistente"
                  ? "Solicite uma credencial ao suporte triAIge para integrar seu sistema."
                  : "O token de acesso não é exibido novamente após a criação, por segurança."}
              </div>
            </div>
          </div>
        </>
      )}

      {showForm && <RecipientForm initial={editing} onClose={() => setShowForm(false)} onSave={save} />}
    </div>
  );
}

function RecipientForm({
  initial,
  onClose,
  onSave,
}: {
  initial: PortalRecipient | null;
  onClose: () => void;
  onSave: (payload: PortalRecipientInput) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ? maskPhone(initial.phone) : "");
  const [channel, setChannel] = useState<RecipientChannel>(initial?.preferred_channel ?? "E-mail");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({ name, email, phone, preferred_channel: channel });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">{initial ? "Editar destinatário" : "Novo destinatário"}</h2>
          <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-3">
          <Field label="Nome">
            <input required value={name} onChange={(e) => setName(e.target.value)} className="modal-input" placeholder="Ana Ribeiro" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="E-mail">
              <input
                type="email"
                required={channel === "E-mail"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="modal-input"
                placeholder="ana@escritorio.com"
              />
            </Field>
            <Field label="Telefone">
              <input
                required={channel === "WhatsApp"}
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
          <Field label="Canal preferencial">
            <select value={channel} onChange={(e) => setChannel(e.target.value as RecipientChannel)} className="modal-input">
              {RECIPIENT_CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg border border-border text-sm">
            Cancelar
          </button>
          <button disabled={saving} className="h-10 px-4 rounded-lg bg-brand text-brand-foreground font-semibold text-sm disabled:opacity-60">
            {initial ? "Salvar" : "Cadastrar"}
          </button>
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
