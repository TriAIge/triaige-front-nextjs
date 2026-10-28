"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ChartCanvas } from "@/components/ChartCanvas";
import { api } from "@/lib/api-client";
import type { MetricPeriod, PortalMetrics } from "@/lib/types";

type Metrics = PortalMetrics;
type Period = "7" | "30" | "90";

export default function PortalIndicadoresPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [period, setPeriod] = useState<Period>("30");

  useEffect(() => {
    setLoading(true);
    setUnavailable(false);
    api.portal
      .metrics(Number(period) as MetricPeriod)
      .then(setMetrics)
      .catch((error) => {
        setUnavailable(true);
        toast.error(error instanceof Error ? error.message : "Falha ao carregar indicadores.");
      })
      .finally(() => setLoading(false));
  }, [period]);

  const volumeChart = useMemo(
    () =>
      metrics
        ? {
            type: "line" as const,
            data: {
              labels: metrics.volume.labels,
              datasets: [
                {
                  label: "Recebidos",
                  data: metrics.volume.received,
                  borderColor: "oklch(0.72 0.12 250)",
                  backgroundColor: "oklch(0.72 0.12 250 / 0.12)",
                  fill: true,
                  tension: 0.35,
                  pointRadius: 0,
                  borderWidth: 2.5,
                },
                {
                  label: "Concluídos",
                  data: metrics.volume.completed,
                  borderColor: "oklch(0.78 0.14 155)",
                  backgroundColor: "oklch(0.78 0.14 155 / 0.08)",
                  fill: true,
                  tension: 0.35,
                  pointRadius: 0,
                  borderWidth: 2.5,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "bottom" as const, labels: { boxWidth: 8, font: { size: 11 } } } },
              scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                y: { grid: { color: "oklch(1 0 0 / 0.06)" }, beginAtZero: true },
              },
            },
          }
        : null,
    [metrics],
  );

  const statusChart = useMemo(
    () =>
      metrics
        ? {
            type: "doughnut" as const,
            data: {
              labels: metrics.statusDistribution.labels,
              datasets: [
                {
                  data: metrics.statusDistribution.values,
                  backgroundColor: [
                    "oklch(0.78 0.14 155)",
                    "oklch(0.78 0.13 75)",
                    "oklch(0.72 0.12 250)",
                    "oklch(0.65 0.22 25)",
                    "oklch(0.55 0.04 270)",
                  ],
                  borderColor: "oklch(0.23 0.07 270)",
                  borderWidth: 3,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: "68%",
              plugins: {
                legend: { position: "right" as const, labels: { boxWidth: 8, font: { size: 10.5 }, padding: 10 } },
              },
            },
          }
        : null,
    [metrics],
  );

  const areaChart = useMemo(
    () =>
      metrics
        ? {
            type: "bar" as const,
            data: {
              labels: metrics.casesByArea.labels,
              datasets: [
                {
                  data: metrics.casesByArea.values,
                  backgroundColor: "oklch(0.78 0.13 82)",
                  borderRadius: 5,
                  maxBarThickness: 30,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false } },
                y: { grid: { color: "oklch(1 0 0 / 0.06)" }, beginAtZero: true },
              },
            },
          }
        : null,
    [metrics],
  );

  return (
    <div className="p-4 md:p-8 max-w-[1360px] mx-auto">
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Operação</span>
        <h1 className="font-display text-2xl md:text-3xl mt-1">
          Indicadores &amp; <span className="italic text-brand">Produtividade</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Métricas que mostram o impacto da triAIge na operação do seu escritório.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-3 mb-4 inline-flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Período</span>
        <div className="flex gap-1 p-1 rounded-lg bg-secondary/60 border border-border">
          {(["7", "30", "90"] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`h-8 px-3 rounded-md text-xs font-medium transition ${
                period === p ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p} dias
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card/60 p-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando...
        </div>
      ) : unavailable || !metrics ? (
        <div className="rounded-xl border border-border bg-card/60 p-10 text-center">
          <div className="font-medium">Dados indisponíveis</div>
          <p className="text-sm text-muted-foreground mt-2">Não foi possível carregar os indicadores. Tente novamente em instantes.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <MetricCard label="Casos processados" value={String(metrics.casesProcessed)} sub={`vs. ${metrics.casesProcessedPrev} no período anterior`} />
            <MetricCard label="Tempo médio de triagem" value={metrics.avgTriage} sub="Recebimento → relatório gerado" />
            <MetricCard label="Automação ponta a ponta" value={metrics.automationRate} sub="Casos concluídos sem reprocessamento" />
            <MetricCard
              label="Horas economizadas"
              value={metrics.hoursSaved}
              sub="Base: tempo manual médio de referência"
              tag="estimado"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 mb-4">
            <Panel title="Volume de casos — recebidos vs. concluídos" sub={`Últimos ${period} dias`}>
              {volumeChart ? <ChartCanvas config={volumeChart} /> : null}
            </Panel>
            <Panel title="Distribuição por status" sub="Casos no período selecionado">
              {statusChart ? <ChartCanvas config={statusChart} /> : null}
            </Panel>
          </div>

          <Panel title="Distribuição por área jurídica" sub="Onde a triAIge está atuando nos seus casos">
            {areaChart ? <ChartCanvas config={areaChart} className="h-60" /> : null}
          </Panel>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value, sub, tag }: { label: string; value: string; sub: string; tag?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-4">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
        {label}
        {tag ? (
          <span className="normal-case tracking-normal text-[9px] border border-brand/30 bg-brand/10 text-brand rounded px-1.5 py-0.5">
            {tag}
          </span>
        ) : null}
      </div>
      <div className="text-2xl font-display mt-1 text-brand">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}

function Panel({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-xs text-muted-foreground mb-4">{sub}</p>
      {children}
    </div>
  );
}
