"use client";
import { useMemo, useState } from "react";
import { Building2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

type Company = {
  id: string;
  name: string;
  cnpj: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  plan: string;
  notes: string | null;
  created_at: string;
  cases_count: number;
};

const PLANS = ["Starter", "Profissional", "Enterprise"] as const;

const MOCK: Company[] = [
  { id: "c1", name: "Andrade & Sócios Advogados",   cnpj: "12.345.678/0001-90", contact_email: "contato@andrade.adv.br",  contact_phone: "(11) 4002-8922", plan: "Enterprise",   notes: "Cliente âncora — integração via API com CRM proprietário.", created_at: new Date().toISOString(), cases_count: 142 },
  { id: "c2", name: "Silva Pereira Jurídico",        cnpj: "98.765.432/0001-10", contact_email: "ops@silvapereira.com.br", contact_phone: "(21) 3030-1010", plan: "Profissional", notes: "Foco em trabalhista e cível.",                                created_at: new Date().toISOString(), cases_count: 87  },
  { id: "c3", name: "Mendonça Tributário",           cnpj: "45.678.123/0001-55", contact_email: "fiscal@mendonca.law",     contact_phone: "(31) 2121-7878", plan: "Starter",      notes: null,                                                          created_at: new Date().toISOString(), cases_count: 19  },
  { id: "c4", name: "Costa & Lima Consultoria Legal",cnpj: "33.222.111/0001-44", contact_email: "demandas@costalima.adv",  contact_phone: "(51) 3500-2200", plan: "Profissional", notes: "Departamento jurídico interno de grupo varejista.",           created_at: new Date().toISOString(), cases_count: 64  },
  { id: "c5", name: "Vasconcelos Advocacia",         cnpj: "77.888.999/0001-22", contact_email: "novos@vasconcelos.com",   contact_phone: "(41) 2200-3344", plan: "Profissional", notes: null,                                                          created_at: new Date().toISOString(), cases_count: 38  },
  { id: "c6", name: "Ribeiro & Partners",            cnpj: "11.444.777/0001-33", contact_email: "hello@ribeiro.partners",  contact_phone: "(11) 5577-8800", plan: "Enterprise",   notes: "Jurídico multinacional — multi-idioma.",                      created_at: new Date().toISOString(), cases_count: 211 },
];

export default function ClientsPage() {
  const [items, setItems] = useState<Company[]>(MOCK);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Company | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((c) => c.name.toLowerCase().includes(q) || (c.cnpj ?? "").toLowerCase().includes(q) || (c.contact_email ?? "").toLowerCase().includes(q));
  }, [items, search]);

  function remove(id: string) {
    if (!confirm("Excluir este escritório?")) return;
    setItems((xs) => xs.filter((c) => c.id !== id));
    toast.success("Escritório excluído");
  }
  function openNew() { setEditing(null); setShowForm(true); }
  function openEdit(c: Company) { setEditing(c); setShowForm(true); }
  function save(payload: Omit<Company, "id" | "created_at" | "cases_count">) {
    if (editing) {
      setItems((xs) => xs.map((c) => c.id === editing.id ? { ...c, ...payload } : c));
      toast.success("Escritório atualizado");
    } else {
      setItems((xs) => [{ ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString(), cases_count: 0 }, ...xs]);
      toast.success("Escritório cadastrado");
    }
    setShowForm(false);
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Carteira</span>
          <h1 className="font-display text-2xl md:text-3xl mt-1">Escritórios <span className="italic text-brand">Clientes</span></h1>
          <p className="text-sm text-muted-foreground mt-1">Cadastre e gerencie os escritórios e departamentos jurídicos que utilizam a sua operação triAIge.</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-brand text-brand-foreground font-semibold text-sm brand-glow hover:opacity-95 transition">
          <Plus className="size-4" /> Novo escritório
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-3 mb-4">
        <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-secondary/60 border border-border focus-within:border-brand/60">
          <Search className="size-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, CNPJ ou email" className="w-full bg-transparent outline-none text-sm" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-12 text-center">
          <div className="mx-auto size-12 rounded-full bg-secondary/60 border border-border flex items-center justify-center mb-3"><Building2 className="size-5 text-muted-foreground" /></div>
          <div className="font-medium">Nenhum escritório encontrado</div>
          <p className="text-sm text-muted-foreground mt-1">Ajuste sua busca ou cadastre o primeiro cliente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5 group hover:border-brand/40 transition">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-brand/15 border border-brand/30 text-brand flex items-center justify-center font-display">
                    {c.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">{c.cnpj || "CNPJ não informado"}</div>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-brand/30 bg-brand/10 text-brand text-[11px]">{c.plan}</span>
              </div>
              <div className="space-y-1.5 text-sm">
                <Line label="Email" value={c.contact_email || "—"} />
                <Line label="Telefone" value={c.contact_phone || "—"} />
                <Line label="Cases" value={String(c.cases_count)} />
              </div>
              {c.notes && <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{c.notes}</p>}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                <button onClick={() => openEdit(c)} className="flex-1 inline-flex items-center justify-center gap-2 h-9 rounded-lg border border-border text-sm hover:bg-secondary transition"><Pencil className="size-3.5" /> Editar</button>
                <button onClick={() => remove(c.id)} className="h-9 px-3 rounded-lg border border-border text-muted-foreground hover:text-rose-300 hover:border-rose-500/40 hover:bg-rose-500/10 transition"><Trash2 className="size-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <CompanyForm initial={editing} onClose={() => setShowForm(false)} onSave={save} />}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground truncate">{value}</span>
    </div>
  );
}

function CompanyForm({ initial, onClose, onSave }: { initial: Company | null; onClose: () => void; onSave: (payload: Omit<Company, "id" | "created_at" | "cases_count">) => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [cnpj, setCnpj] = useState(initial?.cnpj ?? "");
  const [email, setEmail] = useState(initial?.contact_email ?? "");
  const [phone, setPhone] = useState(initial?.contact_phone ?? "");
  const [plan, setPlan] = useState(initial?.plan ?? "Starter");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ name, cnpj: cnpj || null, contact_email: email || null, contact_phone: phone || null, plan, notes: notes || null });
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">{initial ? "Editar escritório" : "Novo escritório"}</h2>
          <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
        </div>
        <div className="space-y-3">
          <Field label="Nome do escritório / departamento"><input required value={name} onChange={(e) => setName(e.target.value)} className="modal-input" placeholder="Silva & Advogados" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="CNPJ"><input value={cnpj} onChange={(e) => setCnpj(e.target.value)} className="modal-input" placeholder="00.000.000/0000-00" /></Field>
            <Field label="Plano">
              <select value={plan} onChange={(e) => setPlan(e.target.value)} className="modal-input">
                {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email de contato"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="modal-input" placeholder="contato@escritorio.com" /></Field>
            <Field label="Telefone"><input value={phone} onChange={(e) => setPhone(e.target.value)} className="modal-input" placeholder="(11) 90000-0000" /></Field>
          </div>
          <Field label="Observações"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="modal-input resize-none" placeholder="Anotações internas…" /></Field>
        </div>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg border border-border text-sm">Cancelar</button>
          <button className="h-10 px-4 rounded-lg bg-brand text-brand-foreground font-semibold text-sm">{initial ? "Salvar" : "Cadastrar"}</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
