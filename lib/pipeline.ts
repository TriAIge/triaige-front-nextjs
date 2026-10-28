import type { PortalTimelineStep, RecipientChannel, SessionStatus } from "./types";

/** Portal timeline stages. `steps` are the processing_steps.step_name values aggregated into each stage. */
export const PIPELINE_STAGES = [
  { key: "recebimento", label: "Recebimento dos documentos", steps: ["document_upload", "session_finalize"] },
  { key: "ocr", label: "OCR e normalização de texto", steps: ["ocr"] },
  { key: "anonimizacao", label: "Anonimização de dados sensíveis", steps: ["anonymization"] },
  { key: "agrupamento", label: "Agrupamento de anexos", steps: ["attachment_grouping"] },
  { key: "resumo", label: "Resumo das evidências", steps: ["evidence_summarization"] },
  { key: "analise", label: "Análise jurídica por IA", steps: [] },
  { key: "entrega", label: "Envio do relatório", steps: [] },
] as const;

/** processing_steps.step_name (ProcessingStepName enum) in pipeline order, with chart labels. */
export const PROCESSING_STEP_LABELS: [string, string][] = [
  ["document_upload", "Upload"],
  ["session_finalize", "Finalização"],
  ["ocr", "OCR"],
  ["anonymization", "Anonimização"],
  ["attachment_grouping", "Agrupamento"],
  ["evidence_summarization", "Resumo"],
];

/** notification_deliveries.status values written by the notification service that count as delivered / failed. */
export const DELIVERED_STATUSES = ["SENT", "DELIVERED", "SUCCESS"];
export const FAILED_DELIVERY_STATUSES = ["FAILED", "ERROR", "BOUNCED"];
const sqlList = (values: string[]) => values.map((v) => `'${v}'`).join(", ");
export const DELIVERED_SQL = `(${sqlList(DELIVERED_STATUSES)})`;
export const FAILED_DELIVERY_SQL = `(${sqlList(FAILED_DELIVERY_STATUSES)})`;

/** SQL expression mapping a triage_sessions row (alias `ts`) to the front CaseStatus. */
export const CASE_STATUS_SQL = `CASE
  WHEN ts.status = 'RECEIVING_DOCUMENTS' THEN 'recebido'
  WHEN ts.status IN ('FAILED', 'ANALYSIS_FAILED', 'CANCELLED') THEN 'falha'
  WHEN ts.status = 'ANALYSIS_COMPLETED' AND EXISTS (
    SELECT 1 FROM notification_deliveries nd WHERE nd.session_id = ts.id AND UPPER(nd.status) IN ${DELIVERED_SQL}
  ) THEN 'enviado'
  WHEN ts.status = 'ANALYSIS_COMPLETED' THEN 'relatorio_gerado'
  ELSE 'em_processamento' END`;

export type DeliveryState = "entregue" | "falha" | "pendente";

export function deliveryState(status: string): DeliveryState {
  const value = status.toUpperCase();
  if (DELIVERED_STATUSES.includes(value)) return "entregue";
  if (FAILED_DELIVERY_STATUSES.includes(value)) return "falha";
  return "pendente";
}

export const DELIVERY_STATE_LABELS: Record<DeliveryState, string> = { entregue: "Entregue", falha: "Falha", pendente: "Pendente" };

const RECIPIENT_CODES: Record<RecipientChannel, string> = { "E-mail": "EMAIL", WhatsApp: "WHATSAPP", CRM: "CRM" };
export const recipientChannelCode = (channel: RecipientChannel) => RECIPIENT_CODES[channel];
export function recipientChannelLabel(code: string): RecipientChannel {
  const found = (Object.keys(RECIPIENT_CODES) as RecipientChannel[]).find((label) => RECIPIENT_CODES[label] === code.toUpperCase());
  return found ?? "E-mail";
}

