import type { CaseChannel, CaseStatus, Company, LegalCase } from "./types";

const now = Date.now();
const h = (n: number) => new Date(now - n * 3600_000).toISOString();

export type CompanyLifecycle = "ativa" | "onboarding" | "inativa";

export type MockCompany = Company & {
  lifecycle_status: CompanyLifecycle;
};

export const MOCK_COMPANIES: MockCompany[] = [
  {
    id: "c1",
    name: "Andrade & Sócios Advogados",
    cnpj: "12.345.678/0001-90",
    contact_email: "contato@andradesocios.com.br",
    contact_phone: "(11) 4002-8922",
    plan: "Profissional",
    notes: "Foco em trabalhista e cível",
    created_at: h(720),
    cases_count: 142,
    lifecycle_status: "ativa",
  },
  {
    id: "c2",
    name: "Silva Pereira Jurídico",
    cnpj: "98.765.432/0001-10",
    contact_email: "juridico@silvapereira.com.br",
    contact_phone: "(21) 3030-1010",
    plan: "Enterprise",
    notes: "Cliente âncora — integração via API com CRM proprietário",
    created_at: h(1400),
    cases_count: 87,
    lifecycle_status: "ativa",
  },
  {
    id: "c3",
    name: "Costa & Lima Consultoria Legal",
    cnpj: "11.222.333/0001-44",
    contact_email: "contato@costalima.adv.br",
    contact_phone: "(51) 3500-2200",
    plan: "Starter",
    notes: "Onboarding em andamento",
    created_at: h(96),
    cases_count: 64,
    lifecycle_status: "onboarding",
  },
  {
    id: "c4",
    name: "Mendonça Tributário",
    cnpj: "22.333.444/0001-55",
    contact_email: "contato@mendoncatrib.com.br",
    contact_phone: "(31) 2121-7878",
    plan: "Profissional",
    notes: "Foco em contencioso tributário",
    created_at: h(500),
    cases_count: 19,
    lifecycle_status: "ativa",
  },
  {
    id: "c5",
    name: "Vasconcelos Advocacia",
    cnpj: "77.888.999/0001-22",
    contact_email: "novos@vasconcelos.com",
    contact_phone: "(41) 2200-3344",
    plan: "Profissional",
    notes: null,
    created_at: h(800),
    cases_count: 38,
    lifecycle_status: "ativa",
  },
  {
    id: "c6",
    name: "Ribeiro & Partners",
    cnpj: "11.444.777/0001-33",
    contact_email: "hello@ribeiro.partners",
    contact_phone: "(11) 5577-8800",
    plan: "Enterprise",
    notes: "Jurídico multinacional — multi-idioma.",
    created_at: h(2000),
    cases_count: 211,
    lifecycle_status: "ativa",
  },
];

function companySummary(id: string) {
  const c = MOCK_COMPANIES.find((x) => x.id === id);
  return c ? { id: c.id, name: c.name, plan: c.plan } : null;
}

