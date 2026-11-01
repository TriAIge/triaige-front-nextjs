import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { iso } from "./http";
import { db, withTransaction } from "./mysql";
import { hashPassword } from "./password";
import { CASE_STATUS_SQL } from "./pipeline";
import { recordBackofficeEvent, type Executor } from "./repos/audit";
import type { Company, CompanyLifecycle, FirmUser, LegalCase, StaffRole, StaffUser, UserRole } from "./types";
import { STAFF_ROLES } from "./types";

type CompanyInput = Omit<Company, "id" | "created_at" | "cases_count">;
export type UserRow = RowDataPacket & {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  company_id: string | null;
  job_title: string | null;
  active: number | boolean;
  must_change_password: number | boolean;
};

/** law_firms.status values (free VARCHAR in the shared schema; the canonical seed uses ACTIVE). */
const LIFECYCLE_TO_STATUS: Record<CompanyLifecycle, string> = { ativa: "ACTIVE", onboarding: "ONBOARDING", inativa: "INACTIVE" };
const LIFECYCLE_SQL = "CASE UPPER(f.status) WHEN 'ONBOARDING' THEN 'onboarding' WHEN 'INACTIVE' THEN 'inativa' ELSE 'ativa' END";

const COMPANY_SELECT = `SELECT f.id, f.nome AS name, f.cnpj, f.email_contato AS contact_email, f.telefone AS contact_phone,
  COALESCE(f.plano, '') AS plan, f.observacoes AS notes, ${LIFECYCLE_SQL} AS lifecycle_status,
  ${iso("f.created_at")} AS created_at, COUNT(ts.id) AS cases_count,
  (SELECT COUNT(*) FROM app_users u WHERE u.law_firm_id = f.id AND u.role = 'firm_user' AND u.ativo = 1) AS users_count
  FROM law_firms f LEFT JOIN triage_sessions ts ON ts.law_firm_id = f.id`;

/** Column of law_firms for each editable Company field. */
const COMPANY_COLUMNS: Record<keyof CompanyInput, string> = {
  name: "nome", cnpj: "cnpj", contact_email: "email_contato", contact_phone: "telefone",
  plan: "plano", notes: "observacoes", lifecycle_status: "status",
};

const normalizeCnpj = (cnpj: string | null | undefined) => (cnpj ? cnpj.replace(/\D/g, "") || null : null);

function companyValue(field: keyof CompanyInput, input: Partial<CompanyInput>) {
  if (field === "lifecycle_status") return LIFECYCLE_TO_STATUS[input.lifecycle_status ?? "ativa"];
  if (field === "cnpj") return normalizeCnpj(input.cnpj);
  return input[field] ?? null;
}

const mapCompany = (row: RowDataPacket) => ({
  ...row,
  cases_count: Number(row.cases_count),
  users_count: Number(row.users_count ?? 0),
} as Company);

export async function listCompanies(): Promise<Company[]> {
  const [rows] = await db.query<RowDataPacket[]>(`${COMPANY_SELECT} GROUP BY f.id ORDER BY f.created_at DESC`);
  return rows.map(mapCompany);
}

export async function getCompany(id: string): Promise<Company | null> {
  const [rows] = await db.execute<RowDataPacket[]>(`${COMPANY_SELECT} WHERE f.id = ? GROUP BY f.id LIMIT 1`, [id]);
  return rows[0] ? mapCompany(rows[0]) : null;
}

export async function createCompany(input: CompanyInput, actor: string | null, executor: Executor = db): Promise<string> {
  const id = crypto.randomUUID();
  await executor.execute(
    `INSERT INTO law_firms (id, nome, cnpj, email_contato, telefone, status, plano, observacoes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(6), NOW(6))`,
    [id, input.name, normalizeCnpj(input.cnpj), input.contact_email, input.contact_phone,
      LIFECYCLE_TO_STATUS[input.lifecycle_status ?? "ativa"], input.plan || null, input.notes],
  );
  await recordBackofficeEvent({
    law_firm_id: id, actor, event_type: "law_firm_created", description: `Escritório ${input.name} cadastrado.`, payload: { law_firm_id: id },
  }, executor);
  return id;
}