export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  PENDING_UPLOAD: "Aguardando upload",
  RECEIVED: "Recebido",
  QUEUED: "Na fila",
  UPLOAD_FAILED: "Falha no upload",
  OCR_IN_PROGRESS: "OCR em andamento",
  OCR_DONE: "OCR concluído",
  ANONYMIZED: "Anonimizado",
  GROUPED: "Agrupado",
  TRUSTED: "Processado",
  OCR_FAILED: "Falha no OCR",
  PROCESSING_FAILED: "Falha no processamento",
};

type StageStatus = PortalTimelineStep["status"];
const STAGE_META: Record<StageStatus, string> = { done: "Concluído", running: "Em andamento", pending: "Pendente", failed: "Falhou" };

/** Furthest stage reached per session status: [done stages, state of the next stage]. */
function progressFromStatus(status: SessionStatus, delivered: boolean): [number, StageStatus] {
  switch (status) {
    case "RECEIVING_DOCUMENTS": return [0, "running"];
    case "QUEUED_FOR_PROCESSING": return [1, "running"];
    case "FAILED": return [1, "failed"];
    case "CANCELLED": return [0, "failed"];
    case "COMPLETED":
    case "PARTIALLY_COMPLETED":
    case "ANALYZING": return [5, "running"];
    case "ANALYSIS_FAILED": return [5, "failed"];
    case "ANALYSIS_COMPLETED": return delivered ? [7, "done"] : [6, "running"];
  }
}

export type StepRow = { step_name: string; status: string; started_at: string | null; finished_at: string | null };
export type StageTimes = { status?: StageStatus; started_at?: string | null; finished_at?: string | null };

function aggregate(rows: StepRow[]): StageTimes | null {
  if (!rows.length) return null;
  const statuses = rows.map((r) => r.status.toUpperCase());
  let status: StageStatus = "pending";
  if (statuses.includes("FAILED")) status = "failed";
  else if (statuses.every((s) => s === "COMPLETED")) status = "done";
  else if (statuses.some((s) => s === "IN_PROGRESS" || s === "COMPLETED")) status = "running";
  const starts = rows.map((r) => r.started_at).filter((v): v is string => Boolean(v)).sort();
  const ends = rows.map((r) => r.finished_at).filter((v): v is string => Boolean(v)).sort();
  return { status, started_at: starts[0] ?? null, finished_at: status === "done" ? ends.at(-1) ?? null : null };
}

/**
 * Timeline from the session status, refined with processing_steps rows, AI analysis events and
 * the delivery when they exist (steps may be missing when the mcp-ai writes to its own database).
 */
export function buildTimeline(input: {
  status: SessionStatus;
  delivered: boolean;
  steps?: StepRow[];
  analysis?: StageTimes;
  delivery?: StageTimes;
}): PortalTimelineStep[] {
  const [doneCount, nextStatus] = progressFromStatus(input.status, input.delivered);
  return PIPELINE_STAGES.map((stage, i) => {
    let status: StageStatus = i < doneCount ? "done" : i === doneCount ? nextStatus : "pending";
    let times: StageTimes = {};
    const fromSteps = stage.steps.length
      ? aggregate((input.steps ?? []).filter((r) => (stage.steps as readonly string[]).includes(r.step_name)))
      : null;
    const override = fromSteps ?? (stage.key === "analise" ? input.analysis : stage.key === "entrega" ? input.delivery : null);
    if (override) {
      times = override;
      const stillReceiving = stage.key === "recebimento" && input.status === "RECEIVING_DOCUMENTS";
      if (override.status && !stillReceiving) status = override.status;
    }
    return { title: stage.label, status, meta: STAGE_META[status], started_at: times.started_at ?? null, finished_at: times.finished_at ?? null };
  });
}

export function maskRecipient(recipient: string) {
  const at = recipient.indexOf("@");
  if (at > 0) return `${recipient.slice(0, Math.min(3, at))}***${recipient.slice(at)}`;
  const digits = recipient.replace(/\D/g, "");
  if (digits.length >= 8) return `•••${digits.slice(-4)}`;
  return recipient;
}
