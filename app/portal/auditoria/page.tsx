"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { PortalAuditEvent } from "@/lib/types";

function fmtDate(d: string) {
  const date = new Date(d);
  return (
    date.toLocaleDateString("pt-BR") +
    " " +
    date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

export default function PortalAuditoriaPage() {
  const [items, setItems] = useState<PortalAuditEvent[]>([]);
  const [firmName, setFirmName] = useState("seu escritório");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.portal.audit(), api.portal.session()])
      .then(([events, session]) => {
        setItems(events);
        setFirmName(session.firmName);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Falha ao carregar auditoria."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-[1360px] mx-auto">
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Conta</span>
        <h1 className="font-display text-2xl md:text-3xl mt-1">
          <span className="italic text-brand">Auditoria</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Histórico de eventos relacionados aos casos do seu escritório.</p>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-4 text-xs text-muted-foreground mb-4">
        Exibindo apenas eventos do escritório {firmName}. Detalhes técnicos internos não são exibidos nesta visão.
      </div>

      <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_1.2fr_2fr] gap-3 px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border bg-secondary/30">
          <div>Data</div>
          <div>Evento</div>
          <div>Descrição</div>
        </div>
        {loading ? (
          <div className="p-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando...
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Nenhum evento encontrado.</div>
        ) : (
          items.map((e) => (
            <div key={e.id} className="grid grid-cols-[1fr_1.2fr_2fr] gap-3 px-4 py-3 text-sm items-center border-b border-border/60">
              <div className="text-muted-foreground text-xs">{fmtDate(e.at)}</div>
              <div>{e.event}</div>
              <div className="text-muted-foreground">{e.description}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