export const MOCK_CASES: LegalCase[] = [
  {
    id: "1",
    case_code: "TR-3391",
    status: "relatorio_gerado",
    channel: "API",
    sender_registered: true,
    plan: "Profissional",
    deadline: h(-24),
    notes: "Triagem trabalhista concluída — relatório anexado.",
    submitted_at: h(2),
    updated_at: h(1),
    company_id: "c1",
    company: companySummary("c1"),
  },
  {
    id: "2",
    case_code: "TR-3390",
    status: "em_processamento",
    channel: "WhatsApp",
    sender_registered: true,
    plan: "Enterprise",
    deadline: h(-48),
    notes: "Cliente solicitou priorização.",
    submitted_at: h(3),
    updated_at: h(2),
    company_id: "c2",
    company: companySummary("c2"),
  },
  {
    id: "3",
    case_code: "TR-3389",
    status: "falha",
    channel: "CRM",
    sender_registered: true,
    plan: "Starter",
    deadline: null,
    notes: "Falha na integração com endpoint do cliente.",
    submitted_at: h(26),
    updated_at: h(25),
    company_id: "c3",
    company: companySummary("c3"),
  },
  {
    id: "4",
    case_code: "TR-3388",
    status: "em_validacao",
    channel: "Web",
    sender_registered: false,
    plan: "Profissional",
    deadline: h(-12),
    notes: "Documentação parcial — aguardando confirmação.",
    submitted_at: h(30),
    updated_at: h(28),
    company_id: "c4",
    company: companySummary("c4"),
  },
  {
    id: "5",
    case_code: "TR-3387",
    status: "relatorio_gerado",
    channel: "API",
    sender_registered: true,
    plan: "Profissional",
    deadline: h(-72),
    notes: null,
    submitted_at: h(48),
    updated_at: h(46),
    company_id: "c5",
    company: companySummary("c5"),
  },
  {
    id: "6",
    case_code: "TR-3386",
    status: "recebido",
    channel: "WhatsApp",
    sender_registered: true,
    plan: "Enterprise",
    deadline: h(-96),
    notes: "Caso de família — divórcio consensual.",
    submitted_at: h(10),
    updated_at: h(10),
    company_id: "c2",
    company: companySummary("c2"),
  },
  {
    id: "7",
    case_code: "TR-3385",
    status: "enviado",
    channel: "API",
    sender_registered: true,
    plan: "Profissional",
    deadline: h(-120),
    notes: null,
    submitted_at: h(26),
    updated_at: h(24),
    company_id: "c1",
    company: companySummary("c1"),
  },
  {
    id: "8",
    case_code: "TR-3384",
    status: "enviado",
    channel: "Web",
    sender_registered: true,
    plan: "Enterprise",
    deadline: h(-200),
    notes: "Análise contratual finalizada.",
    submitted_at: h(30),
    updated_at: h(28),
    company_id: "c6",
    company: companySummary("c6"),
  },
];

export type ApiCredential = {
  id: string;
  company_name: string;
  credential: string;
  status: "ativa" | "expirando" | "revogada";
  last_used: string;
  expires_at: string;
};

export const MOCK_API_CREDENTIALS: ApiCredential[] = [
  {
    id: "k1",
    company_name: "Andrade & Sócios",
    credential: "api-key-a3f1",
    status: "ativa",
    last_used: h(2),
    expires_at: "2027-03-05",
  },
  {
    id: "k2",
    company_name: "Silva Pereira Jurídico",
    credential: "api-key-9c02",
    status: "ativa",
    last_used: h(3),
    expires_at: "2026-11-18",
  },
  {
    id: "k3",
    company_name: "Costa & Lima Consultoria",
    credential: "api-key-77bd",
    status: "expirando",
    last_used: h(26),
    expires_at: "2026-09-15",
  },
];

export type AuditEvent = {
  id: string;
  at: string;
  company_name: string;
  event: string;
  correlation_id: string;
  detail: string;
};

export const MOCK_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: "a1",
    at: h(1),
    company_name: "Andrade & Sócios",
    event: "Relatório entregue",
    correlation_id: "c-8f21a",
    detail: '{"channel":"email","status":"OK"}',
  },
  {
    id: "a2",
    at: h(25),
    company_name: "Costa & Lima",
    event: "Falha de envio",
    correlation_id: "c-40b7e",
    detail: '{"provider":"crm","error":"timeout"}',
  },
  {
    id: "a3",
    at: h(4),
    company_name: "Silva Pereira Jurídico",
    event: "Recebimento",
    correlation_id: "c-11d90",
    detail: '{"channel":"WhatsApp","docs":3}',
  },
];

