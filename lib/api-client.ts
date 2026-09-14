import { useMockData } from "./config";
import {
  cloneCases,
  cloneCompanies,
  MOCK_API_CREDENTIALS,
  MOCK_AUDIT_EVENTS,
  MOCK_BUSINESS_METRICS,
  MOCK_LGPD,
  MOCK_PORTAL_AUDIT,
  MOCK_PORTAL_CASE_DETAILS,
  MOCK_PORTAL_CREDENTIAL,
  MOCK_PORTAL_FIRM_ID,
  MOCK_PORTAL_METRICS,
  MOCK_PORTAL_RECIPIENTS,
  MOCK_PORTAL_SESSION,
  MOCK_TECH_HEALTH,
  type ApiCredential,
  type AuditEvent,
  type CaseCreateInput,
  type CaseUpdateInput,
  type CompanyCreateInput,
  type CompanyUpdateInput,
  type MockCompany,
  type PortalAuditEvent,
  type PortalCaseDetail,
  type PortalRecipient,
} from "./mock-data";
import type { Company, LegalCase } from "./types";

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error ?? "Não foi possível concluir a requisição.");
  return payload as T;
}

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** In-memory store for mock mode (browser session). */
const mockState = {
  companies: cloneCompanies(),
  cases: cloneCases(),
  credentials: MOCK_API_CREDENTIALS.map((c) => ({ ...c })),
  audit: MOCK_AUDIT_EVENTS.map((e) => ({ ...e })),
  portalRecipients: MOCK_PORTAL_RECIPIENTS.map((r) => ({ ...r })),
  portalAudit: MOCK_PORTAL_AUDIT.map((e) => ({ ...e })),
};

function attachCompany(row: LegalCase): LegalCase {
  const company = mockState.companies.find((c) => c.id === row.company_id);
  return {
    ...row,
    company: company ? { id: company.id, name: company.name, plan: company.plan } : null,
  };
}

function recountCases(companyId: string) {
  const company = mockState.companies.find((c) => c.id === companyId);
  if (!company) return;
  company.cases_count = mockState.cases.filter((c) => c.company_id === companyId).length;
}

const mockApi = {
  clients: {
    async list(): Promise<Company[]> {
      return mockState.companies.map((c) => ({ ...c }));
    },
    async create(data: CompanyCreateInput): Promise<Company> {
      const created: MockCompany = {
        id: uid(),
        name: data.name,
        cnpj: data.cnpj ?? null,
        contact_email: data.contact_email ?? null,
        contact_phone: data.contact_phone ?? null,
        plan: data.plan,
        notes: data.notes ?? null,
        created_at: new Date().toISOString(),
        cases_count: 0,
        lifecycle_status: data.lifecycle_status ?? "ativa",
      };
      mockState.companies.unshift(created);
      return { ...created };
    },
    async update(id: string, data: CompanyUpdateInput): Promise<Company> {
      const idx = mockState.companies.findIndex((c) => c.id === id);
      if (idx < 0) throw new Error("Escritório não encontrado.");
      const current = mockState.companies[idx];
      const updated: MockCompany = {
        ...current,
        ...data,
        cnpj: data.cnpj === undefined ? current.cnpj : data.cnpj,
        contact_email: data.contact_email === undefined ? current.contact_email : data.contact_email,
        contact_phone: data.contact_phone === undefined ? current.contact_phone : data.contact_phone,
        notes: data.notes === undefined ? current.notes : data.notes,
        lifecycle_status: data.lifecycle_status ?? current.lifecycle_status,
      };
      mockState.companies[idx] = updated;
      mockState.cases = mockState.cases.map((c) =>
        c.company_id === id
          ? { ...c, company: { id: updated.id, name: updated.name, plan: updated.plan }, plan: c.plan ?? updated.plan }
          : c,
      );
      return { ...updated };
    },
    async remove(id: string): Promise<{ success: true }> {
      mockState.companies = mockState.companies.filter((c) => c.id !== id);
      mockState.cases = mockState.cases.map((c) =>
        c.company_id === id ? { ...c, company_id: null, company: null } : c,
      );
      return { success: true };
    },
  },
  cases: {
    async list(): Promise<LegalCase[]> {
      return mockState.cases.map(attachCompany);
    },
    async create(data: CaseCreateInput): Promise<LegalCase> {
      const iso = new Date().toISOString();
      const created: LegalCase = attachCompany({
        id: uid(),
        case_code: data.case_code,
        status: data.status,
        channel: data.channel,
        sender_registered: data.sender_registered,
        plan: data.plan,
        deadline: data.deadline,
        notes: data.notes,
        submitted_at: iso,
        updated_at: iso,
        company_id: data.company_id,
        company: null,
      });
      mockState.cases.unshift(created);
      if (created.company_id) recountCases(created.company_id);
      return created;
    },
    async update(id: string, data: CaseUpdateInput): Promise<LegalCase> {
      const idx = mockState.cases.findIndex((c) => c.id === id);
      if (idx < 0) throw new Error("Case não encontrado.");
      const prev = mockState.cases[idx];
      const next = attachCompany({
        ...prev,
        ...data,
        updated_at: new Date().toISOString(),
      });
      mockState.cases[idx] = next;
      if (prev.company_id) recountCases(prev.company_id);
      if (next.company_id && next.company_id !== prev.company_id) recountCases(next.company_id);
      return next;
    },
    async remove(id: string): Promise<{ success: true }> {
      const row = mockState.cases.find((c) => c.id === id);
      mockState.cases = mockState.cases.filter((c) => c.id !== id);
      if (row?.company_id) recountCases(row.company_id);
      return { success: true };
    },
  },
  admin: {
    async businessMetrics() {
      return { ...MOCK_BUSINESS_METRICS };
    },
    async techHealth() {
      return { ...MOCK_TECH_HEALTH };
    },
    async credentials(): Promise<ApiCredential[]> {
      return mockState.credentials.map((c) => ({ ...c }));
    },
    async revokeCredential(id: string): Promise<ApiCredential> {
      const idx = mockState.credentials.findIndex((c) => c.id === id);
      if (idx < 0) throw new Error("Credencial não encontrada.");
      mockState.credentials[idx] = { ...mockState.credentials[idx], status: "revogada" };
      return { ...mockState.credentials[idx] };
    },
    async auditEvents(): Promise<AuditEvent[]> {
      return mockState.audit.map((e) => ({ ...e }));
    },
    async lgpd() {
      return { ...MOCK_LGPD };
    },
  },
  portal: {
    async session() {
      return { ...MOCK_PORTAL_SESSION };
    },
    async cases(): Promise<LegalCase[]> {
      return mockState.cases
        .filter((c) => c.company_id === MOCK_PORTAL_FIRM_ID)
        .map(attachCompany);
    },
    async caseDetail(id: string): Promise<{ case: LegalCase; detail: PortalCaseDetail | null }> {
      const row = mockState.cases.find((c) => c.id === id && c.company_id === MOCK_PORTAL_FIRM_ID);
      if (!row) throw new Error("Caso não encontrado.");
      return {
        case: attachCompany(row),
        detail: MOCK_PORTAL_CASE_DETAILS[id] ?? null,
      };
    },
    async metrics() {
      return { ...MOCK_PORTAL_METRICS };
    },
    async recipients(): Promise<PortalRecipient[]> {
      return mockState.portalRecipients.map((r) => ({ ...r }));
    },
    async credential() {
      return { ...MOCK_PORTAL_CREDENTIAL };
    },
    async audit(): Promise<PortalAuditEvent[]> {
      return mockState.portalAudit.map((e) => ({ ...e }));
    },
  },
};

