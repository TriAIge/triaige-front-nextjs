"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ChartCanvas } from "@/components/ChartCanvas";
import { api } from "@/lib/api-client";
import type { TechHealth } from "@/lib/types";

type Health = TechHealth;

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;
const NOT_CONFIGURED = "Integração com CloudWatch não configurada";

export default function ObservabilidadePage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    api.admin
      .techHealth()
      .then(setHealth)
      .catch((error) => {
        setUnavailable(true);
        toast.error(error instanceof Error ? error.message : "Falha ao carregar saúde técnica.");
      })
      .finally(() => setLoading(false));
  }, []);

  const pipelineChart = useMemo(
    () =>
      health
        ? {
            type: "bar" as const,
            data: {
              labels: health.pipeline.labels,
              datasets: [
                {
                  data: health.pipeline.values,
                  backgroundColor: "oklch(0.78 0.13 82)",
                  borderRadius: 5,
                  maxBarThickness: 26,
                },
              ],
            },
            options: {
              indexAxis: "y" as const,
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (c: { raw: unknown }) => `${c.raw}s` } },
              },
              scales: {
                x: {
                  grid: { color: "oklch(1 0 0 / 0.06)" },
                  ticks: { callback: (v: string | number) => `${v}s` },
                },
                y: { grid: { display: false } },
              },
            },
          }
        : null,
    [health],
  );

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Plataforma</span>
        <h1 className="font-display text-2xl md:text-3xl mt-1">
          Saúde <span className="italic text-brand">Técnica</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumo operacional. Para análise detalhada (latência, filas, erros), use o Grafana interno.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card/60 p-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando...
        </div>
      ) : unavailable || !health ? (
        <div className="rounded-xl border border-border bg-card/60 p-10 text-center">
          <div className="font-medium">Dados indisponíveis</div>
          <p className="text-sm text-muted-foreground mt-2">Não foi possível carregar a saúde técnica. Tente novamente em instantes.</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-gradient-to-br from-brand/10 via-card/60 to-secondary/40 backdrop-blur-xl p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold">Observabilidade completa no Grafana</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                Latência p95/p99, profundidade de filas SQS e erros por Lambda são consultados no Grafana, com dados do CloudWatch.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-brand text-brand-foreground font-semibold text-sm brand-glow"
              onClick={() =>
                GRAFANA_URL
                  ? window.open(GRAFANA_URL, "_blank", "noopener,noreferrer")
                  : toast.message("Defina NEXT_PUBLIC_GRAFANA_URL para liberar este atalho.")
              }
            >
              Abrir no Grafana <ExternalLink className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <HealthCard label="Uptime da API" source="CloudWatch" value={health.apiUptime} sub={health.apiUptime ? "SLA contratual: 99,9%" : NOT_CONFIGURED} good />
            <HealthCard label="Sucesso de envio (SMTP)" source="MySQL" value={health.smtpSuccess} sub={`${health.smtpFailures} falhas no período`} warn={health.smtpFailures > 0} good={health.smtpFailures === 0} />
            <HealthCard label="Latência média da API" source="CloudWatch" value={health.apiLatency} sub={health.apiLatency ? `p95: ${health.apiLatencyP95 ?? "—"}` : NOT_CONFIGURED} />
            <HealthCard label="Filas SQS" source="CloudWatch" value={health.sqsStatus} sub={health.sqsStatus ? health.sqsSub ?? "" : NOT_CONFIGURED} good />
          </div>

          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5">
            <h3 className="text-sm font-semibold">
              Tempo médio por etapa do pipeline{" "}
              <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
                MySQL · processing_steps
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Da entrada do documento ao relatório final</p>
            {health.pipeline.labels.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma etapa concluída no período.</p>
            ) : pipelineChart ? (
              <ChartCanvas config={pipelineChart} className="h-64" />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

function HealthCard({
  label,
  source,
  value,
  sub,
  good,
  warn,
}: {
  label: string;
  source: string;
  value: string | null;
  sub: string;
  good?: boolean;
  warn?: boolean;
}) {
  if (value === null) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/40 backdrop-blur-xl p-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2 flex-wrap">
          {label}
          <span className="normal-case tracking-normal text-[9px] border border-border rounded px-1.5 py-0.5">{source}</span>
        </div>
        <div className="text-lg font-display mt-1 text-muted-foreground">Não configurado</div>
        <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-4">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2 flex-wrap">
        {label}
        <span className="normal-case tracking-normal text-[9px] border border-border rounded px-1.5 py-0.5">{source}</span>
      </div>
      <div
        className={`text-2xl font-display mt-1 ${
          good ? "text-emerald-300" : warn ? "text-amber-300" : "text-brand"
        }`}
      >
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}
