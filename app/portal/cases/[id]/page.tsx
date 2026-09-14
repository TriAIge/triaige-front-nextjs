"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { PortalCaseDetail, PortalTimelineStep } from "@/lib/mock-data";
import type { CaseStatus, LegalCase } from "@/lib/types";

const STATUS_META: Record<CaseStatus, { label: string; cls: string }> = {
  recebido: { label: "Recebido", cls: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  em_validacao: { label: "Em validação", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  em_processamento: { label: "Em processamento", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  relatorio_gerado: { label: "Relatório gerado", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  enviado: { label: "Enviado", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  falha: { label: "Falha", cls: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  return (
    date.toLocaleDateString("pt-BR") +
    " " +
    date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

function fallbackDetail(row: LegalCase): PortalCaseDetail {
  const order: CaseStatus[] = ["recebido", "em_validacao", "em_processamento", "relatorio_gerado", "enviado"];
  const labels = [
    "Recebimento e validação",
    "Anonimização de dados sensíveis",
    "OCR e normalização de texto",
    "Classificação do tipo de processo",
    "Resumo estruturado e prazos",
    "Consulta de jurisprudência",
    "Geração e envio do relatório",
  ];
  const idx = Math.max(0, order.indexOf(row.status));
  const timeline: PortalTimelineStep[] = labels.map((title, i) => {
    let status: PortalTimelineStep["status"] = "pending";
    if (row.status === "falha") status = i === 0 ? "done" : i === 1 ? "running" : "pending";
    else if (i < idx + 1) status = "done";
    else if (i === idx + 1) status = "running";
    return { title, meta: status === "done" ? "Concluído" : status === "running" ? "Em andamento" : "Pendente", status };
  });
  return {
    caseId: row.id,
    protocol: row.case_code,
    area: "—",
    caseType: "—",
    criticality: "—",
    documents: [],
    delivery: null,
    timeline,
  };
}

export default function PortalCaseDetailPage() {
  const params = useParams<{ id: string }>();
  const [row, setRow] = useState<LegalCase | null>(null);
  const [detail, setDetail] = useState<PortalCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id;
    if (!id) return;
    setLoading(true);
    api.portal
      .caseDetail(id)
      .then(({ case: c, detail: d }) => {
        setRow(c);
        setDetail(d ?? fallbackDetail(c));
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Caso não encontrado."))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Carregando caso...
      </div>
    );
  }

  if (!row || !detail) {
    return (
      <div className="p-8 max-w-[1360px] mx-auto">
        <Link href="/portal/cases" className="inline-flex items-center gap-2 text-sm text-brand mb-4">
          <ArrowLeft className="size-4" /> Voltar para Meus Casos
        </Link>
        <div className="rounded-xl border border-border bg-card/60 p-10 text-center text-sm text-muted-foreground">Caso não encontrado.</div>
      </div>
    );
  }

  const meta = STATUS_META[row.status];

  return (
    <div className="p-4 md:p-8 max-w-[1360px] mx-auto">
      <Link href="/portal/cases" className="inline-flex items-center gap-2 text-sm text-brand font-medium mb-4 hover:opacity-90">
        <ArrowLeft className="size-4" /> Voltar para Meus Casos
      </Link>

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl md:text-3xl">Caso {row.case_code}</h1>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-[11px] ${meta.cls}`}>{meta.label}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Protocolo {detail.protocol} · recebido via {row.channel} em {fmtDate(row.submitted_at)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5">
          <h3 className="text-sm font-semibold">Linha do tempo do processamento</h3>
          <p className="text-xs text-muted-foreground mb-4">Da entrada do documento ao relatório final</p>
          <ol className="space-y-0">
            {detail.timeline.map((step) => (
              <li key={step.title} className="flex gap-3 py-3 border-b border-border/60 last:border-0">
                <div
                  className={`size-7 rounded-full flex items-center justify-center shrink-0 border text-xs ${
                    step.status === "done"
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : step.status === "running"
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                        : "bg-secondary/60 border-border text-muted-foreground"
                  }`}
                >
                  {step.status === "done" ? <CheckCircle2 className="size-3.5" /> : step.status === "running" ? "…" : "·"}
                </div>
                <div>
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{step.meta}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5">
            <h3 className="text-sm font-semibold mb-3">Classificação</h3>
            <div className="rounded-lg bg-secondary/40 border border-border p-3 text-sm text-muted-foreground leading-relaxed">
              <div>
                <span className="text-foreground font-medium">Área jurídica:</span> {detail.area}
              </div>
              <div>
                <span className="text-foreground font-medium">Tipo de caso:</span> {detail.caseType}
              </div>
              <div>
                <span className="text-foreground font-medium">Criticidade sugerida:</span> {detail.criticality}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5">
            <h3 className="text-sm font-semibold mb-3">Documentos do caso</h3>
            {detail.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum documento listado.</p>
            ) : (
              <div className="space-y-2">
                {detail.documents.map((doc) => (
                  <div key={doc.name} className="flex items-center justify-between gap-3 text-sm border-b border-border/50 pb-2 last:border-0">
                    <span>{doc.name}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5">
            <h3 className="text-sm font-semibold mb-3">Entrega do relatório</h3>
            {detail.delivery ? (
              <div className="rounded-lg bg-secondary/40 border border-border p-3 text-sm text-muted-foreground leading-relaxed">
                Enviado por <span className="text-foreground font-medium">{detail.delivery.channel}</span> para{" "}
                <span className="text-foreground font-medium">{detail.delivery.recipient}</span>
                <br />
                {fmtDate(detail.delivery.at)} ·{" "}
                <span className="inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                  {detail.delivery.status}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Relatório ainda não entregue.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
