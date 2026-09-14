"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Headset,
  Inbox,
  LogOut,
  Menu,
  ScrollText,
  Settings2,
  X,
} from "lucide-react";
import { Toaster } from "sonner";
import { api } from "@/lib/api-client";

const SUPPORT_EMBED_URL = "https://app.pipefy.com/public/form/XtNsaW3o?embedded=true";

const navGroups = [
  {
    label: "Operação",
    items: [
      { to: "/portal/cases", label: "Meus Casos", icon: Inbox },
      { to: "/portal/indicadores", label: "Indicadores & Produtividade", icon: BarChart3 },
    ],
  },
  {
    label: "Conta",
    items: [
      { to: "/portal/config", label: "Canais & Notificações", icon: Settings2 },
      { to: "/portal/auditoria", label: "Auditoria", icon: ScrollText },
    ],
  },
] as const;

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [firmName, setFirmName] = useState("Escritório");
  const [plan, setPlan] = useState("—");
  const [email, setEmail] = useState("");

  useEffect(() => {
    void api.portal.session().then((s) => {
      setFirmName(s.firmName);
      setPlan(s.plan);
      setEmail(s.userEmail);
    });
  }, []);

  useEffect(() => {
    if (!supportOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSupportOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [supportOpen]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster theme="dark" position="top-right" richColors />
      <header className="h-18 border-b border-border bg-card/60 backdrop-blur-xl sticky top-0 z-30 flex items-center px-4 md:px-6 gap-4">
        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <Link href="/portal/cases" className="font-display text-lg tracking-tight">
          <img src="/logo.png" alt="triAIge" className="h-10" />
        </Link>
        <span className="hidden md:inline text-xs text-muted-foreground">Portal do escritório</span>
        {api.useMockData ? (
          <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] text-brand border border-brand/30 bg-brand/10 px-2 py-1 rounded-md">
            Mock data
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[220px]">{email}</span>
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-brand text-brand-foreground text-sm font-semibold brand-glow hover:opacity-95 transition"
          >
            <Headset className="size-4" />
            <span className="hidden sm:inline">Suporte</span>
          </button>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm text-foreground hover:bg-secondary transition"
          >
            <LogOut className="size-4" /> Sair
          </button>
        </div>
      </header>

      <div className="flex">
        <aside
          className={`${open ? "block" : "hidden"} md:block fixed md:sticky top-14 left-0 z-20 w-64 h-[calc(100vh-3.5rem)] border-r border-border bg-card/40 backdrop-blur-xl p-3 overflow-y-auto`}
        >
          <div className="mb-4 px-3 py-2.5 rounded-lg border border-border bg-secondary/40">
            <div className="text-sm font-medium text-foreground truncate">{firmName}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Plano {plan}</div>
          </div>
          <nav className="flex flex-col gap-4">
            {navGroups.map((group) => (
              <div key={group.label}>
                <div className="px-3 mb-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{group.label}</div>
                <div className="flex flex-col gap-1">
                  {group.items.map((item) => {
                    const active = pathname === item.to || pathname.startsWith(item.to + "/");
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        href={item.to}
                        onClick={() => setOpen(false)}
                        className={`inline-flex items-center gap-3 h-10 px-3 rounded-lg text-sm transition ${
                          active
                            ? "bg-brand/15 text-brand border border-brand/30"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                        }`}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setSupportOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 h-10 px-3 rounded-lg border border-brand/30 bg-brand/10 text-brand text-sm font-semibold hover:bg-brand/15 transition"
            >
              <Headset className="size-4" /> Falar com suporte
            </button>
            <div className="p-3 rounded-xl border border-border bg-secondary/40">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Status API</div>
              <div className="flex items-center gap-2 text-xs text-foreground">
                <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                Operacional
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 md:ml-0">{children}</main>
      </div>

      {supportOpen ? (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSupportOpen(false)}
        >
          <div
            className="w-full max-w-[600px] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
              <div>
                <div className="text-sm font-semibold">Suporte triAIge</div>
                <div className="text-[11px] text-muted-foreground">Preencha o formulário sem sair do portal</div>
              </div>
              <button
                type="button"
                onClick={() => setSupportOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                aria-label="Fechar"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="bg-white">
              <iframe
                title="Formulário de suporte Pipefy"
                src={SUPPORT_EMBED_URL}
                className="w-full border-0"
                style={{ height: 580 }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
