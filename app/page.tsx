import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Brain,
  CheckCircle2,
  Code2,
  FileText,
  Gauge,
  Globe,
  Lock,
  MessageCircle,
  Network,
  Scale,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";

export const metadata = {
  title: "triAIge — Inteligência Jurídica para Operações em Escala",
  description:
    "API e assistente de IA para triagem jurídica, análise de documentos, predição de casos e automação para escritórios e departamentos jurídicos.",
};


/* ----------------------------- shared atoms ----------------------------- */

function LogoMark() {
  return (
    <Link href="/" className="flex items-center group" aria-label="triAIge — início">
      <img src="/logo.png" alt="triAIge" className="h-" />
    </Link>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-soft border border-brand/20 text-brand text-[11px] font-semibold uppercase tracking-[0.18em]">
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium">
      {children}
    </span>
  );
}

/* --------------------------------- nav --------------------------------- */

function Nav() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <LogoMark />
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#platform" className="hover:text-foreground transition-colors">Plataforma</a>
          <a href="#how" className="hover:text-foreground transition-colors">Como funciona</a>
          <a href="#api" className="hover:text-foreground transition-colors">API Docs</a>
          <a href="#security" className="hover:text-foreground transition-colors">Segurança</a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex h-9 items-center px-4 text-sm font-medium border border-border rounded-full hover:bg-secondary transition-colors text-foreground"
          >
            Login
          </Link>
          <a
            href="mailto:contato@triaige.ai?subject=Solicita%C3%A7%C3%A3o%20de%20demonstra%C3%A7%C3%A3o%20-%20triAIge&body=Ol%C3%A1%2C%20gostaria%20de%20agendar%20uma%20demonstra%C3%A7%C3%A3o%20da%20plataforma%20triAIge.%0A%0ANome%3A%0AEmpresa%3A%0ACargo%3A%0ATelefone%3A%0AN%C3%BAmero%20de%20usu%C3%A1rios%3A%0AContexto%3A%0A"
            className="h-9 inline-flex bg-brand text-brand-foreground items-center gap-1.5 px-4 text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
          >
            Solicitar demo <ArrowRight className="size-3.5" />
          </a>
        </div>
      </div>
    </nav>
  );
}

/* --------------------------------- hero -------------------------------- */

function Hero() {
  return (
    <header className="relative overflow-hidden pt-20 pb-32 px-6">
      <div className="absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-[700px] rounded-full bg-brand/15 blur-[140px]" />
      <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div className="animate-fade-up">
          <Pill>
            <span className="size-1.5 rounded-full bg-brand animate-pulse-soft" />
            Disponível para Enterprise
          </Pill>
          <h1 className="mt-6 font-display text-white leading-[0.95] tracking-tight text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] text-balance">
            Inteligência jurídica{" "}
            <span className="italic text-brand">redefinida.</span>
          </h1>
          <p className="mt-7 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed text-pretty">
            Triagem autônoma, leitura inteligente de documentos e predição de
            êxito de casos via a API LegalTech mais segura do mercado.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="h-12 px-7 bg-brand text-brand-foreground font-semibold rounded-xl brand-glow hover:opacity-95 transition-opacity inline-flex items-center gap-2"
            >
              Começar integração <ArrowRight className="size-4" />
            </Link>
            <a
              href="mailto:contato@triaige.ai?subject=Falar%20com%20vendas%20-%20triAIge"
              className="h-12 px-7 bg-secondary border border-border text-foreground font-semibold rounded-xl hover:bg-card transition-colors inline-flex items-center gap-2"
            >
              Falar com vendas <ArrowUpRight className="size-4" />
            </a>
          </div>
          <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-brand" /> LGPD</div>
            <div className="flex items-center gap-2"><Lock className="size-4 text-brand" /> SOC 2 Type II</div>
            <div className="flex items-center gap-2"><Gauge className="size-4 text-brand" /> 99.99% Uptime</div>
          </div>
        </div>

        <HeroMockup />
      </div>
    </header>
  );
}