export async function updateCompany(id: string, input: Partial<CompanyInput>, actor: string): Promise<Company | null> {
  const fields = (Object.keys(input) as (keyof CompanyInput)[]).filter((field) => field in COMPANY_COLUMNS);
  if (!fields.length) return getCompany(id);
  const updated = await withTransaction(async (conn) => {
    const [result] = await conn.execute<ResultSetHeader>(
      `UPDATE law_firms SET ${fields.map((field) => `\`${COMPANY_COLUMNS[field]}\` = ?`).join(", ")}, updated_at = NOW(6) WHERE id = ?`,
      [...fields.map((field) => companyValue(field, input)), id]);
    if (!result.affectedRows) return false;
    await recordBackofficeEvent({
      law_firm_id: id, actor, event_type: "law_firm_updated", description: "Cadastro do escritório atualizado.", payload: { law_firm_id: id, fields },
    }, conn);
    return true;
  });
  return updated ? getCompany(id) : null;
}

/** Firms with triage sessions cannot be removed: triage_sessions.law_firm_id has no cascade. */
export async function deleteCompany(id: string, actor: string): Promise<"deleted" | "not_found" | "in_use"> {
  return withTransaction(async (conn) => {
    const [rows] = await conn.execute<RowDataPacket[]>(
      "SELECT f.nome, (SELECT COUNT(*) FROM triage_sessions ts WHERE ts.law_firm_id = f.id) AS sessions FROM law_firms f WHERE f.id = ? FOR UPDATE", [id]);
    if (!rows[0]) return "not_found";
    if (Number(rows[0].sessions) > 0) return "in_use";
    await conn.execute("DELETE FROM law_firms WHERE id = ?", [id]);
    await recordBackofficeEvent({ actor, event_type: "law_firm_deleted", description: `Escritório ${rows[0].nome} removido.`, payload: { law_firm_id: id } }, conn);
    return "deleted";
  });
}

const CASE_SELECT = `SELECT ts.id, ts.protocolo AS protocol, lc.titulo AS title, lc.area_juridica AS area, lc.tipo_caso AS case_type,
  ${CASE_STATUS_SQL} AS status, ts.status AS pipeline_status, ts.correlation_id, ts.api_credential_id IS NOT NULL AS sender_registered,
  ${iso("ts.created_at")} AS submitted_at, ${iso("ts.updated_at")} AS updated_at,
  ts.law_firm_id AS company_id, f.nome AS company_name, COALESCE(f.plano, '') AS company_plan`;
const CASE_FROM = `FROM triage_sessions ts
  LEFT JOIN legal_cases lc ON lc.session_id = ts.id
  LEFT JOIN law_firms f ON f.id = ts.law_firm_id`;

export function mapCase(row: RowDataPacket): LegalCase {
  return {
    id: row.id, protocol: row.protocol, title: row.title, area: row.area, case_type: row.case_type,
    status: row.status, pipeline_status: row.pipeline_status, correlation_id: row.correlation_id,
    sender_registered: Boolean(row.sender_registered), submitted_at: row.submitted_at, updated_at: row.updated_at,
    company_id: row.company_id,
    company: row.company_name ? { id: row.company_id, name: row.company_name, plan: row.company_plan } : null,
  };
}

export type CaseFilters = {
  status?: string | null; company_id?: string | null; area?: string | null; q?: string | null;
  limit?: number | null; offset?: number;
};

export async function listCases(filters: CaseFilters = {}): Promise<{ items: LegalCase[]; total: number }> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filters.status) { where.push(`(${CASE_STATUS_SQL}) = ?`); params.push(filters.status); }
  if (filters.company_id) { where.push("ts.law_firm_id = ?"); params.push(filters.company_id); }
  if (filters.area) { where.push("lc.area_juridica = ?"); params.push(filters.area); }
  if (filters.q) {
    where.push("(ts.protocolo LIKE ? OR lc.titulo LIKE ? OR f.nome LIKE ? OR ts.correlation_id LIKE ?)");
    params.push(...Array(4).fill(`%${filters.q}%`));
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const paging = filters.limit ? ` LIMIT ${Math.floor(filters.limit)} OFFSET ${Math.floor(filters.offset ?? 0)}` : "";
  const [rows] = await db.execute<RowDataPacket[]>(`${CASE_SELECT} ${CASE_FROM} ${whereSql} ORDER BY ts.created_at DESC${paging}`, params);
  if (!filters.limit) return { items: rows.map(mapCase), total: rows.length };
  const [[count]] = await db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total ${CASE_FROM} ${whereSql}`, params);
  return { items: rows.map(mapCase), total: Number(count.total) };
}

