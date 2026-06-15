"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Inbox, Building2, LogOut, Menu, X } from "lucide-react";
import { Toaster } from "sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navItems = [
    { to: "/app/cases", label: "Rastreamento de Cases", icon: Inbox },
    { to: "/app/clients", label: "Escritórios Clientes", icon: Building2 },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster theme="dark" position="top-right" richColors />
      <header className="h-14 border-b border-border bg-card/60 backdrop-blur-xl sticky top-0 z-30 flex items-center px-4 md:px-6 gap-4">
        <button onClick={() => setOpen((v) => !v)} className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <Link href="/app/cases" className="font-display text-lg tracking-tight">
          tri<span className="text-brand">AI</span>ge
        </Link>
        <span className="hidden md:inline text-xs text-muted-foreground">Painel · Demo</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[180px]">demo@triaige.ai</span>
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
          className={`${open ? "block" : "hidden"} md:block fixed md:sticky top-14 left-0 z-20 w-64 h-[calc(100vh-3.5rem)] border-r border-border bg-card/40 backdrop-blur-xl p-3`}
        >
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.to);
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
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 p-3 rounded-xl border border-border bg-secondary/40">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Status API</div>
            <div className="flex items-center gap-2 text-xs text-foreground">
              <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
              Operacional · 99.98%
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 md:ml-0">
          {children}
        </main>
      </div>
    </div>
  );
}
