"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, type SessionArea } from "@/lib/api-client";
import type { SessionInfo } from "@/lib/types";

export function ProfileSettings({ area }: { area: SessionArea }) {
  const [user, setUser] = useState<SessionInfo["user"] | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    api.session
      .me(area)
      .then((s) => {
        if (!active) return;
        setUser(s.user);
        setName(s.user.name);
        setEmail(s.user.email);
        setJobTitle(s.user.job_title ?? "");
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Falha ao carregar perfil."));
    return () => {
      active = false;
    };
  }, [area]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("A confirmação não confere com a nova senha.");
      return;
    }
    if (newPassword && !currentPassword) {
      toast.error("Informe a senha atual para trocar a senha.");
      return;
    }
    setSaving(true);
    try {
      const { user: updated } = await api.updateProfile({
        name,
        email,
        job_title: jobTitle || undefined,
        current_password: newPassword ? currentPassword : undefined,
        new_password: newPassword || undefined,
      });
      setUser(updated);
      setName(updated.name);
      setEmail(updated.email);
      setJobTitle(updated.job_title ?? "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Perfil atualizado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar perfil.");
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <div className="p-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Carregando perfil...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto space-y-6">
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Conta</div>
        <h1 className="font-display text-3xl mt-1">Meu perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">Atualize seus dados de acesso. A troca de senha é opcional.</p>
      </div>

      <form onSubmit={submit} className="rounded-2xl border border-border bg-card/50 p-5 md:p-6 space-y-4">
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Nome</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="modal-input mt-1" />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Email</span>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="modal-input mt-1" />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Cargo</span>
          <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="modal-input mt-1" placeholder="Opcional" />
        </label>

        <div className="border-t border-border pt-4 space-y-3">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Trocar senha (opcional)</div>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Senha atual</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="modal-input mt-1"
              autoComplete="current-password"
              placeholder={newPassword ? "Obrigatória para trocar" : "Somente se for trocar a senha"}
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Nova senha</span>
            <input
              type="password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="modal-input mt-1"
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Confirmar nova senha</span>
            <input
              type="password"
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="modal-input mt-1"
              autoComplete="new-password"
              placeholder="Repita a nova senha"
            />
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-5 rounded-lg bg-brand text-brand-foreground font-semibold text-sm disabled:opacity-60 inline-flex items-center gap-2"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Salvar alterações
          </button>
        </div>
      </form>
    </div>
  );
}