const liveApi = {
  clients: {
    list: () => request<Company[]>("/api/clients", { cache: "no-store" }),
    create: (data: CompanyCreateInput) =>
      request<Company>("/api/clients", { method: "POST", body: data }),
    update: (id: string, data: CompanyUpdateInput) =>
      request<Company>(`/api/clients/${id}`, { method: "PUT", body: data }),
    remove: (id: string) => request<{ success: true }>(`/api/clients/${id}`, { method: "DELETE" }),
  },
  cases: {
    list: () => request<LegalCase[]>("/api/cases", { cache: "no-store" }),
    create: (data: CaseCreateInput) => request<LegalCase>("/api/cases", { method: "POST", body: data }),
    update: (id: string, data: CaseUpdateInput) =>
      request<LegalCase>(`/api/cases/${id}`, { method: "PATCH", body: data }),
    remove: (id: string) => request<{ success: true }>(`/api/cases/${id}`, { method: "DELETE" }),
  },
  admin: {
    async businessMetrics() {
      throw new Error("Indicadores de negócio ainda não possuem API. Ative NEXT_PUBLIC_USE_MOCK_DATA=true.");
    },
    async techHealth() {
      throw new Error("Saúde técnica ainda não possui API. Ative NEXT_PUBLIC_USE_MOCK_DATA=true.");
    },
    async credentials(): Promise<ApiCredential[]> {
      return [];
    },
    async revokeCredential(_id: string): Promise<ApiCredential> {
      throw new Error("Revogação de credenciais ainda não possui API.");
    },
    async auditEvents(): Promise<AuditEvent[]> {
      return [];
    },
    async lgpd() {
      return { originalsRemoved: "—", dataIncidents: 0 };
    },
  },
  portal: {
    async session() {
      return {
        firmId: "",
        firmName: "Escritório",
        plan: "—",
        userEmail: "usuario@escritorio.com",
      };
    },
    async cases(): Promise<LegalCase[]> {
      const rows = await request<LegalCase[]>("/api/cases", { cache: "no-store" });
      return rows;
    },
    async caseDetail(id: string): Promise<{ case: LegalCase; detail: PortalCaseDetail | null }> {
      const row = await request<LegalCase>(`/api/cases/${id}`, { cache: "no-store" });
      return { case: row, detail: null };
    },
    async metrics() {
      throw new Error("Indicadores do portal ainda não possuem API. Ative NEXT_PUBLIC_USE_MOCK_DATA=true.");
    },
    async recipients(): Promise<PortalRecipient[]> {
      return [];
    },
    async credential() {
      return { status: "ativa" as const, last_used: "", expires_at: "—" };
    },
    async audit(): Promise<PortalAuditEvent[]> {
      return [];
    },
  },
};

export const api = {
  ...(useMockData ? mockApi : liveApi),
  auth: (mode: "signin" | "signup", data: Record<string, string>) =>
    request<{ user: { name: string; email: string }; token: string }>(`/api/auth/${mode}`, {
      method: "POST",
      body: data,
    }),
  useMockData,
};