function HeroMockup() {
  return (
    <div className="relative animate-fade-up [animation-delay:120ms]">
      <div className="absolute -inset-12 bg-brand/20 blur-[120px] rounded-full" />
      <div className="relative glass-card rounded-3xl p-5 md:p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-border">
          <div className="flex gap-1.5">
            <div className="size-2.5 rounded-full bg-destructive/60" />
            <div className="size-2.5 rounded-full bg-yellow-500/60" />
            <div className="size-2.5 rounded-full bg-success/60" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono">
            Case Intelligence Engine v4.0
          </span>
        </div>

        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-full bg-brand-soft text-brand grid place-items-center font-display italic text-sm shrink-0">
              AI
            </div>
            <div className="flex-1 p-3.5 rounded-2xl bg-secondary border border-border text-sm leading-relaxed text-foreground/90">
              Analisei <span className="text-brand font-medium">contrato_v2.pdf</span>.
              Identifiquei 3 cláusulas críticas de responsabilidade e 84% de
              divergência com precedentes do tribunal estadual.
            </div>
          </div>

          <div className="pl-12 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Probabilidade de êxito</span>
              <span className="text-success font-mono font-medium">92.4%</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-success w-[92%] rounded-full" />
            </div>
          </div>

          <div className="pl-12 grid grid-cols-2 gap-2.5">
            <div className="glass-card p-3 rounded-xl">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Categoria</div>
              <div className="text-sm font-medium text-foreground">Trabalhista</div>
            </div>
            <div className="glass-card p-3 rounded-xl">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Risco</div>
              <div className="text-sm font-medium text-foreground">Médio-Alto</div>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:flex absolute -bottom-6 -left-8 glass-card rounded-2xl p-4 shadow-xl items-center gap-3 backdrop-blur-xl">
        <div className="size-9 rounded-full bg-success/15 grid place-items-center">
          <CheckCircle2 className="size-4 text-success" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</div>
          <div className="text-sm font-medium text-foreground">Caso qualificado e roteado</div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- trust -------------------------------- */

function Trust() {
  const metrics = [
    { value: "2.4M+", label: "Documentos analisados" },
    { value: "99.99%", label: "Uptime da API" },
    { value: "450+", label: "Escritórios e empresas" },
    { value: "<280ms", label: "Latência média" },
  ];
  return (
    <section className="border-y border-border bg-surface/40">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {metrics.map((m) => (
            <div key={m.label} className="text-center">
              <div className="font-display text-4xl md:text-5xl text-foreground">{m.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ features ------------------------------- */

function Features() {
  return (
    <section id="platform" className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-16">
          <SectionLabel>Plataforma</SectionLabel>
          <h2 className="mt-3 font-display text-4xl md:text-5xl text-foreground leading-tight text-balance">
            Construído para operações jurídicas em <span className="italic text-brand">escala</span>.
          </h2>
          <p className="mt-5 text-muted-foreground text-pretty">
            Da captura no WhatsApp ao roteamento dentro do seu CRM. Toda a
            jornada da triagem automatizada por IA.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-4">
          {/* Conversational intake */}
          <div className="md:col-span-8 glass-card rounded-3xl p-8 relative overflow-hidden group">
            <div className="max-w-md relative z-10">
              <div className="size-10 rounded-xl bg-brand-soft text-brand grid place-items-center mb-5">
                <MessageCircle className="size-5" />
              </div>
              <h3 className="font-display text-2xl text-foreground mb-3">Atendimento conversacional</h3>
              <p className="text-sm text-muted-foreground">
                IA que qualifica leads no WhatsApp e no chat do site, coleta
                documentos e identifica o tipo de caso antes de qualquer
                intervenção humana.
              </p>
            </div>
            <div className="mt-10 md:mt-0 md:absolute md:right-6 md:bottom-6 md:w-80">
              <div className="rounded-2xl border border-success/20 bg-success/5 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="size-2 rounded-full bg-success animate-pulse-soft" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-success">WhatsApp ao vivo</span>
                </div>
                <div className="space-y-2.5">
                  <div className="p-2.5 bg-secondary rounded-lg text-xs text-foreground/90">Preciso de ajuda com uma disputa contratual.</div>
                  <div className="p-2.5 bg-success/15 rounded-lg text-xs text-foreground">Por favor envie o contrato. Vou analisar agora.</div>
                </div>
              </div>
            </div>
          </div>

          {/* OCR */}
          <FeatureCard
            className="md:col-span-4"
            icon={<ScanLine className="size-5" />}
            title="OCR jurídico"
            desc="Leitura de PDFs complexos, manuscritos e processos. Extrai datas, valores e entidades automaticamente."
          />

          <FeatureCard
            className="md:col-span-4"
            icon={<Brain className="size-5" />}
            title="Triagem inteligente"
            desc="Classificação automática do tipo de caso com base em narrativa livre e documentos anexados."
          />

          <FeatureCard
            className="md:col-span-4"
            icon={<FileText className="size-5" />}
            title="Relatórios automáticos"
            desc="Resumos executivos e fichas de caso geradas em PDF ou JSON instantaneamente."
          />

          <FeatureCard
            className="md:col-span-4"
            icon={<Network className="size-5" />}
            title="Roteamento por especialidade"
            desc="Encaminhamento automático para o departamento ou advogado correto, com handoff humano."
          />

          {/* Prediction wide */}
          <div className="md:col-span-12 glass-card rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <div className="size-10 rounded-xl bg-brand-soft text-brand grid place-items-center mb-5">
                <Sparkles className="size-5" />
              </div>
              <h3 className="font-display text-3xl text-foreground mb-3">Predição de êxito do caso</h3>
              <p className="text-muted-foreground max-w-xl text-pretty">
                Modelos proprietários treinados em mais de 50 milhões de
                precedentes judiciais e padrões de decisão. Estime viabilidade
                antes de aceitar o caso.
              </p>
              <ul className="mt-6 grid sm:grid-cols-2 gap-3">
                {["50M+ precedentes", "Análise por jurisdição", "Score de risco", "Próximos passos sugeridos"].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm text-foreground/85">
                    <CheckCircle2 className="size-4 text-success" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <ProbabilityGauge />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  className = "",
  icon,
  title,
  desc,
}: {
  className?: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className={`glass-card rounded-3xl p-7 hover:bg-secondary/40 transition-colors ${className}`}>
      <div className="size-10 rounded-xl bg-brand-soft text-brand grid place-items-center mb-5">{icon}</div>
      <h3 className="font-display text-xl text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground text-pretty">{desc}</p>
    </div>
  );
}

function ProbabilityGauge() {
  return (
    <div className="relative size-56 shrink-0">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r="50" fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="var(--brand)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${0.88 * 314} 314`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-display text-5xl text-foreground">88%</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Êxito estimado</div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ how it works --------------------------- */

function HowItWorks() {
  const steps = [
    { icon: <MessageCircle className="size-5" />, title: "Cliente envia mensagem", desc: "Via WhatsApp, chat do site ou formulário com documentos anexos." },
    { icon: <ScanLine className="size-5" />, title: "IA lê e analisa", desc: "OCR e NLP extraem entidades, datas, valores e fatos relevantes." },
    { icon: <Scale className="size-5" />, title: "Identifica o caso", desc: "Classifica área do direito e qualifica complexidade e viabilidade." },
    { icon: <FileText className="size-5" />, title: "Gera relatório", desc: "Resumo executivo, score de êxito e próximos passos recomendados." },
    { icon: <Workflow className="size-5" />, title: "Rotear automaticamente", desc: "Encaminha para o especialista ou departamento correto via API." },
  ];
  return (
    <section id="how" className="py-28 px-6 bg-surface/40 border-y border-border">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-16">
          <SectionLabel>Como funciona</SectionLabel>
          <h2 className="mt-3 font-display text-4xl md:text-5xl text-foreground leading-tight text-balance">
            Da primeira mensagem ao caso roteado em <span className="italic text-brand">segundos</span>.
          </h2>
        </div>
        <ol className="grid md:grid-cols-5 gap-4 relative">
          {steps.map((s, i) => (
            <li key={s.title} className="relative glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="size-10 rounded-xl bg-brand-soft text-brand grid place-items-center">{s.icon}</div>
                <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
              </div>
              <h3 className="text-foreground font-medium mb-2">{s.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* --------------------------------- API --------------------------------- */

function ApiSection() {
  return (
    <section id="api" className="py-28 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <SectionLabel>API enterprise</SectionLabel>
          <h2 className="mt-3 font-display text-4xl md:text-5xl text-foreground leading-tight text-balance">
            Construída para <span className="italic text-brand">desenvolvedores</span> e advogados.
          </h2>
          <p className="mt-5 text-muted-foreground text-pretty max-w-lg">
            REST API com webhooks em tempo real, SDKs oficiais e documentação
            Swagger. Integre triagem inteligente em minutos.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              { icon: <Code2 className="size-4" />, text: "Arquitetura REST + Webhooks" },
              { icon: <Lock className="size-4" />, text: "Autenticação JWT e API Keys" },
              { icon: <Globe className="size-4" />, text: "SDKs para Node, Python e Go" },
              { icon: <Zap className="size-4" />, text: "Rate limits enterprise" },
            ].map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-sm text-foreground/90">
                <span className="size-8 rounded-lg bg-brand-soft text-brand grid place-items-center">{f.icon}</span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="absolute -inset-10 bg-brand/10 blur-[100px] rounded-full" />
          <div className="relative glass-card rounded-2xl overflow-hidden bg-background/60 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/40">
              <div className="flex gap-1.5">
                <div className="size-2.5 rounded-full bg-secondary" />
                <div className="size-2.5 rounded-full bg-secondary" />
                <div className="size-2.5 rounded-full bg-secondary" />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">triaige-api.ts</span>
            </div>
            <pre className="p-6 text-sm font-mono text-foreground/90 overflow-x-auto leading-relaxed">
{`import { TriaigeClient } from "@triaige/sdk";

const triaige = new `}<span className="text-brand">{`TriaigeClient`}</span>{`("sk_live_…");

// Analisa viabilidade do caso
const report = await triaige.triage.`}<span className="text-brand">analyze</span>{`({
  documents: ["./peticao.pdf", "./contrato.pdf"],
  region: "BR-SP",
  model: "enterprise-v4",
});

console.log(report.probability); `}<span className="text-success">{`// 0.884`}</span>{`
console.log(report.case_type);   `}<span className="text-success">{`// "trabalhista"`}</span>{`
console.log(report.next_steps);  `}<span className="text-success">{`// [...]`}</span>
            </pre>
            <div className="border-t border-border bg-secondary/30 px-6 py-4 grid grid-cols-3 gap-4 text-center">
              <div><div className="font-mono text-xs text-success">200 OK</div><div className="text-[10px] text-muted-foreground mt-1">Status</div></div>
              <div><div className="font-mono text-xs text-foreground">238ms</div><div className="text-[10px] text-muted-foreground mt-1">Latência</div></div>
              <div><div className="font-mono text-xs text-foreground">v4.2</div><div className="text-[10px] text-muted-foreground mt-1">Engine</div></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- AI report ------------------------------- */

function AiReport() {
  return (
    <section className="py-28 px-6 bg-surface/40 border-y border-border">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_1.1fr] gap-16 items-center">
        <div>
          <SectionLabel>Relatório de IA</SectionLabel>
          <h2 className="mt-3 font-display text-4xl md:text-5xl text-foreground leading-tight text-balance">
            Um <span className="italic text-brand">parecer estruturado</span> em segundos.
          </h2>
          <p className="mt-5 text-muted-foreground text-pretty max-w-lg">
            Resumo do caso, classificação jurídica, probabilidade de êxito,
            entidades extraídas e riscos identificados. Pronto para ser
            revisado pelo especialista.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-7 md:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-brand text-brand-foreground grid place-items-center">
                <FileText className="size-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">Relatório #LX-2419</div>
                <div className="text-[11px] text-muted-foreground font-mono">gerado em 4.2s</div>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-widest font-medium text-success px-2 py-1 rounded bg-success/10">
              Qualificado
            </span>
          </div>

          <div className="space-y-5">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Resumo</div>
              <p className="text-sm text-foreground/90 leading-relaxed">
                Cliente alega rescisão indireta por descumprimento contratual e
                ausência de pagamento de horas extras durante 18 meses.
                Documentação suporta o pleito com consistência.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Stat label="Classificação" value="Trabalhista" />
              <Stat label="Êxito" value="88%" highlight />
              <Stat label="Risco" value="Baixo" />
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Entidades extraídas</div>
              <div className="flex flex-wrap gap-2">
                {["CNPJ 12.***.***/0001-44", "R$ 84.200,00", "01/2022 → 07/2023", "CLT art. 483", "TRT-2"].map((e) => (
                  <span key={e} className="text-[11px] font-mono px-2 py-1 rounded-md bg-secondary border border-border text-foreground/85">{e}</span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Próximos passos</div>
              <ul className="space-y-2 text-sm text-foreground/90">
                <li className="flex gap-2"><CheckCircle2 className="size-4 text-success mt-0.5 shrink-0" /> Solicitar holerites de 2022 e 2023</li>
                <li className="flex gap-2"><CheckCircle2 className="size-4 text-success mt-0.5 shrink-0" /> Encaminhar ao Dept. Trabalhista (J. Almeida)</li>
                <li className="flex gap-2"><CheckCircle2 className="size-4 text-success mt-0.5 shrink-0" /> Agendar reunião de qualificação em 48h</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-xl ${highlight ? "text-success" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

/* --------------------------- WhatsApp section -------------------------- */

function WhatsAppSection() {
  return (
    <section className="py-28 px-6">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <SectionLabel>Canais conversacionais</SectionLabel>
          <h2 className="mt-3 font-display text-4xl md:text-5xl text-foreground leading-tight text-balance">
            Atendimento humano, <span className="italic text-brand">orquestrado por IA</span>.
          </h2>
          <p className="mt-5 text-muted-foreground text-pretty max-w-lg">
            O assistente conversa com seu cliente em qualquer canal, recebe
            documentos, faz perguntas inteligentes e qualifica o caso 24/7.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              { icon: <MessageCircle className="size-4" />, label: "WhatsApp Business API" },
              { icon: <Globe className="size-4" />, label: "Chat web embed" },
              { icon: <Bot className="size-4" />, label: "Suporte ao cliente" },
              { icon: <Workflow className="size-4" />, label: "Intake jurídico" },
            ].map((c) => (
              <div key={c.label} className="glass-card rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-foreground/90">
                <span className="text-brand">{c.icon}</span>
                {c.label}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6 max-w-md w-full mx-auto shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-success/15 grid place-items-center text-success">
                <MessageCircle className="size-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">Assistente triAIge</div>
                <div className="text-[11px] text-success flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-success animate-pulse-soft" /> online
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">via WhatsApp</span>
          </div>

          <div className="space-y-3">
            <Bubble side="user">Olá, gostaria de saber se tenho direito à revisão do meu contrato de aluguel.</Bubble>
            <Bubble side="ai">Olá! Sou o assistente jurídico. Pode me enviar uma foto ou PDF do contrato?</Bubble>
            <Bubble side="user">
              <div className="flex items-center gap-3 p-2 -m-1">
                <div className="size-10 rounded-md bg-foreground/10 grid place-items-center text-[10px] font-mono">PDF</div>
                <div className="text-xs">contrato_aluguel.pdf · 240 KB</div>
              </div>
            </Bubble>
            <Bubble side="ai">
              Analisando documento… Encontrei cláusula de reajuste acima do IPCA.
              Viabilidade de revisão: <span className="text-success font-medium">75%</span>. Quer falar com um advogado agora?
            </Bubble>
            <div className="flex gap-2 pt-2">
              <button className="text-xs px-3 py-1.5 rounded-full bg-brand text-brand-foreground font-medium">Sim, falar agora</button>
              <button className="text-xs px-3 py-1.5 rounded-full bg-secondary text-foreground border border-border">Mais tarde</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Bubble({ side, children }: { side: "user" | "ai"; children: React.ReactNode }) {
  const isAi = side === "ai";
  return (
    <div className={`flex ${isAi ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] text-sm leading-relaxed px-4 py-2.5 rounded-2xl ${
          isAi
            ? "bg-secondary border border-border text-foreground/90 rounded-tl-sm"
            : "bg-brand text-brand-foreground rounded-tr-sm"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------ benefits ------------------------------- */

function Benefits() {
  const items = [
    { icon: <Zap />, title: "70% menos custo operacional", desc: "Reduza horas humanas em triagem repetitiva." },
    { icon: <Gauge />, title: "10× mais rápido", desc: "Casos qualificados em segundos, não em dias." },
    { icon: <Sparkles />, title: "+38% conversão de leads", desc: "Resposta imediata, dia e noite, em qualquer canal." },
    { icon: <ShieldCheck />, title: "Compliance LGPD nativo", desc: "Criptografia ponta a ponta e auditoria completa." },
    { icon: <Brain />, title: "Análise jurídica precisa", desc: "Modelos treinados especificamente para o direito brasileiro." },
    { icon: <Network />, title: "Escala sem contratar", desc: "Atenda 10 ou 10.000 leads simultâneos sem fricção." },
  ];
  return (
    <section className="py-28 px-6 bg-surface/40 border-y border-border">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-16">
          <SectionLabel>Benefícios</SectionLabel>
          <h2 className="mt-3 font-display text-4xl md:text-5xl text-foreground leading-tight text-balance">
            Resultados que o seu CFO vai <span className="italic text-brand">aplaudir</span>.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {items.map((b) => (
            <div key={b.title} className="glass-card rounded-2xl p-7">
              <div className="size-10 rounded-xl bg-brand-soft text-brand grid place-items-center mb-5">
                <span className="[&>svg]:size-5">{b.icon}</span>
              </div>
              <h3 className="font-display text-xl text-foreground mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- testimonials ----------------------------- */

function Testimonials() {
  const items = [
    {
      quote:
        "Reduzimos em 64% o tempo de qualificação inicial. A triAIge virou parte da nossa operação jurídica em duas semanas.",
      author: "Mariana Costa",
      role: "Head of Legal Ops, Justiça Group",
    },
    {
      quote:
        "A API se integrou ao nosso CRM em uma tarde. O mais impressionante foi a precisão na classificação dos casos.",
      author: "Rafael Andrade",
      role: "CTO, Andrade Sociedade de Advogados",
    },
    {
      quote:
        "Dobramos a conversão de leads sem aumentar o time. O assistente do WhatsApp atende com qualidade enterprise.",
      author: "Luísa Menezes",
      role: "Diretora Jurídica, Prime Partners",
    },
  ];
  return (
    <section className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-16">
          <SectionLabel>Quem usa</SectionLabel>
          <h2 className="mt-3 font-display text-4xl md:text-5xl text-foreground leading-tight text-balance">
            A escolha de equipes jurídicas <span className="italic text-brand">de alta performance</span>.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {items.map((t) => (
            <figure key={t.author} className="glass-card rounded-3xl p-7 flex flex-col gap-6">
              <blockquote className="font-display text-xl text-foreground leading-snug">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3 pt-4 border-t border-border">
                <div className="size-10 rounded-full bg-secondary grid place-items-center text-foreground/80 font-medium">
                  {t.author.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{t.author}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- CTA ---------------------------------- */

function FinalCta() {
  return (
    <section id="security" className="py-28 px-6">
      <div className="max-w-6xl mx-auto relative rounded-[2rem] overflow-hidden glass-card p-12 md:p-20 text-center">
        <div className="absolute inset-0 grid-bg opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 size-[500px] bg-brand/25 blur-[140px] rounded-full" />
        <div className="relative">
          <Pill>
            <ShieldCheck className="size-3" /> LGPD · SOC 2 · Criptografia AES-256
          </Pill>
          <h2 className="mt-6 font-display text-4xl md:text-6xl text-foreground leading-[1.05] text-balance">
            O futuro das <span className="italic text-brand">operações jurídicas</span> começa aqui.
          </h2>
          <p className="mt-5 text-muted-foreground max-w-xl mx-auto text-pretty">
            Junte-se a mais de 450 escritórios e departamentos jurídicos que já
            automatizaram triagem e análise documental com a triAIge.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a
              href="mailto:contato@triaige.ai?subject=Solicita%C3%A7%C3%A3o%20de%20demonstra%C3%A7%C3%A3o%20-%20triAIge&body=Ol%C3%A1%2C%20gostaria%20de%20agendar%20uma%20demonstra%C3%A7%C3%A3o%20da%20plataforma%20triAIge.%0A%0ANome%3A%0AEmpresa%3A%0ACargo%3A%0ATelefone%3A%0AN%C3%BAmero%20de%20usu%C3%A1rios%3A%0AContexto%3A%0A"
              className="h-12 px-7 bg-brand text-brand-foreground font-semibold rounded-xl brand-glow hover:opacity-95 transition inline-flex items-center gap-2"
            >
              Solicitar demonstração <ArrowRight className="size-4" />
            </a>
            <a
              href="#api"
              className="h-12 px-7 bg-secondary border border-border text-foreground font-semibold rounded-xl hover:bg-card transition inline-flex items-center gap-2"
            >
              Ver documentação da API
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- footer -------------------------------- */

function Footer() {
  const cols = [
    {
      title: "Plataforma",
      links: ["Triagem por IA", "Análise documental", "WhatsApp Assistant", "Predição de casos", "Dashboard"],
    },
    {
      title: "Desenvolvedores",
      links: ["Documentação da API", "SDKs", "Webhooks", "Status do sistema", "Changelog"],
    },
    {
      title: "Empresa",
      links: ["Sobre", "Carreiras", "Blog", "Imprensa", "Contato"],
    },
    {
      title: "Segurança & Legal",
      links: ["Privacidade", "Termos de uso", "Compliance LGPD", "SOC 2", "DPA"],
    },
  ];
  return (
    <footer className="border-t border-border pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[1.4fr_repeat(4,1fr)] gap-12">
          <div>
            <LogoMark />
            <p className="mt-5 text-sm text-muted-foreground max-w-xs leading-relaxed">
              Construindo a camada de inteligência da advocacia moderna.
              Escalável, segura e precisa.
            </p>
            <div className="mt-6 flex gap-2">
              {["X", "in", "GH"].map((s) => (
                <a key={s} href="#" className="size-9 rounded-lg border border-border grid place-items-center text-xs text-muted-foreground hover:text-foreground hover:border-brand/40 transition">
                  {s}
                </a>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-[10px] uppercase tracking-[0.25em] text-foreground font-semibold mb-5">{c.title}</h4>
              <ul className="space-y-3">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 pt-6 border-t border-border flex flex-col md:flex-row justify-between gap-4 text-[11px] text-muted-foreground font-mono">
          <span>© 2026 triAIge Technologies. Todos os direitos reservados.</span>
          <div className="flex gap-6">
            <span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-success animate-pulse-soft" /> Todos os sistemas operacionais</span>
            <span>v4.2.1</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------- page --------------------------------- */

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <Trust />
      <Features />
      <HowItWorks />
      <ApiSection />
      <AiReport />
      <WhatsAppSection />
      <Benefits />
      <Testimonials />
      <FinalCta />
      <Footer />
    </div>
  );
}

export default LandingPage;
