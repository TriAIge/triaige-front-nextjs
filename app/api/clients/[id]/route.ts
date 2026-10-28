import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { deleteCompany, getCompany, updateCompany } from "@/lib/db";
import { isMysqlError, jsonError, readJson } from "@/lib/http";
import { COMPANY_LIFECYCLES, PLANS } from "@/lib/types";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

const NOT_FOUND = "Escritório não encontrado.";

async function save(id: string, data: Parameters<typeof updateCompany>[1], actor: string) {
  try {
    const company = await updateCompany(id, data, actor);
    return company ? NextResponse.json(company) : jsonError(NOT_FOUND, 404);
  } catch (error) {
    if (isMysqlError(error, "ER_DUP_ENTRY")) return jsonError("Já existe um escritório com este CNPJ.", 409);
    throw error;
  }
}

export async function GET(_: Request, { params }: Context) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const company = await getCompany((await params).id);
  return company ? NextResponse.json(company) : jsonError(NOT_FOUND, 404);
}

export async function PUT(request: Request, { params }: Context) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const body = await readJson(request);
  if (!body?.name?.trim()) return jsonError("O nome do escritório é obrigatório.", 400);
  if (!PLANS.includes(body.plan)) return jsonError("Plano inválido.", 400);
  if (body.lifecycle_status !== undefined && !COMPANY_LIFECYCLES.includes(body.lifecycle_status)) return jsonError("Status do ciclo inválido.", 400);
  return save(id, {
    name: body.name.trim(), cnpj: body.cnpj?.trim() || null,
    contact_email: body.contact_email?.trim() || null, contact_phone: body.contact_phone?.trim() || null,
    plan: body.plan, notes: body.notes?.trim() || null,
    ...(body.lifecycle_status !== undefined ? { lifecycle_status: body.lifecycle_status } : {}),
  }, auth.session.user.email);
}

export async function PATCH(request: Request, { params }: Context) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const body = await readJson(request);
  if (!body) return jsonError("Corpo da requisição inválido.", 400);
  if (body.name !== undefined && !String(body.name).trim()) return jsonError("O nome não pode ficar vazio.", 400);
  if (body.plan !== undefined && !PLANS.includes(body.plan)) return jsonError("Plano inválido.", 400);
  if (body.lifecycle_status !== undefined && !COMPANY_LIFECYCLES.includes(body.lifecycle_status)) return jsonError("Status do ciclo inválido.", 400);
  const allowed = ["name", "cnpj", "contact_email", "contact_phone", "plan", "notes", "lifecycle_status"] as const;
  const data = Object.fromEntries(allowed.filter((key) => key in body).map((key) => [key, typeof body[key] === "string" ? body[key].trim() || null : body[key]]));
  return save(id, data, auth.session.user.email);
}

export async function DELETE(_: Request, { params }: Context) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const result = await deleteCompany((await params).id, auth.session.user.email);
  if (result === "not_found") return jsonError(NOT_FOUND, 404);
  if (result === "in_use") return jsonError("Este escritório já tem casos de triagem e não pode ser removido. Marque-o como inativo.", 409);
  return NextResponse.json({ success: true });
}