export async function getCase(id: string, companyId?: string): Promise<LegalCase | null> {
  const scope = companyId ? " AND ts.law_firm_id = ?" : "";
  const [rows] = await db.execute<RowDataPacket[]>(`${CASE_SELECT} ${CASE_FROM} WHERE ts.id = ?${scope} LIMIT 1`, companyId ? [id, companyId] : [id]);
  return rows[0] ? mapCase(rows[0]) : null;
}

function mapFirmUser(row: RowDataPacket): FirmUser {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    job_title: row.job_title == null ? null : String(row.job_title),
    active: Boolean(Number(row.active ?? 1)),
    must_change_password: Boolean(Number(row.must_change_password ?? 0)),
    created_at: String(row.created_at),
  };
}

export async function findUser(email: string): Promise<UserRow | null> {
  const [rows] = await db.execute<UserRow[]>(
    `SELECT id, nome AS name, email, password_hash, role, law_firm_id AS company_id, cargo AS job_title,
       ativo AS active, must_change_password
     FROM app_users WHERE email = ? LIMIT 1`, [email.toLowerCase()]);
  return rows[0] ?? null;
}

export async function listFirmUsers(companyId: string): Promise<FirmUser[]> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id, nome AS name, email, cargo AS job_title, ativo AS active, must_change_password,
       ${iso("created_at")} AS created_at
     FROM app_users WHERE law_firm_id = ? AND role = 'firm_user' ORDER BY ativo DESC, created_at`, [companyId]);
  return rows.map(mapFirmUser);
}

/** Creates a portal user (`firm_user`) for an existing law firm. Only called by staff. */
export async function createFirmUser(
  input: { name: string; email: string; password: string; company_id: string; job_title: string | null },
  actor: string,
): Promise<{ id: string; email: string }> {
  const email = input.email.toLowerCase();
  if (!(await getCompany(input.company_id))) throw Object.assign(new Error("Escritório não encontrado."), { code: "NOT_FOUND" });
  if (await findUser(email)) throw Object.assign(new Error("Este email já está cadastrado."), { code: "DUPLICATE" });
  const id = crypto.randomUUID();
  await withTransaction(async (conn) => {
    await conn.execute(
      `INSERT INTO app_users (id, nome, email, password_hash, role, law_firm_id, cargo, ativo, must_change_password, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'firm_user', ?, ?, 1, 1, NOW(6), NOW(6))`,
      [id, input.name, email, hashPassword(input.password), input.company_id, input.job_title]);
    await recordBackofficeEvent({
      law_firm_id: input.company_id, actor, event_type: "user_signup",
      description: `Usuário do portal ${input.name} (${email}) criado pela equipe triAIge.`,
      payload: { user_id: id, email },
    }, conn);
  });
  return { id, email };
}

/** Updates a portal user of a law firm. Optional password resets the login. */
export async function updateFirmUser(
  companyId: string,
  userId: string,
  input: { name: string; email: string; job_title: string | null; password?: string | null },
  actor: string,
): Promise<FirmUser> {
  const email = input.email.toLowerCase();
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id, email FROM app_users WHERE id = ? AND law_firm_id = ? AND role = 'firm_user' LIMIT 1`,
    [userId, companyId],
  );
  if (!rows[0]) throw Object.assign(new Error("Usuário não encontrado."), { code: "NOT_FOUND" });
  const existing = await findUser(email);
  if (existing && existing.id !== userId) {
    throw Object.assign(new Error("Este email já está cadastrado."), { code: "DUPLICATE" });
  }
  const password = input.password?.trim();
  await withTransaction(async (conn) => {
    if (password) {
      await conn.execute(
        `UPDATE app_users SET nome = ?, email = ?, cargo = ?, password_hash = ?, must_change_password = 1, updated_at = NOW(6) WHERE id = ?`,
        [input.name, email, input.job_title, hashPassword(password), userId],
      );
    } else {
      await conn.execute(
        `UPDATE app_users SET nome = ?, email = ?, cargo = ?, updated_at = NOW(6) WHERE id = ?`,
        [input.name, email, input.job_title, userId],
      );
    }
    await recordBackofficeEvent({
      law_firm_id: companyId,
      actor,
      event_type: "user_updated",
      description: `Usuário do portal ${input.name} (${email}) atualizado pela equipe triAIge.`,
      payload: { user_id: userId, email, password_reset: Boolean(password) },
    }, conn);
  });
  const users = await listFirmUsers(companyId);
  const user = users.find((u) => u.id === userId);
  if (!user) throw Object.assign(new Error("Usuário não encontrado."), { code: "NOT_FOUND" });
  return user;
}

