import type { RowDataPacket } from "mysql2";
import { db } from "../mysql";
import { CASE_STATUS_SQL, DELIVERED_SQL, FAILED_DELIVERY_SQL, PROCESSING_STEP_LABELS } from "../pipeline";
import {
  CASE_STATUS_LABELS, type BusinessMetrics, type CaseStatus, type LgpdSummary, type MetricPeriod,
  type PortalMetrics, type TechHealth,
} from "../types";

const envNumber = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const pct = (part: number, total: number) =>
  total ? `${((part / total) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "—";

function formatDuration(seconds: number | null) {
  if (seconds === null || !Number.isFinite(seconds)) return "—";
  const total = Math.round(seconds);
  if (total < 60) return `${total}s`;
  return `${Math.floor(total / 60)}min ${String(total % 60).padStart(2, "0")}s`;
}

function scope(companyId?: string) {
  return companyId ? { sql: " AND ts.law_firm_id = ?", params: [companyId] } : { sql: "", params: [] as string[] };
}

/** SQL window [now - (offset + days), now - offset) on `column`. Days are validated integers, safe to inline. */
const inWindow = (column: string, days: number, offsetDays = 0) =>
  `${column} >= NOW(6) - INTERVAL ${days + offsetDays} DAY AND ${column} < NOW(6) - INTERVAL ${offsetDays} DAY`;

/** A case is processed when the orchestrator persisted its triage_results (session ANALYSIS_COMPLETED). */
async function processedStats(days: number, offsetDays: number, companyId?: string) {
  const s = scope(companyId);
  const [[processed]] = await db.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS n, AVG(TIMESTAMPDIFF(SECOND, ts.created_at, tr.created_at)) AS avg_triage
     FROM triage_sessions ts JOIN triage_results tr ON tr.session_id = ts.id
     WHERE ${inWindow("tr.created_at", days, offsetDays)}${s.sql}`, s.params);
  const [[finished]] = await db.execute<RowDataPacket[]>(
    `SELECT SUM(ts.status = 'ANALYSIS_COMPLETED') AS ok, COUNT(*) AS total FROM triage_sessions ts
     WHERE ts.status IN ('ANALYSIS_COMPLETED', 'ANALYSIS_FAILED', 'FAILED') AND ${inWindow("ts.updated_at", days, offsetDays)}${s.sql}`, s.params);
  return {
    processed: Number(processed.n),
    avgTriageSec: processed.avg_triage === null ? null : Number(processed.avg_triage),
    automated: Number(finished.ok ?? 0),
    finished: Number(finished.total),
  };
}

async function dailyVolume(days: number, companyId?: string) {
  const s = scope(companyId);
  const [received] = await db.execute<RowDataPacket[]>(
    `SELECT DATE_FORMAT(ts.created_at, '%Y-%m-%d') AS d, COUNT(*) AS n FROM triage_sessions ts
     WHERE ts.created_at >= CURDATE() - INTERVAL ${days - 1} DAY${s.sql} GROUP BY d`, s.params);
  const [completed] = await db.execute<RowDataPacket[]>(
    `SELECT DATE_FORMAT(tr.created_at, '%Y-%m-%d') AS d, COUNT(*) AS n
     FROM triage_results tr JOIN triage_sessions ts ON ts.id = tr.session_id
     WHERE tr.created_at >= CURDATE() - INTERVAL ${days - 1} DAY${s.sql} GROUP BY d`, s.params);
  const receivedMap = new Map(received.map((r) => [r.d as string, Number(r.n)]));
  const completedMap = new Map(completed.map((r) => [r.d as string, Number(r.n)]));
  const today = new Date();
  const labels: string[] = [];
  const receivedSeries: number[] = [];
  const completedSeries: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const key = day.toISOString().slice(0, 10);
    labels.push(`${key.slice(8, 10)}/${key.slice(5, 7)}`);
    receivedSeries.push(receivedMap.get(key) ?? 0);
    completedSeries.push(completedMap.get(key) ?? 0);
  }
  return { labels, received: receivedSeries, completed: completedSeries };
}

