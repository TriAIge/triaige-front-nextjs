import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getCase } from "../db";
import { iso } from "../http";
import { db } from "../mysql";
import { getReportJson } from "../s3";
import {
  buildTimeline, DELIVERED_SQL, DELIVERY_STATE_LABELS, deliveryState, DOCUMENT_STATUS_LABELS, maskRecipient,
  recipientChannelCode, recipientChannelLabel, type StageTimes, type StepRow,
} from "../pipeline";
import type { LegalCase, PortalCaseDetail, PortalRecipient, PortalRecipientInput } from "../types";

const DELIVERY_CHANNEL_LABELS: Record<string, string> = { EMAIL: "e-mail", WHATSAPP: "WhatsApp", CRM: "CRM" };

async function analysisTimes(sessionId: string): Promise<StageTimes | undefined> {
  const [events] = await db.execute<RowDataPacket[]>(
    `SELECT event_type, ${iso("created_at")} AS at FROM audit_events
     WHERE session_id = ? AND event_type IN ('ai_analysis_started', 'ai_analysis_completed', 'ai_analysis_failed')
     ORDER BY created_at`, [sessionId]);
  if (!events.length) return undefined;
  const started = events.find((e) => e.event_type === "ai_analysis_started")?.at ?? null;
  const last = events.at(-1)!;
  if (last.event_type === "ai_analysis_completed") return { status: "done", started_at: started, finished_at: last.at };
  if (last.event_type === "ai_analysis_failed") return { status: "failed", started_at: started, finished_at: last.at };
  return { status: "running", started_at: started };
}

/** Subset of the mcp-ai `relatorioEstruturado` (schemaVersion 2.0) stored at `<law_firm_id>/<session_id>/relatorio.json`. */
interface StructuredReport {
  areaJuridica?: string | null;
  tipoCaso?: string | null;
  resumoExecutivo?: string | null;
  avaliacaoCriticidade?: { criticidade?: { nivel?: string | null } | null } | null;
  controleDePrazos?: { prazoFatalEstimado?: string | null } | null;
}

async function loadReport(sessionId: string): Promise<StructuredReport | null> {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT result_bucket, result_object_key FROM triage_results WHERE session_id = ? LIMIT 1", [sessionId]);
  const result = rows[0];
  if (!result) return null;
  try {
    return await getReportJson<StructuredReport>(result.result_bucket, result.result_object_key);
  } catch (error) {
    console.error(`[portal] failed to read report s3://${result.result_bucket}/${result.result_object_key}`, error);
    return null;
  }
}

const text = (value: string | null | undefined) => (typeof value === "string" && value.trim() ? value.trim() : null);

function formatDeadline(value: string | null | undefined): string | null {
  const raw = text(value);
  const match = raw?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : raw;
}

function formatLevel(value: string | null | undefined): string | null {
  const raw = text(value);
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() : null;
}

export async function getPortalCaseDetail(companyId: string, caseId: string): Promise<{ case: LegalCase; detail: PortalCaseDetail } | null> {
  const row = await getCase(caseId, companyId);
  if (!row) return null;

  const [[steps], [documents], [deliveries], analysis, report] = await Promise.all([
    db.execute<RowDataPacket[]>(
      `SELECT step_name, status, ${iso("started_at")} AS started_at, ${iso("finished_at")} AS finished_at
       FROM processing_steps WHERE session_id = ?`, [caseId]),
    db.execute<RowDataPacket[]>(
      "SELECT nome_arquivo_original AS name, status FROM legal_documents WHERE session_id = ? ORDER BY created_at, part_number", [caseId]),
    db.execute<RowDataPacket[]>(
      `SELECT canal, destino, status, ${iso("COALESCE(sent_at, updated_at)")} AS at FROM notification_deliveries
       WHERE session_id = ? ORDER BY UPPER(status) IN ${DELIVERED_SQL} DESC, created_at DESC LIMIT 1`, [caseId]),
    analysisTimes(caseId),
    loadReport(caseId),
  ]);

  const latest = deliveries[0];
  const state = latest ? deliveryState(latest.status) : null;
  const timeline = buildTimeline({
    status: row.pipeline_status,
    delivered: row.status === "enviado",
    steps: steps as StepRow[],
    analysis,
    delivery: latest && state
      ? { status: state === "entregue" ? "done" : state === "falha" ? "failed" : "running", finished_at: state === "entregue" ? latest.at : null }
      : undefined,
  });

  return {
    case: row,
    detail: {
      caseId: row.id,
      protocol: row.protocol,
      title: row.title ?? "—",
      area: row.area ?? text(report?.areaJuridica) ?? "—",
      caseType: row.case_type ?? text(report?.tipoCaso) ?? "—",
      criticality: formatLevel(report?.avaliacaoCriticidade?.criticidade?.nivel) ?? "—",
      deadline: formatDeadline(report?.controleDePrazos?.prazoFatalEstimado) ?? "—",
      summary: text(report?.resumoExecutivo),
      documents: documents.map((d) => ({ name: d.name, status: DOCUMENT_STATUS_LABELS[d.status] ?? d.status })),
      delivery: latest && state
        ? {
            channel: DELIVERY_CHANNEL_LABELS[String(latest.canal).toUpperCase()] ?? latest.canal,
            recipient: maskRecipient(latest.destino),
            at: latest.at,
            status: DELIVERY_STATE_LABELS[state],
          }
        : null,
      timeline,
    },
  };
}

