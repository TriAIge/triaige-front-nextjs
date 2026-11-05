import type {
  ApiCredential, AuditEvent, BusinessMetrics, CaseStatus, Company, CompanyLifecycle, FirmUser, LegalCase, LgpdSummary,
  PortalAuditEvent, PortalCaseDetail, PortalCredential, PortalMetrics, PortalRecipient, PortalSession, SessionInfo, StaffUser,
  SessionStatus, TechHealth,
} from "./types";

const now = Date.now();
const h = (n: number) => new Date(now - n * 3600_000).toISOString();

export type MockCompany = Company & {
  lifecycle_status: CompanyLifecycle;
};

export const MOCK_COMPANIES: MockCompany[] = [
  {
    id: "c1",
    name: "Andrade & Sócios Advogados",
    cnpj: "12345678000190",
    contact_email: "contato@andradesocios.com.br",
    contact_phone: "(11) 4002-8922",
    plan: "Profissional",
    notes: "Foco em trabalhista e cível",
    created_at: h(720),
    cases_count: 4,
    users_count: 1,
    lifecycle_status: "ativa",
  },
  {
    id: "c2",
    name: "Silva Pereira Jurídico",
    cnpj: "98765432000110",
    contact_email: "juridico@silvapereira.com.br",
    contact_phone: "(21) 3030-1010",
    plan: "Enterprise",
    notes: "Cliente âncora — integração via API com CRM proprietário",
    created_at: h(1400),
    cases_count: 2,
    users_count: 0,
    lifecycle_status: "ativa",
  },
  {
    id: "c3",
    name: "Costa & Lima Consultoria Legal",
    cnpj: "11222333000144",
    contact_email: "contato@costalima.adv.br",
    contact_phone: "(51) 3500-2200",
    plan: "Starter",
    notes: "Onboarding em andamento",
    created_at: h(96),
    cases_count: 1,
    users_count: 0,
    lifecycle_status: "onboarding",
  },
  {
    id: "c4",
    name: "Mendonça Tributário",
    cnpj: "22333444000155",
    contact_email: "contato@mendoncatrib.com.br",
    contact_phone: "(31) 2121-7878",
    plan: "Profissional",
    notes: "Foco em contencioso tributário",
    created_at: h(500),
    cases_count: 1,
    users_count: 0,
    lifecycle_status: "ativa",
  },
  {
    id: "c5",
    name: "Vasconcelos Advocacia",
    cnpj: "77888999000122",
    contact_email: "novos@vasconcelos.com",
    contact_phone: "(41) 2200-3344",
    plan: "",
    notes: null,
    created_at: h(800),
    cases_count: 0,
    users_count: 0,
    lifecycle_status: "inativa",
  },
];

export const MOCK_FIRM_USERS: (FirmUser & { company_id: string })[] = [
  {
    id: "u-portal",
    company_id: "c1",
    name: "Ana Ribeiro",
    email: "contato@andradesocios.com.br",
    job_title: "Sócia",
    active: true,
    must_change_password: false,
    created_at: h(700),
  },
];

function companySummary(id: string) {
  const c = MOCK_COMPANIES.find((x) => x.id === id);
  return c ? { id: c.id, name: c.name, plan: c.plan } : null;
}

function mockCase(
  id: string, companyId: string, protocol: string, title: string, area: string | null, caseType: string | null,
  status: CaseStatus, pipelineStatus: SessionStatus, submittedHoursAgo: number, updatedHoursAgo: number,
): LegalCase {
  return {
    id, protocol, title, area, case_type: caseType, status, pipeline_status: pipelineStatus,
    correlation_id: `corr-${id.padStart(4, "0")}`, sender_registered: true,
    submitted_at: h(submittedHoursAgo), updated_at: h(updatedHoursAgo),
    company_id: companyId, company: companySummary(companyId),
  };
}

