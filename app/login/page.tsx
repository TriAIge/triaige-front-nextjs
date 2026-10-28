"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Loader2, Lock, Mail, Building2, User as UserIcon, Briefcase } from "lucide-react";
import { Toaster, toast } from "sonner";
import { api } from "@/lib/api-client";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [email, setEmail] = useState(mode === "signin" ? "demo@triaige.ai" : "");
  const [password, setPassword] = useState(mode === "signin" ? "demo123" : "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: Record<string, string> =
        mode === "signin" ? { email, password } : { name, email, password, company, job_title: jobTitle };
      const { user } = await api.auth(mode, payload);
      toast.success(mode === "signin" ? "Bem-vindo de volta" : "Conta criada");
      const areas = user.role === "firm_user" ? ["/portal"] : ["/admin", "/app"];
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next && areas.some((area) => next.startsWith(area)) ? next : `${areas[0]}/cases`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível entrar."); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-background grid-bg relative overflow-hidden">
      <Toaster theme="dark" position="top-right" richColors />
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[600px] rounded-full blur-3xl opacity-20"
        style={{ background: "radial-gradient(circle, oklch(0.78 0.13 82 / 0.5), transparent 70%)" }}
      />

      <header className="relative z-10 max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" /> Voltar ao site
        </Link>
        <Link href="/" className="font-display text-xl tracking-tight text-foreground">
          tri<span className="text-brand">AI</span>ge
        </Link>
      </header>

      <main className="relative z-10 flex items-center justify-center px-6 py-10 md:py-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium">
              {mode === "signin" ? "Acesso à plataforma" : "Criar nova conta"}
            </span>
            <h1 className="mt-3 font-display text-3xl md:text-4xl text-foreground leading-tight">
              {mode === "signin" ? (
                <>Bem-vindo de <span className="italic text-brand">volta</span></>
              ) : (
                <>Comece sua <span className="italic text-brand">jornada</span></>
              )}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Acesse o painel da operação ou o portal do seu escritório."
                : "Cadastre seu escritório para acompanhar seus casos."}
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 md:p-8 border border-border bg-card/60 backdrop-blur-xl">
            <div className="grid grid-cols-2 gap-1 p-1 bg-secondary rounded-xl mb-6">
              <button type="button" onClick={() => setMode("signin")}
                className={`h-9 text-sm font-medium rounded-lg transition-colors ${mode === "signin" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}>
                Entrar
              </button>
              <button type="button" onClick={() => setMode("signup")}
                className={`h-9 text-sm font-medium rounded-lg transition-colors ${mode === "signup" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}>
                Criar conta
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <>
                  <Field icon={<UserIcon className="size-4" />} label="Nome completo">
                    <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Maria Andrade" className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60 text-sm" />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field icon={<Building2 className="size-4" />} label="Empresa">
                      <input required value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Andrade Advogados" className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60 text-sm" />
                    </Field>
                    <Field icon={<Briefcase className="size-4" />} label="Cargo">
                      <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Sócia" className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60 text-sm" />
                    </Field>
                  </div>
                </>
              )}

              <Field icon={<Mail className="size-4" />} label="Email corporativo">
                <input required value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" placeholder="voce@empresa.com"
                  className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60 text-sm" />
              </Field>

              <Field icon={<Lock className="size-4" />} label="Senha">
                <input required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder="••••••••"
                  className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60 text-sm" />
              </Field>

              <button type="submit" disabled={loading}
                className="w-full h-11 bg-brand text-brand-foreground font-semibold rounded-xl brand-glow hover:opacity-95 transition-opacity inline-flex items-center justify-center gap-2 disabled:opacity-60">
                {loading && <Loader2 className="size-4 animate-spin" />}
                {mode === "signin" ? "Entrar na plataforma" : "Criar minha conta"}
              </button>

              <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                Acesso demo: demo@triaige.ai (admin) ou portal@triaige.ai (escritório) · senha demo123.
              </p>
            </form>
          </div>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            {mode === "signin" ? (
              <>Ainda não tem conta?{" "}
                <button onClick={() => setMode("signup")} className="text-brand hover:underline font-medium">
                  Criar conta corporativa
                </button>
              </>
            ) : (
              <>Já é cliente?{" "}
                <button onClick={() => setMode("signin")} className="text-brand hover:underline font-medium">
                  Fazer login
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">{label}</span>
      <div className="mt-1.5 flex items-center gap-2.5 px-3.5 h-11 rounded-xl bg-secondary/60 border border-border focus-within:border-brand/60 focus-within:ring-2 focus-within:ring-brand/20 transition">
        <span className="text-muted-foreground">{icon}</span>
        {children}
      </div>
    </label>
  );
}