const RECIPIENT_SELECT = `SELECT id, nome AS name, COALESCE(email, '') AS email, COALESCE(telefone, '') AS phone, canal_preferencial
  FROM law_firm_contacts`;

const mapRecipient = (row: RowDataPacket): PortalRecipient => ({
  id: row.id, name: row.name, email: row.email, phone: row.phone, preferred_channel: recipientChannelLabel(row.canal_preferencial),
});

export async function listRecipients(companyId: string): Promise<PortalRecipient[]> {
  const [rows] = await db.execute<RowDataPacket[]>(`${RECIPIENT_SELECT} WHERE law_firm_id = ? AND ativo = 1 ORDER BY created_at`, [companyId]);
  return rows.map(mapRecipient);
}

async function getRecipient(companyId: string, id: string): Promise<PortalRecipient | null> {
  const [rows] = await db.execute<RowDataPacket[]>(`${RECIPIENT_SELECT} WHERE law_firm_id = ? AND id = ? AND ativo = 1 LIMIT 1`, [companyId, id]);
  return rows[0] ? mapRecipient(rows[0]) : null;
}

export async function createRecipient(companyId: string, input: PortalRecipientInput): Promise<PortalRecipient> {
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO law_firm_contacts (id, law_firm_id, nome, email, telefone, canal_preferencial, ativo, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, NOW(6), NOW(6))`,
    [id, companyId, input.name, input.email || null, input.phone || null, recipientChannelCode(input.preferred_channel)]);
  return (await getRecipient(companyId, id))!;
}

const RECIPIENT_COLUMNS = { name: "nome", email: "email", phone: "telefone", preferred_channel: "canal_preferencial" } as const;

export async function updateRecipient(companyId: string, id: string, input: Partial<PortalRecipientInput>): Promise<PortalRecipient | null> {
  const fields = (Object.keys(RECIPIENT_COLUMNS) as (keyof PortalRecipientInput)[]).filter((field) => input[field] !== undefined);
  if (fields.length) {
    const value = (field: keyof PortalRecipientInput) =>
      field === "preferred_channel" ? recipientChannelCode(input.preferred_channel!) : input[field] || null;
    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE law_firm_contacts SET ${fields.map((f) => `\`${RECIPIENT_COLUMNS[f]}\` = ?`).join(", ")}, updated_at = NOW(6)
       WHERE law_firm_id = ? AND id = ? AND ativo = 1`,
      [...fields.map(value), companyId, id]);
    if (!result.affectedRows) return null;
  }
  return getRecipient(companyId, id);
}

/** notification_recipients keeps its own copy of the contact (contact_id is SET NULL on delete). */
export async function deleteRecipient(companyId: string, id: string): Promise<boolean> {
  const [result] = await db.execute<ResultSetHeader>("DELETE FROM law_firm_contacts WHERE law_firm_id = ? AND id = ?", [companyId, id]);
  return result.affectedRows > 0;
}
