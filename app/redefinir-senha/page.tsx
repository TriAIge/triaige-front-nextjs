"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { Toaster, toast } from "sonner";
import { api, ApiRequestError } from "@/lib/api-client";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    let active = true;
    api.session
      .me("firm")
      .then((s) => {
        if (!active) return;
        if (!s.user.must_change_password) {
          const dest = s.user.role === "firm_user" ? "/portal/cases" : "/admin/cases";
          router.replace(dest);
          return;
        }
        setUserName(s.user.name);
        setChecking(false);
      })
      .catch((error) => {
        if (!active) return;
        if (error instanceof ApiRequestError && error.status === 401) {
          router.replace("/login?next=/redefinir-senha");
          return;
        }
        toast.error(error instanceof Error ? error.message : "Não foi possível validar a sessão.");
        setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("A confirmação não confere com a nova senha.");
      return;
    }
    setLoading(true);
    try {
      await api.changePassword({ current_password: currentPassword, new_password: newPassword });
      toast.success("Senha atualizada");
      const s = await api.session.me("firm");
      router.replace(s.user.role === "firm_user" ? "/portal/cases" : "/admin/cases");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível redefinir a senha.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-background grid-bg flex items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-bg relative overflow-hidden">
      <Toaster theme="dark" position="top-right" richColors />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[600px] rounded-full blur-3xl opacity-20"
        style={{ background: "radial-gradient(circle, oklch(0.78 0.13 82 / 0.5), transparent 70%)" }}
      />

      <header className="relative z-10 max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Primeiro acesso</span>
        <Link href="/" className="font-display text-xl tracking-tight text-foreground">
          tri<span className="text-brand">AI</span>ge
        </Link>
      </header>

      <main className="relative z-10 flex items-center justify-center px-6 py-10 md:py-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium">Segurança da conta</span>
            <h1 className="mt-3 font-display text-3xl md:text-4xl text-foreground leading-tight">
              Redefina sua <span className="italic text-brand">senha</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {userName ? `Olá, ${userName}. ` : ""}
              A senha provisória foi gerada pela equipe triAIge. Escolha uma senha pessoal para continuar.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 md:p-8 border border-border bg-card/60 backdrop-blur-xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field icon={<Lock className="size-4" />} label="Senha provisória (atual)">
                <input
                  required
                  minLength={6}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60 text-sm"
                />
              </Field>
              <Field icon={<Lock className="size-4" />} label="Nova senha">
                <input
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60 text-sm"
                />
              </Field>
              <Field icon={<Lock className="size-4" />} label="Confirmar nova senha">
                <input
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repita a nova senha"
                  className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60 text-sm"
                />
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-brand text-brand-foreground font-semibold rounded-xl brand-glow hover:opacity-95 transition-opacity inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                Salvar e continuar
              </button>
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
