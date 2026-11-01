"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Inbox, Building2, LogOut, Menu, Shield, X } from "lucide-react";
import { Toaster } from "sonner";
import { ApiStatusCard, SessionLoading } from "@/components/LayoutParts";
import { api } from "@/lib/api-client";
import { useSession } from "@/lib/use-session";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { session, signout } = useSession("staff");

  const navItems = [
    { to: "/app/cases", label: "Visão Geral", icon: Inbox },
    { to: "/app/clients", label: "Escritórios Clientes", icon: Building2 },
    { to: "/admin/cases", label: "Painel Admin", icon: Shield },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster theme="dark" position="top-right" richColors />
      <header className="h-18 border-b border-border bg-card/60 backdrop-blur-xl sticky top-0 z-30 flex items-center px-4 md:px-6 gap-4">
        <button onClick={() => setOpen((v) => !v)} className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <Link href="/app/cases" className="font-display text-lg tracking-tight">
          <img src="/logo.png" alt="triAIge" className="h-10" />
        </Link>
        <span className="hidden md:inline text-xs text-muted-foreground">Painel / Visão geral da operação</span>
        {api.useMockData ? (
          <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] text-brand border border-brand/30 bg-brand/10 px-2 py-1 rounded-md">
            Mock data
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[180px]">{session?.user.email ?? ""}</span>
          <button
            onClick={() => void signout()}
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
              const active =
                item.to.startsWith("/admin")
                  ? pathname.startsWith("/admin")
                  : pathname.startsWith(item.to);
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
          <div className="mt-6">
            <ApiStatusCard />
          </div>
        </aside>

        <main className="flex-1 min-w-0 md:ml-0">{session ? children : <SessionLoading />}</main>
      </div>
    </div>
  );
}
