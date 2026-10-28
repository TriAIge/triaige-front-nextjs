"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ChartCanvas } from "@/components/ChartCanvas";
import { api } from "@/lib/api-client";
import type { BusinessMetrics } from "@/lib/types";

type Metrics = BusinessMetrics;

export default function NegocioPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    api.admin
      .businessMetrics()
      .then(setMetrics)
      .catch((error) => {
        setUnavailable(true);
        toast.error(error instanceof Error ? error.message : "Falha ao carregar indicadores.");
      })
      .finally(() => setLoading(false));
  }, []);

  const clientsChart = useMemo(
    () =>
      metrics
        ? {
            type: "bar" as const,
            data: {
              labels: metrics.casesByOffice.labels,
              datasets: [
                {
                  data: metrics.casesByOffice.values,
                  backgroundColor: "oklch(0.78 0.13 82)",
                  borderRadius: 5,
                  maxBarThickness: 26,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                y: { grid: { color: "oklch(1 0 0 / 0.06)" }, beginAtZero: true },
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
                  backgroundColor: "oklch(0.72 0.12 250)",
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

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Operação</span>
        <h1 className="font-display text-2xl md:text-3xl mt-1">
          Indicadores de <span className="italic text-brand">Negócio</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Métricas agregadas de todos os escritórios clientes — valor entregue pela triAIge.
        </p>
      </div>

      {loading ? (
        <Loading />
      ) : unavailable || !metrics ? (
        <EmptyApi hint="Não foi possível carregar os indicadores. Tente novamente em instantes." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <MetricCard label="Casos processados" value={String(metrics.casesProcessed)} sub={`vs. ${metrics.casesProcessedPrev} no período anterior`} />
            <MetricCard label="Tempo médio de triagem" value={metrics.avgTriage} sub="Todos os escritórios" />
            <MetricCard label="Automação ponta a ponta" value={metrics.automationRate} sub="Sessões finalizadas com análise concluída" />
            <MetricCard label="Escritórios ativos" value={String(metrics.activeOffices)} sub={`${metrics.newContracts} novos contratos no período`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 mb-4">
            <Panel title="Casos por escritório cliente" sub="Top escritórios no período">
              {clientsChart ? <ChartCanvas config={clientsChart} /> : null}
            </Panel>
            <Panel title="Distribuição por área jurídica" sub="Agregado entre todos os clientes">
              {areaChart ? <ChartCanvas config={areaChart} /> : null}
            </Panel>
          </div>

          <Panel title="Volume de casos — recebidos vs. concluídos" sub="Últimos 30 dias">
            {volumeChart ? <ChartCanvas config={volumeChart} className="h-60" /> : null}
          </Panel>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-4">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
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

function Loading() {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> Carregando indicadores...
    </div>
  );
}

function EmptyApi({ hint }: { hint: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-10 text-center">
      <div className="font-medium">Dados indisponíveis</div>
      <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{hint}</p>
    </div>
  );
}
