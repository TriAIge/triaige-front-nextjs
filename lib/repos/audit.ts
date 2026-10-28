import type { RowDataPacket } from "mysql2";
import type { Pool } from "mysql2/promise";
import { iso } from "../http";
import { db } from "../mysql";
import { AUDIT_EVENT_TYPES, type AuditEvent, type AuditFilters, type PortalAuditEvent } from "../types";

export type Executor = Pick<Pool, "execute">;

export type BackofficeEventInput = {
  law_firm_id?: string | null;
  actor?: string | null;
  event_type: string;
  description: string;
  payload?: unknown;
};

const EVENT_LABELS = new Map(AUDIT_EVENT_TYPES.map((t) => [t.value, t.label]));
export const eventLabel = (type: string) => EVENT_LABELS.get(type) ?? type;

/** Backoffice actions only: `audit_events` belongs to the orchestrator, whose EventType enum rejects unknown values. */
export async function recordBackofficeEvent(input: BackofficeEventInput, executor: Executor = db) {
  const id = crypto.randomUUID();
  await executor.execute(
    `INSERT INTO backoffice_audit_events (id, law_firm_id, actor, event_type, description, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW(6))`,
    [id, input.law_firm_id ?? null, input.actor ?? null, input.event_type, input.description,
      input.payload === undefined ? null : JSON.stringify(input.payload)],
  );
  return id;
}

const ALL_EVENTS = `(
  SELECT id, created_at, law_firm_id, session_id, event_type, description, correlation_id, payload_json, NULL AS actor, 'orchestrator' AS source
  FROM audit_events
  UNION ALL
  SELECT id, created_at, law_firm_id, NULL, event_type, description, correlation_id, payload_json, actor, 'backoffice'
  FROM backoffice_audit_events
) e`;

export async function listAuditEvents(filters: AuditFilters & { limit: number; offset: number }) {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filters.company_id) { where.push("e.law_firm_id = ?"); params.push(filters.company_id); }
  if (filters.event_type) { where.push("e.event_type = ?"); params.push(filters.event_type); }
  if (filters.correlation_id) { where.push("e.correlation_id LIKE ?"); params.push(`%${filters.correlation_id}%`); }
  if (filters.from) { where.push("e.created_at >= ?"); params.push(new Date(filters.from)); }
  if (filters.to) { where.push("e.created_at <= ?"); params.push(new Date(filters.to)); }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT e.id, ${iso("e.created_at")} AS at, COALESCE(f.nome, '—') AS company_name, e.event_type, e.source,
       COALESCE(e.correlation_id, '') AS correlation_id, e.description, e.actor, ts.protocolo
     FROM ${ALL_EVENTS}
     LEFT JOIN law_firms f ON f.id = e.law_firm_id
     LEFT JOIN triage_sessions ts ON ts.id = e.session_id
     ${whereSql} ORDER BY e.created_at DESC LIMIT ${filters.limit} OFFSET ${filters.offset}`,
    params,
  );
  const [[count]] = await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM ${ALL_EVENTS} ${whereSql}`, params);
  const items: AuditEvent[] = rows.map((r) => ({
    id: r.id, at: r.at, company_name: r.company_name, event: eventLabel(r.event_type), event_type: r.event_type,
    source: r.source, correlation_id: r.correlation_id,
    detail: [r.protocolo, r.description, r.actor ? `por ${r.actor}` : null].filter(Boolean).join(" · "),
  }));
  return { items, total: Number(count.total) };
}

const PORTAL_DESCRIPTIONS: Record<string, (protocol: string) => string> = {
  session_created: (p) => `Caso ${p} recebido.`,
  document_uploaded: (p) => `Documento recebido para o caso ${p}.`,
  session_finalized: (p) => `Recebimento do caso ${p} concluído; documentos enviados para processamento.`,
  mcp_result_received: (p) => `Documentos do caso ${p} processados (OCR e anonimização).`,
  ai_analysis_started: (p) => `Análise do caso ${p} iniciada.`,
  ai_analysis_completed: (p) => `Relatório do caso ${p} gerado.`,
  ai_analysis_failed: (p) => `Não foi possível concluir a análise do caso ${p}. Nossa equipe foi notificada.`,
  credential_created: () => "Nova credencial de API emitida para o escritório.",
  credential_revoked: () => "Credencial de API revogada pela equipe triAIge.",
};

/** Firm-facing trail: no technical payloads, descriptions rewritten per event type. */
export async function listPortalAuditEvents(companyId: string, limit = 200): Promise<PortalAuditEvent[]> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT e.id, ${iso("e.created_at")} AS at, e.event_type, ts.protocolo
     FROM ${ALL_EVENTS} LEFT JOIN triage_sessions ts ON ts.id = e.session_id
     WHERE e.law_firm_id = ? AND e.event_type IN (${Object.keys(PORTAL_DESCRIPTIONS).map(() => "?").join(", ")})
     ORDER BY e.created_at DESC LIMIT ${Math.floor(limit)}`,
    [companyId, ...Object.keys(PORTAL_DESCRIPTIONS)],
  );
  return rows.map((r) => ({
    id: r.id, at: r.at, event: eventLabel(r.event_type),
    description: PORTAL_DESCRIPTIONS[r.event_type](r.protocolo ? `#${r.protocolo}` : ""),
  }));
}
