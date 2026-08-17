import { promises as fs } from "node:fs";
import path from "node:path";
import type { CaseChannel, CaseStatus, Company, LegalCase } from "./types";

type StoredCompany = Omit<Company, "cases_count">;
type StoredCase = Omit<LegalCase, "company">;
type StoredUser = { id: string; name: string; email: string; password: string };
type Database = { companies: StoredCompany[]; cases: StoredCase[]; users: StoredUser[] };

const dbPath = path.join(process.cwd(), "data", "db.json");
let writeQueue = Promise.resolve();

async function readDb(): Promise<Database> {
  return JSON.parse(await fs.readFile(dbPath, "utf8")) as Database;
}

async function mutate<T>(operation: (db: Database) => T | Promise<T>): Promise<T> {
  let result!: T;
  writeQueue = writeQueue.then(async () => {
    const db = await readDb();
    result = await operation(db);
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2) + "\n", "utf8");
  });
  await writeQueue;
  return result;
}

function withCompany(row: StoredCase, companies: StoredCompany[]): LegalCase {
  const company = companies.find((item) => item.id === row.company_id);
  return { ...row, company: company ? { id: company.id, name: company.name, plan: company.plan } : null };
}

export async function listCompanies(): Promise<Company[]> {
  const db = await readDb();
  return db.companies.map((company) => ({ ...company, cases_count: db.cases.filter((item) => item.company_id === company.id).length }));
}

export async function getCompany(id: string): Promise<Company | null> {
  const db = await readDb();
  const company = db.companies.find((item) => item.id === id);
  return company ? { ...company, cases_count: db.cases.filter((item) => item.company_id === id).length } : null;
}

export async function createCompany(input: Omit<Company, "id" | "created_at" | "cases_count">): Promise<Company> {
  return mutate((db) => {
    const company: StoredCompany = { ...input, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    db.companies.unshift(company);
    return { ...company, cases_count: 0 };
  });
}

export async function updateCompany(id: string, input: Partial<StoredCompany>): Promise<Company | null> {
  return mutate((db) => {
    const index = db.companies.findIndex((item) => item.id === id);
    if (index < 0) return null;
    db.companies[index] = { ...db.companies[index], ...input, id };
    return { ...db.companies[index], cases_count: db.cases.filter((item) => item.company_id === id).length };
  });
}

export async function deleteCompany(id: string): Promise<boolean> {
  return mutate((db) => {
    const before = db.companies.length;
    db.companies = db.companies.filter((item) => item.id !== id);
    db.cases = db.cases.map((item) => item.company_id === id ? { ...item, company_id: null } : item);
    return before !== db.companies.length;
  });
}

export async function listCases(): Promise<LegalCase[]> {
  const db = await readDb();
  return db.cases.map((item) => withCompany(item, db.companies));
}

export async function getCase(id: string): Promise<LegalCase | null> {
  const db = await readDb();
  const row = db.cases.find((item) => item.id === id);
  return row ? withCompany(row, db.companies) : null;
}

export async function createCase(input: Omit<LegalCase, "id" | "company" | "submitted_at" | "updated_at">): Promise<LegalCase> {
  return mutate((db) => {
    const now = new Date().toISOString();
    const row: StoredCase = { ...input, id: crypto.randomUUID(), submitted_at: now, updated_at: now };
    db.cases.unshift(row);
    return withCompany(row, db.companies);
  });
}

export async function updateCase(id: string, input: Partial<{ case_code: string; status: CaseStatus; channel: CaseChannel; company_id: string | null; plan: string | null; deadline: string | null; notes: string | null; sender_registered: boolean }>): Promise<LegalCase | null> {
  return mutate((db) => {
    const index = db.cases.findIndex((item) => item.id === id);
    if (index < 0) return null;
    db.cases[index] = { ...db.cases[index], ...input, updated_at: new Date().toISOString() };
    return withCompany(db.cases[index], db.companies);
  });
}

export async function deleteCase(id: string): Promise<boolean> {
  return mutate((db) => {
    const before = db.cases.length;
    db.cases = db.cases.filter((item) => item.id !== id);
    return before !== db.cases.length;
  });
}

export async function findUser(email: string) { const db = await readDb(); return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null; }
export async function createUser(input: Omit<StoredUser, "id">) { return mutate((db) => { const user = { ...input, id: crypto.randomUUID() }; db.users.push(user); return user; }); }
