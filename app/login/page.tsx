"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Loader2, Lock, Mail } from "lucide-react";
import { Toaster, toast } from "sonner";
import { api } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("demo@triaige.ai");
  const [password, setPassword] = useState("demo123");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await api.auth("signin", { email, password });
      if (user.must_change_password) {
        toast.message("Defina sua senha pessoal para continuar");
        router.push("/redefinir-senha");
        return;
      }
      toast.success("Bem-vindo de volta");
      const areas = user.role === "firm_user" ? ["/portal"] : ["/admin", "/app"];
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next && areas.some((area) => next.startsWith(area)) ? next : `${areas[0]}/cases`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background grid-bg relative overflow-hidden">
      <Toaster theme="dark" position="top-right" richColors />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[600px] rounded-full blur-3xl opacity-20"
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
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium">Acesso à plataforma</span>
            <h1 className="mt-3 font-display text-3xl md:text-4xl text-foreground leading-tight">
              Bem-vindo de <span className="italic text-brand">volta</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Acesse o painel da operação ou o portal do seu escritório.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 md:p-8 border border-border bg-card/60 backdrop-blur-xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field icon={<Mail className="size-4" />} label="Email corporativo">
                <input
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="voce@empresa.com"
                  className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60 text-sm"
                />
              </Field>

              <Field icon={<Lock className="size-4" />} label="Senha">
                <input
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60 text-sm"
                />
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-brand text-brand-foreground font-semibold rounded-xl brand-glow hover:opacity-95 transition-opacity inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                Entrar na plataforma
              </button>

              <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                Contas do portal são provisionadas pela equipe triAIge. Acesso demo: demo@triaige.ai (admin) ou
                portal@triaige.ai (escritório) · senha demo123.
              </p>
            </form>
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
