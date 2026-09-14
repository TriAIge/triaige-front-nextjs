"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { MOCK_LGPD } from "@/lib/mock-data";

type Lgpd = typeof MOCK_LGPD;

export default function LgpdPage() {
  const [data, setData] = useState<Lgpd | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin
      .lgpd()
      .then(setData)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Falha ao carregar LGPD."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Plataforma</span>
        <h1 className="font-display text-2xl md:text-3xl mt-1">
          Conformidade / <span className="italic text-brand">LGPD</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Indicadores objetivos de aderência à Lei Geral de Proteção de Dados.
        </p>
      </div>

      {loading || !data ? (
        <div className="rounded-xl border border-border bg-card/60 p-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Documentos originais removidos</div>
              <div className="text-3xl font-display mt-2 text-emerald-300">{data.originalsRemoved}</div>
              <div className="text-[11px] text-muted-foreground mt-1">Dentro do prazo de retenção</div>
            </div>
            <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Incidentes de exposição de dados</div>
              <div className="text-3xl font-display mt-2 text-emerald-300">{data.dataIncidents}</div>
              <div className="text-[11px] text-muted-foreground mt-1">Meta: zero incidentes</div>
            </div>
          </div>
          <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-4 text-xs text-muted-foreground">
            Indicador de incidentes depende de padronização do tipo de evento em Logs &amp; Auditoria
            {!api.useMockData ? " · valores placeholder sem mock ativo." : "."}
          </div>
        </>
      )}
    </div>
  );
}
