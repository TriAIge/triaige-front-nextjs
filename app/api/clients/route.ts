import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { createCompany, getCompany, listCompanies } from "@/lib/db";
import { isMysqlError, jsonError, readJson } from "@/lib/http";
import { COMPANY_LIFECYCLES, PLANS } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  return NextResponse.json(await listCompanies());
}

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const body = await readJson(request);
  if (!body?.name?.trim()) return jsonError("O nome do escritório é obrigatório.", 400);
  if (!PLANS.includes(body.plan)) return jsonError("Plano inválido.", 400);
  if (body.lifecycle_status !== undefined && !COMPANY_LIFECYCLES.includes(body.lifecycle_status)) return jsonError("Status do ciclo inválido.", 400);
  try {
    const id = await createCompany({
      name: body.name.trim(), cnpj: body.cnpj?.trim() || null,
      contact_email: body.contact_email?.trim() || null, contact_phone: body.contact_phone?.trim() || null,
      plan: body.plan, notes: body.notes?.trim() || null, lifecycle_status: body.lifecycle_status ?? "ativa",
    }, auth.session.user.email);
    return NextResponse.json(await getCompany(id), { status: 201 });
  } catch (error) {
    if (isMysqlError(error, "ER_DUP_ENTRY")) return jsonError("Já existe um escritório com este CNPJ.", 409);
    throw error;
  }
}
