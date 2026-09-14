"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { PortalRecipient } from "@/lib/mock-data";

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
  const [credential, setCredential] = useState<{ status: string; last_used: string; expires_at: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.portal.recipients(), api.portal.credential()])
      .then(([recs, cred]) => {
        setRecipients(recs);
        setCredential(cred);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Falha ao carregar configurações."))
      .finally(() => setLoading(false));
  }, []);

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
              <p className="text-sm text-muted-foreground mb-4">
                {api.useMockData ? "Nenhum destinatário cadastrado." : "Sem API de destinatários ainda. Ative o mock para ver dados de demonstração."}
              </p>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden mb-4">
                <div className="grid grid-cols-[1.2fr_1.4fr_1fr_1fr_0.7fr] gap-3 px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border bg-secondary/30">
                  <div>Nome</div>
                  <div>E-mail</div>
                  <div>Telefone</div>
                  <div>Canal preferencial</div>
                  <div />
                </div>
                {recipients.map((r) => (
                  <div
                    key={r.id}
                    className="grid grid-cols-[1.2fr_1.4fr_1fr_1fr_0.7fr] gap-3 px-4 py-3 text-sm items-center border-b border-border/60 last:border-0"
                  >
                    <div>{r.name}</div>
                    <div className="text-muted-foreground truncate">{r.email}</div>
                    <div className="text-muted-foreground">{r.phone}</div>
                    <div>{r.preferred_channel}</div>
                    <div>
                      <button
                        type="button"
                        onClick={() => toast.message("Edição de destinatários disponível na próxima iteração.")}
                        className="h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => toast.message("Cadastro de destinatários disponível na próxima iteração.")}
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
              <span className="inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                {credential?.status === "ativa" ? "Ativa" : credential?.status ?? "—"}
              </span>
              {" · "}
              Último uso: {fmtDate(credential?.last_used ?? "")}
              {" · "}
              Expira em:{" "}
              {credential?.expires_at
                ? new Date(credential.expires_at).toLocaleDateString("pt-BR")
                : "—"}
              <div className="text-[11px] text-muted-foreground mt-2">
                O token de acesso não é exibido novamente após a criação, por segurança.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