export const MOCK_BUSINESS_METRICS = {
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

export const MOCK_TECH_HEALTH = {
  apiUptime: "99,97%",
  smtpSuccess: "98,2%",
  smtpFailures: 7,
  apiLatency: "340ms",
  apiLatencyP95: "810ms",
  sqsStatus: "OK",
  sqsSub: "Sem acúmulo de mensagens",
  pipeline: {
    labels: ["OCR", "Anonimização", "Classificação", "Resumo", "Prioridade/Jurisp.", "Geração relatório"],
    values: [38, 22, 19, 54, 61, 17],
  },
};

export const MOCK_LGPD = {
  originalsRemoved: "100%",
  dataIncidents: 0,
};

/** Portal do escritório — sessão mock (Andrade & Sócios = c1). */
export const MOCK_PORTAL_FIRM_ID = "c1";

export const MOCK_PORTAL_SESSION = {
  firmId: MOCK_PORTAL_FIRM_ID,
  firmName: "Andrade & Sócios Advogados",
  plan: "Profissional",
  userEmail: "contato@andradesocios.com.br",
};

export type PortalTimelineStep = {
  title: string;
  meta: string;
  status: "done" | "running" | "pending";
};

export type PortalCaseDetail = {
  caseId: string;
  protocol: string;
  area: string;
  caseType: string;
  criticality: string;
  documents: { name: string; status: string }[];
  delivery: { channel: string; recipient: string; at: string; status: string } | null;
  timeline: PortalTimelineStep[];
};

export const MOCK_PORTAL_CASE_DETAILS: Record<string, PortalCaseDetail> = {
  "1": {
    caseId: "1",
    protocol: "2026-000391",
    area: "Trabalhista",
    caseType: "Rescisão indireta",
    criticality: "Média",
    documents: [
      { name: "Petição inicial.pdf", status: "Processado" },
      { name: "Comprovante_admissao.jpg", status: "Processado" },
    ],
    delivery: {
      channel: "e-mail",
      recipient: "ana.***@andradesocios.com.br",
      at: h(1.1),
      status: "Entregue",
    },
    timeline: [
      { title: "Recebimento e validação", meta: "09:12:03 → 09:12:04 · OK", status: "done" },
      { title: "Anonimização de dados sensíveis", meta: "09:12:04 → 09:12:26 · OK", status: "done" },
      { title: "OCR e normalização de texto", meta: "09:12:26 → 09:13:04 · OK", status: "done" },
      { title: "Classificação do tipo de processo", meta: "09:13:04 → 09:13:19 · OK", status: "done" },
      { title: "Resumo estruturado e prazos", meta: "09:13:19 → 09:14:02 · OK", status: "done" },
      { title: "Consulta de jurisprudência", meta: "09:14:02 → 09:14:58 · 3 referências encontradas", status: "done" },
      { title: "Geração e envio do relatório", meta: "09:14:58 → 09:15:12 · Entregue por e-mail", status: "done" },
    ],
  },
};

export const MOCK_PORTAL_METRICS = {
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
    labels: ["Relatório gerado", "Em processamento", "Em validação", "Falha", "Recebido"],
    values: [34, 6, 7, 3, 8],
  },
  casesByArea: {
    labels: ["Trabalhista", "Cível", "Tributário", "Consumidor", "Contratual"],
    values: [22, 15, 9, 7, 5],
  },
};

export type PortalRecipient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferred_channel: "E-mail" | "WhatsApp" | "CRM";
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

export type PortalAuditEvent = {
  id: string;
  at: string;
  event: string;
  description: string;
};

export const MOCK_PORTAL_AUDIT: PortalAuditEvent[] = [
  {
    id: "pa1",
    at: h(1),
    event: "Relatório entregue",
    description: "Relatório do caso #TR-3391 entregue por e-mail com sucesso.",
  },
  {
    id: "pa2",
    at: h(2),
    event: "Caso recebido",
    description: "Documento recebido via API e validado com sucesso.",
  },
  {
    id: "pa3",
    at: h(25),
    event: "Falha de envio",
    description: "Não foi possível entregar o relatório do caso #TR-3389 (canal CRM).",
  },
  {
    id: "pa4",
    at: h(28),
    event: "Em validação",
    description: "Caso #TR-3388 aguardando revisão humana antes da entrega final.",
  },
];

export const MOCK_PORTAL_CREDENTIAL = {
  status: "ativa" as const,
  last_used: h(2),
  expires_at: "2027-03-05",
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

export type CaseCreateInput = Omit<LegalCase, "id" | "company" | "submitted_at" | "updated_at">;
export type CaseUpdateInput = Partial<Omit<LegalCase, "id" | "company" | "submitted_at">>;
export type CompanyCreateInput = Omit<Company, "id" | "created_at" | "cases_count"> & {
  lifecycle_status?: CompanyLifecycle;
};
export type CompanyUpdateInput = Partial<CompanyCreateInput>;

export type { CaseChannel, CaseStatus };