export const MOCK_CASES: LegalCase[] = [
  mockCase("1", "c1", "TRI-2026-000101", "Rescisão indireta — horas extras", "Trabalhista", "Rescisão indireta", "enviado", "ANALYSIS_COMPLETED", 2, 1),
  mockCase("2", "c1", "TRI-2026-000102", "Indenização por negativação indevida", "Cível", "Danos morais", "falha", "ANALYSIS_FAILED", 26, 25),
  mockCase("3", "c1", "TRI-2026-000103", "Execução fiscal — ICMS", "Tributário", "Execução fiscal", "em_processamento", "ANALYZING", 3, 1),
  mockCase("4", "c1", "TRI-2026-000104", "Cobrança indevida de tarifa bancária", null, null, "recebido", "RECEIVING_DOCUMENTS", 1, 1),
  mockCase("5", "c2", "TRI-2026-000105", "Revisão de contrato de fornecimento", "Contratual", "Revisão contratual", "em_processamento", "QUEUED_FOR_PROCESSING", 5, 4),
  mockCase("6", "c2", "TRI-2026-000099", "Vício de produto — eletrodoméstico", "Consumidor", "Vício do produto", "relatorio_gerado", "ANALYSIS_COMPLETED", 48, 46),
  mockCase("7", "c3", "TRI-2026-000098", "Ação de despejo por falta de pagamento", "Cível", "Despejo", "relatorio_gerado", "ANALYSIS_COMPLETED", 30, 28),
  mockCase("8", "c4", "TRI-2026-000097", "Compensação de créditos de PIS/COFINS", "Tributário", "Compensação tributária", "falha", "FAILED", 70, 69),
];

export const MOCK_API_CREDENTIALS: ApiCredential[] = [
  {
    id: "k1",
    company_id: "c1",
    company_name: "Andrade & Sócios Advogados",
    credential: "trg_live_a3f…",
    status: "ativa",
    last_used: h(2),
    expires_at: "",
  },
  {
    id: "k2",
    company_id: "c2",
    company_name: "Silva Pereira Jurídico",
    credential: "trg_live_9c0…",
    status: "ativa",
    last_used: h(3),
    expires_at: "2027-11-18T00:00:00.000Z",
  },
  {
    id: "k3",
    company_id: "c3",
    company_name: "Costa & Lima Consultoria Legal",
    credential: "trg_live_77b…",
    status: "expirando",
    last_used: h(26),
    expires_at: new Date(now + 10 * 86_400_000).toISOString(),
  },
  {
    id: "k4",
    company_id: "c5",
    company_name: "Vasconcelos Advocacia",
    credential: "Integração legada",
    status: "inativa",
    last_used: h(900),
    expires_at: "",
  },
];

export const MOCK_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: "a1",
    at: h(1),
    company_name: "Andrade & Sócios Advogados",
    event: "Análise de IA concluída",
    event_type: "ai_analysis_completed",
    source: "orchestrator",
    correlation_id: "corr-0001",
    detail: "TRI-2026-000101 · Relatório gerado",
  },
  {
    id: "a2",
    at: h(25),
    company_name: "Andrade & Sócios Advogados",
    event: "Falha na análise de IA",
    event_type: "ai_analysis_failed",
    source: "orchestrator",
    correlation_id: "corr-0002",
    detail: "TRI-2026-000102 · Timeout no mcp-ai",
  },
  {
    id: "a3",
    at: h(4),
    company_name: "Silva Pereira Jurídico",
    event: "Recebimento finalizado",
    event_type: "session_finalized",
    source: "orchestrator",
    correlation_id: "corr-0005",
    detail: "TRI-2026-000105 · 2 documentos",
  },
  {
    id: "a4",
    at: h(96),
    company_name: "Costa & Lima Consultoria Legal",
    event: "Escritório cadastrado",
    event_type: "law_firm_created",
    source: "backoffice",
    correlation_id: "",
    detail: "Costa & Lima Consultoria Legal · por demo@triaige.ai",
  },
];