export async function setFirmUserActive(
  companyId: string,
  userId: string,
  active: boolean,
  actor: string,
): Promise<FirmUser> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id, nome AS name, email FROM app_users WHERE id = ? AND law_firm_id = ? AND role = 'firm_user' LIMIT 1`,
    [userId, companyId],
  );
  if (!rows[0]) throw Object.assign(new Error("Usuário não encontrado."), { code: "NOT_FOUND" });
  await withTransaction(async (conn) => {
    await conn.execute(`UPDATE app_users SET ativo = ?, updated_at = NOW(6) WHERE id = ?`, [active ? 1 : 0, userId]);
    if (!active) await conn.execute(`DELETE FROM app_sessions WHERE user_id = ?`, [userId]);
    await recordBackofficeEvent({
      law_firm_id: companyId,
      actor,
      event_type: active ? "user_activated" : "user_deactivated",
      description: `Usuário do portal ${rows[0].name} (${rows[0].email}) ${active ? "reativado" : "inativado"} pela equipe triAIge.`,
      payload: { user_id: userId, email: rows[0].email, active },
    }, conn);
  });
  const users = await listFirmUsers(companyId);
  const user = users.find((u) => u.id === userId);
  if (!user) throw Object.assign(new Error("Usuário não encontrado."), { code: "NOT_FOUND" });
  return user;
}

export async function deleteFirmUser(companyId: string, userId: string, actor: string): Promise<void> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id, nome AS name, email FROM app_users WHERE id = ? AND law_firm_id = ? AND role = 'firm_user' LIMIT 1`,
    [userId, companyId],
  );
  if (!rows[0]) throw Object.assign(new Error("Usuário não encontrado."), { code: "NOT_FOUND" });
  await withTransaction(async (conn) => {
    await conn.execute(`DELETE FROM app_users WHERE id = ?`, [userId]);
    await recordBackofficeEvent({
      law_firm_id: companyId,
      actor,
      event_type: "user_deleted",
      description: `Usuário do portal ${rows[0].name} (${rows[0].email}) excluído pela equipe triAIge.`,
      payload: { user_id: userId, email: rows[0].email },
    }, conn);
  });
}

