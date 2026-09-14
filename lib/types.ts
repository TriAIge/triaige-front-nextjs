export const CASE_STATUSES = ["recebido", "em_validacao", "em_processamento", "relatorio_gerado", "enviado", "falha"] as const;
export const CASE_CHANNELS = ["API", "Web", "WhatsApp", "CRM"] as const;
export const PLANS = ["Starter", "Profissional", "Enterprise"] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];
export type CaseChannel = (typeof CASE_CHANNELS)[number];

export type CompanyLifecycle = "ativa" | "onboarding" | "inativa";

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
  /** Present in mock mode; optional when loading from API. */
  lifecycle_status?: CompanyLifecycle;
};

export type CompanySummary = Pick<Company, "id" | "name" | "plan">;

export type LegalCase = {
  id: string;
  case_code: string;
  status: CaseStatus;
  channel: CaseChannel;
  sender_registered: boolean;
  plan: string | null;
  deadline: string | null;
  notes: string | null;
  submitted_at: string;
  updated_at: string;
  company_id: string | null;
  company: CompanySummary | null;
};

export type ApiError = { error: string; details?: string[] };

