"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { ApiCredential } from "@/lib/mock-data";

const STATUS_META: Record<ApiCredential["status"], { label: string; cls: string }> = {
  ativa: { label: "Ativa", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  expirando: { label: "Expirando", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  revogada: { label: "Revogada", cls: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
};

function fmtDate(d: string) {
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.admin
      .credentials()
      .then(setItems)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Falha ao carregar credenciais."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((c) => c.company_name.toLowerCase().includes(q) || c.credential.toLowerCase().includes(q));
  }, [items, search]);

  async function revoke(id: string) {
    if (!confirm("Revogar esta credencial?")) return;
    try {
      const updated = await api.admin.revokeCredential(id);
      setItems((xs) => xs.map((c) => (c.id === id ? updated : c)));
      toast.success("Credencial revogada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao revogar.");
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Plataforma</span>
        <h1 className="font-display text-2xl md:text-3xl mt-1">
          Integrações <span className="italic text-brand">&amp; API</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Credenciais de acesso de todos os escritórios clientes.</p>
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
          <div className="p-10 text-center text-sm text-muted-foreground">
            {api.useMockData
              ? "Nenhuma credencial encontrada."
              : "Sem API de credenciais ainda. Ative NEXT_PUBLIC_USE_MOCK_DATA=true para ver o mock."}
          </div>
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
                  {new Date(c.expires_at).toLocaleDateString("pt-BR")}
                </div>
                <div>
                  <button
                    disabled={c.status === "revogada"}
                    onClick={() => void revoke(c.id)}
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
    </div>
  );
}