/** Sets a new password for the logged-in user and clears the first-access flag. */
export async function changeOwnPassword(userId: string, newPassword: string): Promise<void> {
  await db.execute(
    `UPDATE app_users SET password_hash = ?, must_change_password = 0, updated_at = NOW(6) WHERE id = ?`,
    [hashPassword(newPassword), userId],
  );
}

function mapStaffUser(row: RowDataPacket): StaffUser {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    job_title: row.job_title == null ? null : String(row.job_title),
    role: row.role as StaffRole,
    active: Boolean(Number(row.active ?? 1)),
    must_change_password: Boolean(Number(row.must_change_password ?? 0)),
    created_at: String(row.created_at),
  };
}

export async function listStaffUsers(): Promise<StaffUser[]> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id, nome AS name, email, cargo AS job_title, role, ativo AS active, must_change_password,
       ${iso("created_at")} AS created_at
     FROM app_users WHERE role IN ('admin', 'ops') ORDER BY ativo DESC, role, nome`,
  );
  return rows.map(mapStaffUser);
}

export async function createStaffUser(
  input: { name: string; email: string; password: string; role: StaffRole; job_title: string | null },
  actor: string,
): Promise<StaffUser> {
  const email = input.email.toLowerCase();
  if (!(STAFF_ROLES as readonly string[]).includes(input.role)) {
    throw Object.assign(new Error("Perfil inválido."), { code: "VALIDATION" });
  }
  if (await findUser(email)) throw Object.assign(new Error("Este email já está cadastrado."), { code: "DUPLICATE" });
  const id = crypto.randomUUID();
  await withTransaction(async (conn) => {
    await conn.execute(
      `INSERT INTO app_users (id, nome, email, password_hash, role, law_firm_id, cargo, ativo, must_change_password, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NULL, ?, 1, 1, NOW(6), NOW(6))`,
      [id, input.name, email, hashPassword(input.password), input.role, input.job_title],
    );
    await recordBackofficeEvent({
      actor,
      event_type: "staff_user_created",
      description: `Funcionário triAIge ${input.name} (${email}) criado com perfil ${input.role}.`,
      payload: { user_id: id, email, role: input.role },
    }, conn);
  });
  const users = await listStaffUsers();
  const user = users.find((u) => u.id === id);
  if (!user) throw Object.assign(new Error("Usuário não encontrado."), { code: "NOT_FOUND" });
  return user;
}

export async function updateStaffUser(
  userId: string,
  input: { name: string; email: string; role: StaffRole; job_title: string | null; password?: string | null },
  actor: string,
): Promise<StaffUser> {
  const email = input.email.toLowerCase();
  if (!(STAFF_ROLES as readonly string[]).includes(input.role)) {
    throw Object.assign(new Error("Perfil inválido."), { code: "VALIDATION" });
  }
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id, role, ativo AS active FROM app_users WHERE id = ? AND role IN ('admin', 'ops') LIMIT 1`,
    [userId],
  );
  if (!rows[0]) throw Object.assign(new Error("Usuário não encontrado."), { code: "NOT_FOUND" });
  const existing = await findUser(email);
  if (existing && existing.id !== userId) {
    throw Object.assign(new Error("Este email já está cadastrado."), { code: "DUPLICATE" });
  }
  if (rows[0].role === "admin" && input.role !== "admin") {
    await assertNotLastActiveAdmin(userId);
  }
  const password = input.password?.trim();
  await withTransaction(async (conn) => {
    if (password) {
      await conn.execute(
        `UPDATE app_users SET nome = ?, email = ?, cargo = ?, role = ?, password_hash = ?, must_change_password = 1, updated_at = NOW(6) WHERE id = ?`,
        [input.name, email, input.job_title, input.role, hashPassword(password), userId],
      );
    } else {
      await conn.execute(
        `UPDATE app_users SET nome = ?, email = ?, cargo = ?, role = ?, updated_at = NOW(6) WHERE id = ?`,
        [input.name, email, input.job_title, input.role, userId],
      );
    }
    await recordBackofficeEvent({
      actor,
      event_type: "staff_user_updated",
      description: `Funcionário triAIge ${input.name} (${email}) atualizado.`,
      payload: { user_id: userId, email, role: input.role, password_reset: Boolean(password) },
    }, conn);
  });
  const users = await listStaffUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) throw Object.assign(new Error("Usuário não encontrado."), { code: "NOT_FOUND" });
  return user;
}