export const MOCK_BUSINESS_METRICS: BusinessMetrics = {
  casesProcessed: 342,
  casesProcessedPrev: 290,
  avgTriage: "4min 12s",
  automationRate: "91,4%",
  activeOffices: 12,
  newContracts: 2,
  casesByOffice: {
    labels: ["Andrade & Sócios", "Silva Pereira", "Costa & Lima", "Ribeiro & Partners", "Vasconcelos", "Mendonça Trib."],
    values: [142, 87, 64, 58, 31, 19],
  },
  casesByArea: {
    labels: ["Trabalhista", "Cível", "Tributário", "Consumidor", "Contratual"],
    values: [128, 96, 58, 40, 20],
  },
  volume: {
    labels: ["29/07", "01/08", "04/08", "07/08", "10/08", "13/08", "16/08", "19/08", "22/08", "25/08", "27/08"],
    received: [6, 9, 7, 11, 10, 14, 12, 15, 13, 16, 13],
    completed: [5, 8, 7, 10, 9, 13, 12, 14, 12, 15, 12],
  },
};

export const MOCK_TECH_HEALTH: TechHealth = {
  apiUptime: "99,97%",
  smtpSuccess: "98,2%",
  smtpFailures: 7,
  apiLatency: "340ms",
  apiLatencyP95: "810ms",
  sqsStatus: "OK",
  sqsSub: "Sem acúmulo de mensagens",
  pipeline: {
    labels: ["Upload", "Finalização", "OCR", "Anonimização", "Agrupamento", "Resumo", "Análise IA"],
    values: [2, 1, 38, 22, 6, 54, 61],
  },
};

export const MOCK_LGPD: LgpdSummary = {
  originalsRemoved: "100%",
  dataIncidents: 0,
};

/** Portal do escritório — sessão mock (Andrade & Sócios = c1). */
export const MOCK_PORTAL_FIRM_ID = "c1";

export const MOCK_PORTAL_SESSION: PortalSession = {
  firmId: MOCK_PORTAL_FIRM_ID,
  firmName: "Andrade & Sócios Advogados",
  plan: "Profissional",
  userEmail: "contato@andradesocios.com.br",
};

export const MOCK_STAFF_USERS: StaffUser[] = [
  {
    id: "u-admin",
    name: "Equipe triAIge",
    email: "ops@triaige.ai",
    job_title: "Operações",
    role: "admin",
    active: true,
    must_change_password: false,
    created_at: h(900),
  },
];

export const MOCK_STAFF_SESSION: SessionInfo = {
  user: {
    id: "u-admin",
    name: "Equipe triAIge",
    email: "ops@triaige.ai",
    role: "admin",
    job_title: "Operações",
    must_change_password: false,
  },
  company: null,
};

export const MOCK_FIRM_SESSION: SessionInfo = {
  user: {
    id: "u-portal",
    name: "Ana Ribeiro",
    email: MOCK_PORTAL_SESSION.userEmail,
    role: "firm_user",
    job_title: "Sócia",
    must_change_password: false,
  },
  company: { id: MOCK_PORTAL_FIRM_ID, name: MOCK_PORTAL_SESSION.firmName, plan: MOCK_PORTAL_SESSION.plan },
};

const at = (hoursAgo: number) => h(hoursAgo);

