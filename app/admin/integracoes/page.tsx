"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, KeyRound, Loader2, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { api } from "@/lib/api-client";
import type { ApiCredential, CompanySummary } from "@/lib/types";

const STATUS_META: Record<ApiCredential["status"], { label: string; cls: string }> = {
  ativa: { label: "Ativa", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  expirando: { label: "Expirando", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  expirada: { label: "Expirada", cls: "bg-secondary/60 text-muted-foreground border-border" },
  revogada: { label: "Revogada", cls: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
  inativa: { label: "Inativa", cls: "bg-secondary/60 text-muted-foreground border-border" },
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

export default function IntegracoesPage() {
  const [items, setItems] = useState<ApiCredential[]>([]);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [issued, setIssued] = useState<{ token: string; company: string } | null>(null);
  const [pendingRevoke, setPendingRevoke] = useState<ApiCredential | null>(null);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    Promise.all([api.admin.credentials(), api.clients.list()])
      .then(([credentials, clients]) => {
        setItems(credentials);
        setCompanies(clients.map(({ id, name, plan }) => ({ id, name, plan })));
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Falha ao carregar credenciais."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((c) => c.company_name.toLowerCase().includes(q) || c.credential.toLowerCase().includes(q));
  }, [items, search]);

  async function confirmRevoke() {
    if (!pendingRevoke) return;
    setRevoking(true);
    try {
      const updated = await api.admin.revokeCredential(pendingRevoke.id);
      setItems((xs) => xs.map((c) => (c.id === pendingRevoke.id ? updated : c)));
      setPendingRevoke(null);
      toast.success("Credencial revogada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao revogar.");
    } finally {
      setRevoking(false);
    }
  }

  async function create(companyId: string, name: string, expiresAt: string) {
    try {
      const { credential, token } = await api.admin.createCredential({
        company_id: companyId,
        name: name.trim() || undefined,
        expires_at: new Date(`${expiresAt}T23:59:59`).toISOString(),
      });
      setItems((xs) => [credential, ...xs]);
      setShowNew(false);
      setIssued({ token, company: credential.company_name });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao emitir credencial.");
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Plataforma</span>
          <h1 className="font-display text-2xl md:text-3xl mt-1">
            Integrações <span className="italic text-brand">&amp; API</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Credenciais de acesso de todos os escritórios clientes.</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          disabled={companies.length === 0}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-brand text-brand-foreground font-semibold text-sm brand-glow hover:opacity-95 transition disabled:opacity-50"
        >
          <Plus className="size-4" /> Nova credencial
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-3 mb-4">
        <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-secondary/60 border border-border focus-within:border-brand/60">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar escritório"
            className="w-full bg-transparent outline-none text-sm"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden">
        <div className="grid grid-cols-[1.4fr_1.2fr_0.9fr_1.1fr_1fr_0.8fr] gap-3 px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border bg-secondary/30">
          <div>Escritório</div>
          <div>Credencial</div>
          <div>Status</div>
          <div>Último uso</div>
          <div>Expira em</div>
          <div />
        </div>
        {loading ? (
          <div className="p-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Nenhuma credencial encontrada.</div>
        ) : (
          filtered.map((c) => {
            const meta = STATUS_META[c.status];
            return (
              <div
                key={c.id}
                className="grid grid-cols-[1.4fr_1.2fr_0.9fr_1.1fr_1fr_0.8fr] gap-3 px-4 py-3 text-sm items-center border-b border-border/60"
              >
                <div>{c.company_name}</div>
                <div className="font-mono text-xs">{c.credential}</div>
                <div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] ${meta.cls}`}>{meta.label}</span>
                </div>
                <div className="text-muted-foreground text-xs">{fmtDate(c.last_used)}</div>
                <div className="text-muted-foreground text-xs">
                  {c.expires_at ? new Date(c.expires_at).toLocaleDateString("pt-BR") : "Sem expiração"}
                </div>
                <div>
                  <button
                    disabled={c.status === "revogada"}
                    onClick={() => setPendingRevoke(c)}
                    className="h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition disabled:opacity-40"
                  >
                    Revogar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showNew && <NewCredentialModal companies={companies} onClose={() => setShowNew(false)} onCreate={create} />}
      {issued && <IssuedTokenModal {...issued} onClose={() => setIssued(null)} />}
      {pendingRevoke ? (
        <ConfirmDialog
          title="Revogar credencial"
          description={`Revogar a credencial de “${pendingRevoke.company_name}” (${pendingRevoke.credential})? Integrações que a utilizam deixarão de funcionar.`}
          confirmLabel="Revogar"
          busy={revoking}
          onConfirm={() => void confirmRevoke()}
          onClose={() => {
            if (!revoking) setPendingRevoke(null);
          }}
        />
      ) : null}
    </div>
  );
}

function NewCredentialModal({
  companies,
  onClose,
  onCreate,
}: {
  companies: CompanySummary[];
  onClose: () => void;
  onCreate: (companyId: string, name: string, expiresAt: string) => Promise<void>;
}) {
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [name, setName] = useState("");
  const [expiresAt, setExpiresAt] = useState(() => new Date(Date.now() + 365 * 86_400_000).toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onCreate(companyId, name, expiresAt);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">Nova credencial</h2>
          <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-3">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Escritório</span>
            <select required value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="modal-input mt-1">
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Nome (opcional)</span>
            <input
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Integração CRM"
              className="modal-input mt-1"
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Expira em</span>
            <input
              required
              type="date"
              min={new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)}
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="modal-input mt-1"
            />
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg border border-border text-sm">
            Cancelar
          </button>
          <button disabled={saving} className="h-10 px-4 rounded-lg bg-brand text-brand-foreground font-semibold text-sm disabled:opacity-60">
            Emitir credencial
          </button>
        </div>
      </form>
    </div>
  );
}

function IssuedTokenModal({ token, company, onClose }: { token: string; company: string; onClose: () => void }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(token);
      toast.success("Token copiado");
    } catch {
      toast.error("Não foi possível copiar. Selecione e copie manualmente.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="size-10 rounded-lg bg-brand/15 border border-brand/30 text-brand flex items-center justify-center">
            <KeyRound className="size-5" />
          </div>
          <div>
            <h2 className="font-display text-xl">Credencial emitida</h2>
            <p className="text-xs text-muted-foreground">{company}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Copie o token agora e envie ao escritório por um canal seguro. Ele não será exibido novamente.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 font-mono text-xs break-all rounded-lg bg-secondary/60 border border-border p-3 select-all">{token}</code>
          <button type="button" onClick={() => void copy()} className="h-10 px-3 rounded-lg border border-border hover:bg-secondary transition">
            <Copy className="size-4" />
          </button>
        </div>
        <div className="flex justify-end mt-5">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg bg-brand text-brand-foreground font-semibold text-sm">
            Já copiei
          </button>
        </div>
      </div>
    </div>
  );
}
