export const CASE_STATUSES = ["recebido", "em_processamento", "relatorio_gerado", "enviado", "falha"] as const;
/** triage_sessions.status as written by triaige-srv-orchestrator (SessionStatus enum). */
export const SESSION_STATUSES = [
  "RECEIVING_DOCUMENTS", "QUEUED_FOR_PROCESSING", "CANCELLED", "COMPLETED", "PARTIALLY_COMPLETED", "FAILED",
  "ANALYZING", "ANALYSIS_COMPLETED", "ANALYSIS_FAILED",
] as const;
export const PLANS = ["Starter", "Profissional", "Enterprise"] as const;
export const COMPANY_LIFECYCLES = ["ativa", "onboarding", "inativa"] as const;
export const USER_ROLES = ["admin", "ops", "firm_user"] as const;
export const STAFF_ROLES = ["admin", "ops"] as const;
export const RECIPIENT_CHANNELS = ["E-mail", "WhatsApp", "CRM"] as const;
export const METRIC_PERIODS = [7, 30, 90] as const;

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  recebido: "Recebido",
  em_processamento: "Em processamento",
  relatorio_gerado: "Relatório gerado",
  enviado: "Enviado",
  falha: "Falha",
};

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  RECEIVING_DOCUMENTS: "Recebendo documentos",
  QUEUED_FOR_PROCESSING: "Na fila de processamento",
  CANCELLED: "Cancelada",
  COMPLETED: "Pré-processamento concluído",
  PARTIALLY_COMPLETED: "Pré-processamento parcial",
  FAILED: "Falha no pré-processamento",
  ANALYZING: "Em análise pela IA",
  ANALYSIS_COMPLETED: "Análise concluída",
  ANALYSIS_FAILED: "Falha na análise",
};

export type CaseStatus = (typeof CASE_STATUSES)[number];
export type SessionStatus = (typeof SESSION_STATUSES)[number];
export type CompanyLifecycle = (typeof COMPANY_LIFECYCLES)[number];
export type UserRole = (typeof USER_ROLES)[number];
export type RecipientChannel = (typeof RECIPIENT_CHANNELS)[number];
export type MetricPeriod = (typeof METRIC_PERIODS)[number];

/** A law firm (`law_firms`). */
export type Company = {
  id: string;
  name: string;
  cnpj: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  plan: string;
  notes: string | null;
  created_at: string;
  cases_count: number;
  users_count: number;
  lifecycle_status?: CompanyLifecycle;
};

/** Portal login for a law firm (`app_users` with role firm_user). */
export type FirmUser = {
  id: string;
  name: string;
  email: string;
  job_title: string | null;
  active: boolean;
  /** True until the user sets their own password (temp password from triAIge staff). */
  must_change_password: boolean;
  created_at: string;
};

export type CompanySummary = Pick<Company, "id" | "name" | "plan">;

/** A triage session (`triage_sessions`) joined with its `legal_cases` row. */
export type LegalCase = {
  id: string;
  protocol: string;
  title: string | null;
  area: string | null;
  case_type: string | null;
  status: CaseStatus;
  pipeline_status: SessionStatus;
  correlation_id: string;
  sender_registered: boolean;
  submitted_at: string;
  updated_at: string;
  company_id: string;
  company: CompanySummary | null;
};

export type SessionInfo = {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    job_title: string | null;
    must_change_password: boolean;
  };
  company: CompanySummary | null;
};

export type ApiCredential = {
  id: string;
  company_id?: string;
  company_name: string;
  credential: string;
  status: CredentialStatus;
  last_used: string;
  /** Empty when the credential never expires. */
  expires_at: string;
};

export type CredentialStatus = "ativa" | "expirando" | "expirada" | "revogada" | "inativa";

export type AuditEvent = {
  id: string;
  at: string;
  company_name: string;
  event: string;
  event_type?: string;
  source?: "orchestrator" | "backoffice";
  correlation_id: string;
  detail: string;
};

export type AuditFilters = {
  company_id?: string;
  event_type?: string;
  correlation_id?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

/** Orchestrator events (`audit_events`) followed by backoffice events (`backoffice_audit_events`). */
export const AUDIT_EVENT_TYPES: { value: string; label: string }[] = [
  { value: "session_created", label: "Sessão criada" },
  { value: "document_uploaded", label: "Documento recebido" },
  { value: "session_finalized", label: "Recebimento finalizado" },
  { value: "mcp_result_received", label: "Resultado do pipeline" },
  { value: "ai_analysis_started", label: "Análise de IA iniciada" },
  { value: "ai_analysis_completed", label: "Análise de IA concluída" },
  { value: "ai_analysis_failed", label: "Falha na análise de IA" },
  { value: "law_firm_created", label: "Escritório cadastrado" },
  { value: "law_firm_updated", label: "Escritório atualizado" },
  { value: "law_firm_deleted", label: "Escritório removido" },
  { value: "user_signup", label: "Usuário do portal criado" },
  { value: "credential_created", label: "Credencial criada" },
  { value: "credential_revoked", label: "Credencial revogada" },
  { value: "data_incident", label: "Incidente de dados" },
];

export type BusinessMetrics = {
  casesProcessed: number;
  casesProcessedPrev: number;
  avgTriage: string;
  automationRate: string;
  activeOffices: number;
  newContracts: number;
  casesByOffice: { labels: string[]; values: number[] };
  casesByArea: { labels: string[]; values: number[] };
  volume: { labels: string[]; received: number[]; completed: number[] };
};

export type TechHealth = {
  apiUptime: string | null;
  smtpSuccess: string;
  smtpFailures: number;
  apiLatency: string | null;
  apiLatencyP95: string | null;
  sqsStatus: string | null;
  sqsSub: string | null;
  pipeline: { labels: string[]; values: number[] };
};

export type LgpdSummary = {
  originalsRemoved: string;
  dataIncidents: number;
};

export type PortalSession = {
  firmId: string;
  firmName: string;
  plan: string;
  userEmail: string;
};

export type PortalTimelineStep = {
  title: string;
  meta: string;
  status: "done" | "running" | "pending" | "failed";
  started_at?: string | null;
  finished_at?: string | null;
};

export type PortalCaseDetail = {
  caseId: string;
  protocol: string;
  title: string;
  area: string;
  caseType: string;
  criticality: string;
  deadline: string;
  summary: string | null;
  documents: { name: string; status: string }[];
  delivery: { channel: string; recipient: string; at: string; status: string } | null;
  timeline: PortalTimelineStep[];
};

export type PortalMetrics = {
  casesProcessed: number;
  casesProcessedPrev: number;
  avgTriage: string;
  automationRate: string;
  hoursSaved: string;
  volume: { labels: string[]; received: number[]; completed: number[] };
  statusDistribution: { labels: string[]; values: number[] };
  casesByArea: { labels: string[]; values: number[] };
};

/** A law firm contact (`law_firm_contacts`) that receives reports. */
export type PortalRecipient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferred_channel: RecipientChannel;
};

export type PortalRecipientInput = Omit<PortalRecipient, "id">;

export type PortalAuditEvent = {
  id: string;
  at: string;
  event: string;
  description: string;
};

export type PortalCredential = {
  status: CredentialStatus | "inexistente";
  last_used: string;
  expires_at: string;
};

export type ApiError = { error: string; details?: string[] };