export async function setStaffUserActive(userId: string, active: boolean, actor: string): Promise<StaffUser> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id, nome AS name, email, role FROM app_users WHERE id = ? AND role IN ('admin', 'ops') LIMIT 1`,
    [userId],
  );
  if (!rows[0]) throw Object.assign(new Error("Usuário não encontrado."), { code: "NOT_FOUND" });
  if (!active && rows[0].role === "admin") await assertNotLastActiveAdmin(userId);
  await withTransaction(async (conn) => {
    await conn.execute(`UPDATE app_users SET ativo = ?, updated_at = NOW(6) WHERE id = ?`, [active ? 1 : 0, userId]);
    if (!active) await conn.execute(`DELETE FROM app_sessions WHERE user_id = ?`, [userId]);
    await recordBackofficeEvent({
      actor,
      event_type: active ? "staff_user_activated" : "staff_user_deactivated",
      description: `Funcionário triAIge ${rows[0].name} (${rows[0].email}) ${active ? "reativado" : "inativado"}.`,
      payload: { user_id: userId, email: rows[0].email, active },
    }, conn);
  });
  const users = await listStaffUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) throw Object.assign(new Error("Usuário não encontrado."), { code: "NOT_FOUND" });
  return user;
}

export async function deleteStaffUser(userId: string, actor: string): Promise<void> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id, nome AS name, email, role, ativo AS active FROM app_users WHERE id = ? AND role IN ('admin', 'ops') LIMIT 1`,
    [userId],
  );
  if (!rows[0]) throw Object.assign(new Error("Usuário não encontrado."), { code: "NOT_FOUND" });
  if (rows[0].role === "admin" && Number(rows[0].active)) await assertNotLastActiveAdmin(userId);
  await withTransaction(async (conn) => {
    await conn.execute(`DELETE FROM app_users WHERE id = ?`, [userId]);
    await recordBackofficeEvent({
      actor,
      event_type: "staff_user_deleted",
      description: `Funcionário triAIge ${rows[0].name} (${rows[0].email}) excluído.`,
      payload: { user_id: userId, email: rows[0].email },
    }, conn);
  });
}

async function assertNotLastActiveAdmin(excludeUserId: string) {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM app_users WHERE role = 'admin' AND ativo = 1 AND id <> ?`,
    [excludeUserId],
  );
  if (Number(rows[0]?.total ?? 0) < 1) {
    throw Object.assign(new Error("É preciso manter ao menos um admin ativo."), { code: "LAST_ADMIN" });
  }
}

/** Updates the logged-in user's profile fields; optional password requires verification by the caller. */
export async function updateOwnProfile(
  userId: string,
  input: { name: string; email: string; job_title: string | null; password?: string | null },
): Promise<{ name: string; email: string; job_title: string | null }> {
  const email = input.email.toLowerCase();
  const existing = await findUser(email);
  if (existing && existing.id !== userId) {
    throw Object.assign(new Error("Este email já está cadastrado."), { code: "DUPLICATE" });
  }
  const password = input.password?.trim();
  if (password) {
    await db.execute(
      `UPDATE app_users SET nome = ?, email = ?, cargo = ?, password_hash = ?, must_change_password = 0, updated_at = NOW(6) WHERE id = ?`,
      [input.name, email, input.job_title, hashPassword(password), userId],
    );
  } else {
    await db.execute(
      `UPDATE app_users SET nome = ?, email = ?, cargo = ?, updated_at = NOW(6) WHERE id = ?`,
      [input.name, email, input.job_title, userId],
    );
  }
  return { name: input.name, email, job_title: input.job_title };
}
