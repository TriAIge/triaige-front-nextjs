import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "./mysql";
import { hashPassword } from "./password";
import type { CaseChannel, CaseStatus, Company, LegalCase } from "./types";

type CompanyInput = Omit<Company, "id" | "created_at" | "cases_count">;
export type UserRow = RowDataPacket & { id: string; name: string; email: string; password_hash: string };

const COMPANY_SELECT = `SELECT c.id, c.name, c.cnpj, c.contact_email, c.contact_phone, c.plan, c.notes,
  DATE_FORMAT(c.created_at, '%Y-%m-%dT%H:%i:%s.000Z') AS created_at, COUNT(lc.id) AS cases_count
  FROM companies c LEFT JOIN legal_cases lc ON lc.company_id = c.id`;

const CASE_SELECT = `SELECT lc.id, lc.case_code, lc.status, lc.channel, lc.sender_registered, lc.plan,
  DATE_FORMAT(lc.deadline, '%Y-%m-%dT%H:%i:%s.000Z') AS deadline, lc.notes,
  DATE_FORMAT(lc.submitted_at, '%Y-%m-%dT%H:%i:%s.000Z') AS submitted_at,
  DATE_FORMAT(lc.updated_at, '%Y-%m-%dT%H:%i:%s.000Z') AS updated_at,
  lc.company_id, c.name AS company_name, c.plan AS company_plan
  FROM legal_cases lc LEFT JOIN companies c ON c.id = lc.company_id`;

function mapCase(row: RowDataPacket): LegalCase {
  return { id: row.id, case_code: row.case_code, status: row.status, channel: row.channel,
    sender_registered: Boolean(row.sender_registered), plan: row.plan, deadline: row.deadline, notes: row.notes,
    submitted_at: row.submitted_at, updated_at: row.updated_at, company_id: row.company_id,
    company: row.company_id ? { id: row.company_id, name: row.company_name, plan: row.company_plan } : null };
}

export async function listCompanies(): Promise<Company[]> {
  const [rows] = await db.query<RowDataPacket[]>(`${COMPANY_SELECT} GROUP BY c.id ORDER BY c.created_at DESC`);
  return rows.map((row) => ({ ...row, cases_count: Number(row.cases_count) } as Company));
}

export async function getCompany(id: string): Promise<Company | null> {
  const [rows] = await db.execute<RowDataPacket[]>(`${COMPANY_SELECT} WHERE c.id = ? GROUP BY c.id LIMIT 1`, [id]);
  return rows[0] ? ({ ...rows[0], cases_count: Number(rows[0].cases_count) } as Company) : null;
}

export async function createCompany(input: CompanyInput): Promise<Company> {
  const id = crypto.randomUUID();
  await db.execute<ResultSetHeader>(`INSERT INTO companies (id, name, cnpj, contact_email, contact_phone, plan, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, input.name, input.cnpj, input.contact_email, input.contact_phone, input.plan, input.notes]);
  return (await getCompany(id))!;
}

export async function updateCompany(id: string, input: Partial<CompanyInput>): Promise<Company | null> {
  const allowed = new Set(["name", "cnpj", "contact_email", "contact_phone", "plan", "notes"]);
  const fields = (Object.keys(input) as (keyof CompanyInput)[]).filter((field) => allowed.has(field));
  if (!fields.length) return getCompany(id);
  const [result] = await db.execute<ResultSetHeader>(`UPDATE companies SET ${fields.map((field) => `\`${field}\` = ?`).join(", ")} WHERE id = ?`,
    [...fields.map((field) => input[field]), id]);
  return result.affectedRows ? getCompany(id) : null;
}

export async function deleteCompany(id: string): Promise<boolean> {
  const [result] = await db.execute<ResultSetHeader>("DELETE FROM companies WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

export async function listCases(): Promise<LegalCase[]> {
  const [rows] = await db.query<RowDataPacket[]>(`${CASE_SELECT} ORDER BY lc.submitted_at DESC`);
  return rows.map(mapCase);
}

export async function getCase(id: string): Promise<LegalCase | null> {
  const [rows] = await db.execute<RowDataPacket[]>(`${CASE_SELECT} WHERE lc.id = ? LIMIT 1`, [id]);
  return rows[0] ? mapCase(rows[0]) : null;
}

export async function createCase(input: Omit<LegalCase, "id" | "company" | "submitted_at" | "updated_at">): Promise<LegalCase> {
  const id = crypto.randomUUID();
  await db.execute<ResultSetHeader>(`INSERT INTO legal_cases (id, case_code, status, channel, sender_registered, plan, deadline, notes, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, input.case_code, input.status, input.channel, input.sender_registered, input.plan, input.deadline, input.notes, input.company_id]);
  return (await getCase(id))!;
}

type CaseUpdate = Partial<{ case_code: string; status: CaseStatus; channel: CaseChannel; company_id: string | null; plan: string | null; deadline: string | null; notes: string | null; sender_registered: boolean }>;

export async function updateCase(id: string, input: CaseUpdate): Promise<LegalCase | null> {
  const allowed = new Set(["case_code", "status", "channel", "company_id", "plan", "deadline", "notes", "sender_registered"]);
  const fields = (Object.keys(input) as (keyof CaseUpdate)[]).filter((field) => allowed.has(field));
  if (!fields.length) return getCase(id);
  const [result] = await db.execute<ResultSetHeader>(`UPDATE legal_cases SET ${fields.map((field) => `\`${field}\` = ?`).join(", ")} WHERE id = ?`,
    [...fields.map((field) => input[field]), id]);
  return result.affectedRows ? getCase(id) : null;
}

export async function deleteCase(id: string): Promise<boolean> {
  const [result] = await db.execute<ResultSetHeader>("DELETE FROM legal_cases WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

export async function findUser(email: string): Promise<UserRow | null> {
  const [rows] = await db.execute<UserRow[]>("SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1", [email.toLowerCase()]);
  return rows[0] ?? null;
}

export async function createUser(input: { name: string; email: string; password: string }): Promise<UserRow> {
  const id = crypto.randomUUID();
  await db.execute<ResultSetHeader>("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)",
    [id, input.name, input.email.toLowerCase(), hashPassword(input.password)]);
  return (await findUser(input.email))!;
}
