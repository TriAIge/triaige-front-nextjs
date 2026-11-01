import { useMockData } from "./config";
import {
  cloneCases,
  cloneCompanies,
  MOCK_API_CREDENTIALS,
  MOCK_AUDIT_EVENTS,
  MOCK_BUSINESS_METRICS,
  MOCK_FIRM_SESSION,
  MOCK_LGPD,
  MOCK_PORTAL_AUDIT,
  MOCK_PORTAL_CASE_DETAILS,
  MOCK_PORTAL_CREDENTIAL,
  MOCK_PORTAL_FIRM_ID,
  MOCK_PORTAL_METRICS,
  MOCK_PORTAL_RECIPIENTS,
  MOCK_PORTAL_SESSION,
  MOCK_STAFF_SESSION,
  MOCK_FIRM_USERS,
  MOCK_TECH_HEALTH,
  type CompanyCreateInput,
  type CompanyUpdateInput,
  type MockCompany,
} from "./mock-data";
import { buildTimeline } from "./pipeline";
import type {
  ApiCredential,
  AuditEvent,
  AuditFilters,
  BusinessMetrics,
  Company,
  FirmUser,
  LegalCase,
  LgpdSummary,
  MetricPeriod,
  PortalAuditEvent,
  PortalCaseDetail,
  PortalCredential,
  PortalMetrics,
  PortalRecipient,
  PortalRecipientInput,
  PortalSession,
  SessionInfo,
  TechHealth,
} from "./types";

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

export class ApiRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new ApiRequestError(payload?.error ?? "Não foi possível concluir a requisição.", response.status);
  return payload as T;
}

function withQuery(path: string, params: Record<string, string | number | undefined | null>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  }
  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
}

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export type SessionArea = "staff" | "firm";
export type SessionUser = SessionInfo;

/** In-memory store for mock mode (browser session). */
const mockState = {
  companies: cloneCompanies(),
  cases: cloneCases(),
  credentials: MOCK_API_CREDENTIALS.map((c) => ({ ...c })),
  audit: MOCK_AUDIT_EVENTS.map((e) => ({ ...e })),
  portalRecipients: MOCK_PORTAL_RECIPIENTS.map((r) => ({ ...r })),
  portalAudit: MOCK_PORTAL_AUDIT.map((e) => ({ ...e })),
  firmUsers: MOCK_FIRM_USERS.map((u) => ({ ...u })),
};

function recountUsers(companyId: string) {
  const company = mockState.companies.find((c) => c.id === companyId);
  if (company) company.users_count = mockState.firmUsers.filter((u) => u.company_id === companyId && u.active).length;
}

function attachCompany(row: LegalCase): LegalCase {
  const company = mockState.companies.find((c) => c.id === row.company_id);
  return {
    ...row,
    company: company ? { id: company.id, name: company.name, plan: company.plan } : null,
  };
}

export type CredentialCreateInput = { company_id: string; name?: string; expires_at?: string };

