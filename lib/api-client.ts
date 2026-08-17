import type { Company, LegalCase } from "./types";

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error ?? "Não foi possível concluir a requisição.");
  return payload as T;
}

export const api = {
  clients: {
    list: () => request<Company[]>("/api/clients", { cache: "no-store" }),
    create: (data: Omit<Company, "id" | "created_at" | "cases_count">) => request<Company>("/api/clients", { method: "POST", body: data }),
    update: (id: string, data: Partial<Omit<Company, "id" | "created_at" | "cases_count">>) => request<Company>(`/api/clients/${id}`, { method: "PUT", body: data }),
    remove: (id: string) => request<{ success: true }>(`/api/clients/${id}`, { method: "DELETE" }),
  },
  cases: {
    list: () => request<LegalCase[]>("/api/cases", { cache: "no-store" }),
    create: (data: Omit<LegalCase, "id" | "company" | "submitted_at" | "updated_at">) => request<LegalCase>("/api/cases", { method: "POST", body: data }),
    update: (id: string, data: Partial<Omit<LegalCase, "id" | "company" | "submitted_at">>) => request<LegalCase>(`/api/cases/${id}`, { method: "PATCH", body: data }),
    remove: (id: string) => request<{ success: true }>(`/api/cases/${id}`, { method: "DELETE" }),
  },
  auth: (mode: "signin" | "signup", data: Record<string, string>) => request<{ user: { name: string; email: string }; token: string }>(`/api/auth/${mode}`, { method: "POST", body: data }),
};