export const MOCK_PORTAL_CASE_DETAILS: Record<string, PortalCaseDetail> = {
  "1": {
    caseId: "1",
    protocol: "TRI-2026-000101",
    title: "Rescisão indireta — horas extras",
    area: "Trabalhista",
    caseType: "Rescisão indireta",
    criticality: "Alta",
    deadline: "28/10/2026",
    summary:
      "Empregado relata ausência de pagamento de horas extras por 18 meses e pede o reconhecimento da rescisão indireta. " +
      "Há controles de ponto e holerites que sustentam o pedido.",
    documents: [
      { name: "Petição inicial.pdf", status: "Processado" },
      { name: "Comprovante_admissao.jpg", status: "Processado" },
    ],
    delivery: {
      channel: "e-mail",
      recipient: "ana***@andradesocios.com.br",
      at: at(1.1),
      status: "Entregue",
    },
    timeline: [
      { title: "Recebimento dos documentos", meta: "Concluído", status: "done", started_at: at(2), finished_at: at(1.95) },
      { title: "OCR e normalização de texto", meta: "Concluído", status: "done", started_at: at(1.95), finished_at: at(1.8) },
      { title: "Anonimização de dados sensíveis", meta: "Concluído", status: "done", started_at: at(1.8), finished_at: at(1.7) },
      { title: "Agrupamento de anexos", meta: "Concluído", status: "done", started_at: at(1.7), finished_at: at(1.65) },
      { title: "Resumo das evidências", meta: "Concluído", status: "done", started_at: at(1.65), finished_at: at(1.4) },
      { title: "Análise jurídica por IA", meta: "Concluído", status: "done", started_at: at(1.4), finished_at: at(1.15) },
      { title: "Envio do relatório", meta: "Concluído", status: "done", started_at: null, finished_at: at(1.1) },
    ],
  },
};

export const MOCK_PORTAL_METRICS: PortalMetrics = {
  casesProcessed: 58,
  casesProcessedPrev: 49,
  avgTriage: "4min 08s",
  automationRate: "92,1%",
  hoursSaved: "9,7h",
  volume: {
    labels: ["08/08", "11/08", "14/08", "17/08", "20/08", "23/08", "26/08", "29/08", "01/09", "04/09", "06/09"],
    received: [3, 4, 2, 5, 4, 6, 5, 6, 5, 7, 6],
    completed: [3, 3, 2, 4, 4, 5, 5, 5, 5, 6, 6],
  },
  statusDistribution: {
    labels: ["Enviado", "Relatório gerado", "Em processamento", "Falha", "Recebido"],
    values: [30, 4, 13, 3, 8],
  },
  casesByArea: {
    labels: ["Trabalhista", "Cível", "Tributário", "Consumidor", "Contratual"],
    values: [22, 15, 9, 7, 5],
  },
};

export const MOCK_PORTAL_RECIPIENTS: PortalRecipient[] = [
  {
    id: "r1",
    name: "Ana Ribeiro",
    email: "ana.ribeiro@andradesocios.com.br",
    phone: "(11) 9•••-1234",
    preferred_channel: "E-mail",
  },
  {
    id: "r2",
    name: "Paulo Andrade",
    email: "paulo@andradesocios.com.br",
    phone: "(11) 9•••-8890",
    preferred_channel: "WhatsApp",
  },
];

export const MOCK_PORTAL_AUDIT: PortalAuditEvent[] = [
  {
    id: "pa1",
    at: h(1),
    event: "Análise de IA concluída",
    description: "Relatório do caso TRI-2026-000101 gerado.",
  },
  {
    id: "pa2",
    at: h(2),
    event: "Recebimento finalizado",
    description: "Documentos do caso TRI-2026-000101 recebidos e enviados para processamento.",
  },
  {
    id: "pa3",
    at: h(25),
    event: "Falha na análise de IA",
    description: "A análise do caso TRI-2026-000102 falhou e será reavaliada pela equipe triAIge.",
  },
  {
    id: "pa4",
    at: h(26),
    event: "Sessão criada",
    description: "Caso TRI-2026-000102 aberto via API.",
  },
];

export const MOCK_PORTAL_CREDENTIAL: PortalCredential = {
  status: "ativa",
  last_used: h(2),
  expires_at: "",
};

export function cloneCompanies(): MockCompany[] {
  return MOCK_COMPANIES.map((c) => ({ ...c }));
}

export function cloneCases(): LegalCase[] {
  return MOCK_CASES.map((c) => ({
    ...c,
    company: c.company ? { ...c.company } : null,
  }));
}

export type CompanyCreateInput = Omit<Company, "id" | "created_at" | "cases_count" | "users_count"> & {
  lifecycle_status?: CompanyLifecycle;
};
export type CompanyUpdateInput = Partial<CompanyCreateInput>;

export type { CaseStatus, CompanyLifecycle };