const mockApi = {
  session: {
    async me(area: SessionArea): Promise<SessionInfo> {
      return area === "firm" ? MOCK_FIRM_SESSION : MOCK_STAFF_SESSION;
    },
    async signout(): Promise<void> {},
  },
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
        users_count: 0,
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
      return { ...updated };
    },
    async remove(id: string): Promise<{ success: true }> {
      if (mockState.cases.some((c) => c.company_id === id)) {
        throw new ApiRequestError("Este escritório já tem casos de triagem e não pode ser removido. Marque-o como inativo.", 409);
      }
      mockState.companies = mockState.companies.filter((c) => c.id !== id);
      return { success: true };
    },
    async listUsers(companyId: string): Promise<FirmUser[]> {
      if (!mockState.companies.some((c) => c.id === companyId)) throw new ApiRequestError("Escritório não encontrado.", 404);
      return mockState.firmUsers
        .filter((u) => u.company_id === companyId)
        .map(({ id, name, email, job_title, active, must_change_password, created_at }) => ({
          id, name, email, job_title, active, must_change_password, created_at,
        }));
    },
    async createUser(
      companyId: string,
      data: { name: string; email: string; password: string; job_title?: string },
    ): Promise<{ user: FirmUser }> {
      if (!mockState.companies.some((c) => c.id === companyId)) throw new ApiRequestError("Escritório não encontrado.", 404);
      const email = data.email.toLowerCase();
      if (mockState.firmUsers.some((u) => u.email === email)) throw new ApiRequestError("Este email já está cadastrado.", 409);
      const user: FirmUser & { company_id: string } = {
        id: uid(),
        company_id: companyId,
        name: data.name,
        email,
        job_title: data.job_title || null,
        active: true,
        must_change_password: true,
        created_at: new Date().toISOString(),
      };
      mockState.firmUsers.push(user);
      recountUsers(companyId);
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          job_title: user.job_title,
          active: user.active,
          must_change_password: user.must_change_password,
          created_at: user.created_at,
        },
      };
    },
    async updateUser(
      companyId: string,
      userId: string,
      data: { name: string; email: string; job_title?: string; password?: string },
    ): Promise<{ user: FirmUser }> {
      if (!mockState.companies.some((c) => c.id === companyId)) throw new ApiRequestError("Escritório não encontrado.", 404);
      const idx = mockState.firmUsers.findIndex((u) => u.id === userId && u.company_id === companyId);
      if (idx < 0) throw new ApiRequestError("Usuário não encontrado.", 404);
      const email = data.email.toLowerCase();
      if (mockState.firmUsers.some((u) => u.email === email && u.id !== userId)) {
        throw new ApiRequestError("Este email já está cadastrado.", 409);
      }
      const prev = mockState.firmUsers[idx];
      const user: FirmUser & { company_id: string } = {
        ...prev,
        name: data.name,
        email,
        job_title: data.job_title || null,
        must_change_password: data.password ? true : prev.must_change_password,
      };
      mockState.firmUsers[idx] = user;
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          job_title: user.job_title,
          active: user.active,
          must_change_password: user.must_change_password,
          created_at: user.created_at,
        },
      };
    },
    async setUserActive(companyId: string, userId: string, active: boolean): Promise<{ user: FirmUser }> {
      if (!mockState.companies.some((c) => c.id === companyId)) throw new ApiRequestError("Escritório não encontrado.", 404);
      const idx = mockState.firmUsers.findIndex((u) => u.id === userId && u.company_id === companyId);
      if (idx < 0) throw new ApiRequestError("Usuário não encontrado.", 404);
      const user = { ...mockState.firmUsers[idx], active };
      mockState.firmUsers[idx] = user;
      recountUsers(companyId);
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          job_title: user.job_title,
          active: user.active,
          must_change_password: user.must_change_password,
          created_at: user.created_at,
        },
      };
    },
    async removeUser(companyId: string, userId: string): Promise<{ success: true }> {
      if (!mockState.companies.some((c) => c.id === companyId)) throw new ApiRequestError("Escritório não encontrado.", 404);
      const before = mockState.firmUsers.length;
      mockState.firmUsers = mockState.firmUsers.filter((u) => !(u.id === userId && u.company_id === companyId));
      if (mockState.firmUsers.length === before) throw new ApiRequestError("Usuário não encontrado.", 404);
      recountUsers(companyId);
      return { success: true };
    },
  },
  cases: {
    async list(): Promise<LegalCase[]> {
      return mockState.cases.map(attachCompany);
    },
    async get(id: string): Promise<LegalCase> {
      const row = mockState.cases.find((c) => c.id === id);
      if (!row) throw new ApiRequestError("Caso não encontrado.", 404);
      return attachCompany(row);
    },
  },
  admin: {
    async businessMetrics(_period: MetricPeriod = 30): Promise<BusinessMetrics> {
      return { ...MOCK_BUSINESS_METRICS };
    },
    async techHealth(): Promise<TechHealth> {
      return { ...MOCK_TECH_HEALTH };
    },
    async credentials(): Promise<ApiCredential[]> {
      return mockState.credentials.map((c) => ({ ...c }));
    },
    async createCredential(data: CredentialCreateInput): Promise<{ credential: ApiCredential; token: string }> {
      const company = mockState.companies.find((c) => c.id === data.company_id);
      if (!company) throw new Error("Escritório não encontrado.");
      const token = `trg_mock_${uid().replace(/-/g, "")}`;
      const credential: ApiCredential = {
        id: uid(),
        company_id: company.id,
        company_name: company.name,
        credential: `${token.slice(0, 12)}…`,
        status: "ativa",
        last_used: "",
        expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : "",
      };
      mockState.credentials.unshift(credential);
      return { credential: { ...credential }, token };
    },
    async revokeCredential(id: string): Promise<ApiCredential> {
      const idx = mockState.credentials.findIndex((c) => c.id === id);
      if (idx < 0) throw new Error("Credencial não encontrada.");
      mockState.credentials[idx] = { ...mockState.credentials[idx], status: "revogada" };
      return { ...mockState.credentials[idx] };
    },
    async auditEvents(filters: AuditFilters = {}): Promise<AuditEvent[]> {
      const companyName = filters.company_id
        ? mockState.companies.find((c) => c.id === filters.company_id)?.name ?? ""
        : "";
      return mockState.audit
        .filter((e) => !companyName || companyName.startsWith(e.company_name) || e.company_name.startsWith(companyName))
        .filter((e) => !filters.event_type || e.event_type === filters.event_type)
        .filter((e) => !filters.correlation_id || e.correlation_id.toLowerCase().includes(filters.correlation_id.toLowerCase()))
        .map((e) => ({ ...e }));
    },
    async lgpd(): Promise<LgpdSummary> {
      return { ...MOCK_LGPD };
    },
  },
  portal: {
    async session(): Promise<PortalSession> {
      return { ...MOCK_PORTAL_SESSION };
    },
    async cases(): Promise<LegalCase[]> {
      return mockState.cases
        .filter((c) => c.company_id === MOCK_PORTAL_FIRM_ID)
        .map(attachCompany);
    },
    async caseDetail(id: string): Promise<{ case: LegalCase; detail: PortalCaseDetail | null }> {
      const row = mockState.cases.find((c) => c.id === id && c.company_id === MOCK_PORTAL_FIRM_ID);
      if (!row) throw new ApiRequestError("Caso não encontrado.", 404);
      return {
        case: attachCompany(row),
        detail: MOCK_PORTAL_CASE_DETAILS[id] ?? {
          caseId: row.id,
          protocol: row.protocol,
          title: row.title ?? "—",
          area: row.area ?? "—",
          caseType: row.case_type ?? "—",
          criticality: "—",
          deadline: "—",
          summary: null,
          documents: [],
          delivery: null,
          timeline: buildTimeline({ status: row.pipeline_status, delivered: row.status === "enviado" }),
        },
      };
    },
    async metrics(_period: MetricPeriod = 30): Promise<PortalMetrics> {
      return { ...MOCK_PORTAL_METRICS };
    },
    async recipients(): Promise<PortalRecipient[]> {
      return mockState.portalRecipients.map((r) => ({ ...r }));
    },
    async createRecipient(data: PortalRecipientInput): Promise<PortalRecipient> {
      const created = { id: uid(), ...data };
      mockState.portalRecipients.push(created);
      return { ...created };
    },
    async updateRecipient(id: string, data: Partial<PortalRecipientInput>): Promise<PortalRecipient> {
      const idx = mockState.portalRecipients.findIndex((r) => r.id === id);
      if (idx < 0) throw new Error("Destinatário não encontrado.");
      mockState.portalRecipients[idx] = { ...mockState.portalRecipients[idx], ...data };
      return { ...mockState.portalRecipients[idx] };
    },
    async removeRecipient(id: string): Promise<{ success: true }> {
      mockState.portalRecipients = mockState.portalRecipients.filter((r) => r.id !== id);
      return { success: true };
    },
    async credential(): Promise<PortalCredential> {
      return { ...MOCK_PORTAL_CREDENTIAL };
    },
    async audit(): Promise<PortalAuditEvent[]> {
      return mockState.portalAudit.map((e) => ({ ...e }));
    },
  },
};

