import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { generateApiKey, hashApiKey } from "../api-keys";
import { iso } from "../http";
import { db, withTransaction } from "../mysql";
import type { ApiCredential, PortalCredential } from "../types";
import { recordBackofficeEvent } from "./audit";

const EXPIRING_WINDOW_DAYS = 30;
const PREFIX_LENGTH = 12;

/** api_credentials.status is the orchestrator's CredentialStatus enum (ACTIVE, INACTIVE, REVOKED); expires_at NULL never expires. */
const STATUS_SQL = `CASE
  WHEN k.status = 'REVOKED' THEN 'revogada'
  WHEN k.status <> 'ACTIVE' THEN 'inativa'
  WHEN k.expires_at IS NOT NULL AND k.expires_at <= NOW(6) THEN 'expirada'
  WHEN k.expires_at IS NOT NULL AND k.expires_at <= NOW(6) + INTERVAL ${EXPIRING_WINDOW_DAYS} DAY THEN 'expirando'
  ELSE 'ativa' END`;

const CREDENTIAL_SELECT = `SELECT k.id, k.law_firm_id AS company_id, f.nome AS company_name,
  COALESCE(CONCAT(k.key_prefix, '…'), k.name) AS credential, ${STATUS_SQL} AS status,
  COALESCE(${iso("k.last_used_at")}, '') AS last_used, COALESCE(${iso("k.expires_at")}, '') AS expires_at
  FROM api_credentials k JOIN law_firms f ON f.id = k.law_firm_id`;

export async function listCredentials(): Promise<ApiCredential[]> {
  const [rows] = await db.query<RowDataPacket[]>(`${CREDENTIAL_SELECT} ORDER BY k.created_at DESC`);
  return rows as ApiCredential[];
}

async function getCredential(id: string): Promise<ApiCredential | null> {
  const [rows] = await db.execute<RowDataPacket[]>(`${CREDENTIAL_SELECT} WHERE k.id = ? LIMIT 1`, [id]);
  return (rows[0] as ApiCredential) ?? null;
}

export async function createCredential(
  companyId: string, input: { name: string; expiresAt: Date | null }, actor: string,
): Promise<{ credential: ApiCredential; token: string }> {
  const id = crypto.randomUUID();
  const token = generateApiKey();
  const prefix = token.slice(0, PREFIX_LENGTH);
  await withTransaction(async (conn) => {
    await conn.execute(
      `INSERT INTO api_credentials (id, law_firm_id, name, token_hash, status, last_used_at, expires_at, created_at, updated_at, key_prefix)
       VALUES (?, ?, ?, ?, 'ACTIVE', NULL, ?, NOW(6), NOW(6), ?)`,
      [id, companyId, input.name, hashApiKey(token), input.expiresAt, prefix]);
    await recordBackofficeEvent({
      law_firm_id: companyId, actor, event_type: "credential_created",
      description: "Nova credencial de API emitida para o escritório.", payload: { credential_id: id, prefix },
    }, conn);
  });
  return { credential: (await getCredential(id))!, token };
}

export async function revokeCredential(id: string, actor: string): Promise<ApiCredential | null> {
  const found = await withTransaction(async (conn) => {
    const [rows] = await conn.execute<RowDataPacket[]>(
      "SELECT law_firm_id, COALESCE(key_prefix, name) AS label FROM api_credentials WHERE id = ? FOR UPDATE", [id]);
    if (!rows[0]) return false;
    const [result] = await conn.execute<ResultSetHeader>(
      "UPDATE api_credentials SET status = 'REVOKED', updated_at = NOW(6) WHERE id = ? AND status <> 'REVOKED'", [id]);
    if (result.affectedRows) {
      await recordBackofficeEvent({
        law_firm_id: rows[0].law_firm_id, actor, event_type: "credential_revoked",
        description: "Credencial de API revogada pela equipe triAIge.", payload: { credential_id: id, credential: rows[0].label },
      }, conn);
    }
    return true;
  });
  return found ? getCredential(id) : null;
}

export async function getCompanyCredential(companyId: string): Promise<PortalCredential> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `${CREDENTIAL_SELECT} WHERE k.law_firm_id = ?
     ORDER BY (k.status = 'ACTIVE' AND (k.expires_at IS NULL OR k.expires_at > NOW(6))) DESC, k.created_at DESC LIMIT 1`, [companyId]);
  const row = rows[0];
  if (!row) return { status: "inexistente", last_used: "", expires_at: "" };
  return { status: row.status, last_used: row.last_used, expires_at: row.expires_at };
}