async function casesByArea(days: number, companyId?: string) {
  const s = scope(companyId);
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT COALESCE(lc.area_juridica, 'Não informada') AS label, COUNT(*) AS n
     FROM triage_sessions ts LEFT JOIN legal_cases lc ON lc.session_id = ts.id
     WHERE ts.created_at >= NOW(6) - INTERVAL ${days} DAY${s.sql} GROUP BY label ORDER BY n DESC LIMIT 8`, s.params);
  return { labels: rows.map((r) => r.label as string), values: rows.map((r) => Number(r.n)) };
}

export async function businessMetrics(period: MetricPeriod): Promise<BusinessMetrics> {
  const [current, previous, volume, areas] = await Promise.all([
    processedStats(period, 0), processedStats(period, period), dailyVolume(period), casesByArea(period),
  ]);
  const [[offices]] = await db.query<RowDataPacket[]>(
    `SELECT SUM(UPPER(status) = 'ACTIVE') AS active, SUM(created_at >= NOW(6) - INTERVAL ${period} DAY) AS new_contracts FROM law_firms`);
  const [byOffice] = await db.query<RowDataPacket[]>(
    `SELECT f.nome AS label, COUNT(*) AS n FROM triage_sessions ts JOIN law_firms f ON f.id = ts.law_firm_id
     WHERE ts.created_at >= NOW(6) - INTERVAL ${period} DAY GROUP BY f.id, f.nome ORDER BY n DESC LIMIT 6`);
  return {
    casesProcessed: current.processed,
    casesProcessedPrev: previous.processed,
    avgTriage: formatDuration(current.avgTriageSec),
    automationRate: pct(current.automated, current.finished),
    activeOffices: Number(offices.active ?? 0),
    newContracts: Number(offices.new_contracts ?? 0),
    casesByOffice: { labels: byOffice.map((r) => r.label as string), values: byOffice.map((r) => Number(r.n)) },
    casesByArea: areas,
    volume,
  };
}

export async function portalMetrics(companyId: string, period: MetricPeriod): Promise<PortalMetrics> {
  const [current, previous, volume, areas] = await Promise.all([
    processedStats(period, 0, companyId), processedStats(period, period, companyId),
    dailyVolume(period, companyId), casesByArea(period, companyId),
  ]);
  const [statusRows] = await db.execute<RowDataPacket[]>(
    `SELECT ${CASE_STATUS_SQL} AS status, COUNT(*) AS n FROM triage_sessions ts
     WHERE ts.created_at >= NOW(6) - INTERVAL ${period} DAY AND ts.law_firm_id = ? GROUP BY 1 ORDER BY n DESC`, [companyId]);
  const manualSeconds = envNumber("MANUAL_TRIAGE_MINUTES", 15) * 60;
  const savedPerCase = Math.max(0, manualSeconds - (current.avgTriageSec ?? 0));
  const hoursSaved = (current.processed * savedPerCase) / 3600;
  return {
    casesProcessed: current.processed,
    casesProcessedPrev: previous.processed,
    avgTriage: formatDuration(current.avgTriageSec),
    automationRate: pct(current.automated, current.finished),
    hoursSaved: `${hoursSaved.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}h`,
    volume,
    statusDistribution: {
      labels: statusRows.map((r) => CASE_STATUS_LABELS[r.status as CaseStatus] ?? r.status),
      values: statusRows.map((r) => Number(r.n)),
    },
    casesByArea: areas,
  };
}

export async function techHealth(period: MetricPeriod = 30): Promise<TechHealth> {
  const [[smtp]] = await db.query<RowDataPacket[]>(
    `SELECT SUM(UPPER(status) IN ${DELIVERED_SQL}) AS ok, SUM(UPPER(status) IN ${FAILED_DELIVERY_SQL}) AS failed
     FROM notification_deliveries WHERE UPPER(canal) = 'EMAIL' AND created_at >= NOW(6) - INTERVAL ${period} DAY`);
  const [steps] = await db.query<RowDataPacket[]>(
    `SELECT step_name, AVG(TIMESTAMPDIFF(MICROSECOND, started_at, finished_at)) / 1000000 AS avg_seconds FROM processing_steps
     WHERE status = 'COMPLETED' AND started_at IS NOT NULL AND finished_at >= NOW(6) - INTERVAL ${period} DAY GROUP BY step_name`);
  const [[analysis]] = await db.query<RowDataPacket[]>(
    `SELECT AVG(TIMESTAMPDIFF(MICROSECOND, s.created_at, c.created_at)) / 1000000 AS avg_seconds
     FROM audit_events s JOIN audit_events c ON c.session_id = s.session_id AND c.event_type = 'ai_analysis_completed'
     WHERE s.event_type = 'ai_analysis_started' AND c.created_at >= NOW(6) - INTERVAL ${period} DAY`);
  const ok = Number(smtp.ok ?? 0);
  const failed = Number(smtp.failed ?? 0);
  const measured: [string, number][] = [];
  const byStep = new Map(steps.map((s) => [s.step_name as string, Number(s.avg_seconds)]));
  for (const [step, label] of PROCESSING_STEP_LABELS) if (byStep.has(step)) measured.push([label, byStep.get(step)!]);
  if (analysis.avg_seconds !== null) measured.push(["Análise IA", Number(analysis.avg_seconds)]);
  return {
    apiUptime: null,
    apiLatency: null,
    apiLatencyP95: null,
    sqsStatus: null,
    sqsSub: null,
    smtpSuccess: pct(ok, ok + failed),
    smtpFailures: failed,
    pipeline: { labels: measured.map(([label]) => label), values: measured.map(([, s]) => Math.round(s * 10) / 10) },
  };
}

/** Originals whose retention deadline passed (or that were already removed) and were deleted on time. */
export async function lgpdSummary(): Promise<LgpdSummary> {
  const [[docs]] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS due, SUM(raw_deleted_at IS NOT NULL AND raw_deleted_at <= retention_expires_at) AS removed
     FROM legal_documents
     WHERE retention_expires_at IS NOT NULL AND (raw_deleted_at IS NOT NULL OR retention_expires_at <= NOW(6))`);
  const [[incidents]] = await db.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM backoffice_audit_events WHERE event_type = 'data_incident'");
  return {
    originalsRemoved: pct(Number(docs.removed ?? 0), Number(docs.due)),
    dataIncidents: Number(incidents.n),
  };
}