const liveApi: typeof mockApi = {
  session: {
    me: (_area: SessionArea) => request<SessionInfo>("/api/auth/me", { cache: "no-store" }),
    signout: async () => {
      await request<{ success: true }>("/api/auth/signout", { method: "POST" });
    },
  },
  clients: {
    list: () => request<Company[]>("/api/clients", { cache: "no-store" }),
    create: (data: CompanyCreateInput) =>
      request<Company>("/api/clients", { method: "POST", body: data }),
    update: (id: string, data: CompanyUpdateInput) =>
      request<Company>(`/api/clients/${id}`, { method: "PUT", body: data }),
    remove: (id: string) => request<{ success: true }>(`/api/clients/${id}`, { method: "DELETE" }),
    listUsers: (companyId: string) => request<FirmUser[]>(`/api/clients/${companyId}/users`, { cache: "no-store" }),
    createUser: (companyId: string, data: { name: string; email: string; password: string; job_title?: string }) =>
      request<{ user: FirmUser }>(`/api/clients/${companyId}/users`, {
        method: "POST",
        body: data,
      }),
    updateUser: (
      companyId: string,
      userId: string,
      data: { name: string; email: string; job_title?: string; password?: string },
    ) =>
      request<{ user: FirmUser }>(`/api/clients/${companyId}/users/${userId}`, {
        method: "PUT",
        body: data,
      }),
    setUserActive: (companyId: string, userId: string, active: boolean) =>
      request<{ user: FirmUser }>(`/api/clients/${companyId}/users/${userId}`, {
        method: "PATCH",
        body: { active },
      }),
    removeUser: (companyId: string, userId: string) =>
      request<{ success: true }>(`/api/clients/${companyId}/users/${userId}`, { method: "DELETE" }),
  },
  cases: {
    list: () => request<LegalCase[]>("/api/cases", { cache: "no-store" }),
    get: (id: string) => request<LegalCase>(`/api/cases/${id}`, { cache: "no-store" }),
  },
  admin: {
    businessMetrics: (period: MetricPeriod = 30) =>
      request<BusinessMetrics>(withQuery("/api/admin/metrics", { period }), { cache: "no-store" }),
    techHealth: () => request<TechHealth>("/api/admin/health", { cache: "no-store" }),
    credentials: () => request<ApiCredential[]>("/api/admin/credentials", { cache: "no-store" }),
    createCredential: (data: CredentialCreateInput) =>
      request<{ credential: ApiCredential; token: string }>("/api/admin/credentials", { method: "POST", body: data }),
    revokeCredential: (id: string) =>
      request<ApiCredential>(`/api/admin/credentials/${id}/revoke`, { method: "POST" }),
    auditEvents: (filters: AuditFilters = {}) =>
      request<AuditEvent[]>(withQuery("/api/admin/audit", filters), { cache: "no-store" }),
    lgpd: () => request<LgpdSummary>("/api/admin/lgpd", { cache: "no-store" }),
  },
  portal: {
    async session(): Promise<PortalSession> {
      const me = await request<SessionInfo>("/api/auth/me", { cache: "no-store" });
      return {
        firmId: me.company?.id ?? "",
        firmName: me.company?.name ?? "Escritório",
        plan: me.company?.plan ?? "—",
        userEmail: me.user.email,
      };
    },
    cases: () => request<LegalCase[]>("/api/portal/cases", { cache: "no-store" }),
    caseDetail: (id: string) =>
      request<{ case: LegalCase; detail: PortalCaseDetail | null }>(`/api/portal/cases/${id}`, { cache: "no-store" }),
    metrics: (period: MetricPeriod = 30) =>
      request<PortalMetrics>(withQuery("/api/portal/metrics", { period }), { cache: "no-store" }),
    recipients: () => request<PortalRecipient[]>("/api/portal/recipients", { cache: "no-store" }),
    createRecipient: (data: PortalRecipientInput) =>
      request<PortalRecipient>("/api/portal/recipients", { method: "POST", body: data }),
    updateRecipient: (id: string, data: Partial<PortalRecipientInput>) =>
      request<PortalRecipient>(`/api/portal/recipients/${id}`, { method: "PATCH", body: data }),
    removeRecipient: (id: string) =>
      request<{ success: true }>(`/api/portal/recipients/${id}`, { method: "DELETE" }),
    credential: () => request<PortalCredential>("/api/portal/credential", { cache: "no-store" }),
    audit: () => request<PortalAuditEvent[]>("/api/portal/audit", { cache: "no-store" }),
  },
};

export const api = {
  ...(useMockData ? mockApi : liveApi),
  auth: (mode: "signin", data: Record<string, string>) =>
    request<{
      user: {
        name: string;
        email: string;
        role: SessionInfo["user"]["role"];
        must_change_password: boolean;
      };
    }>(`/api/auth/${mode}`, {
      method: "POST",
      body: data,
    }),
  changePassword: (data: { current_password: string; new_password: string }) =>
    useMockData
      ? Promise.resolve({ success: true as const })
      : request<{ success: true }>("/api/auth/change-password", { method: "POST", body: data }),
  health: () => request<{ status: string; database: string }>("/api/health", { cache: "no-store" }),
  useMockData,
};
