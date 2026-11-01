import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { getCompany } from "@/lib/db";
import { jsonError, readJson, toDate, trimOrNull } from "@/lib/http";
import { createCredential, listCredentials } from "@/lib/repos/credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_VALIDITY_DAYS = 365;

export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  return NextResponse.json(await listCredentials());
}

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const body = await readJson(request);
  if (!body?.company_id) return jsonError("Informe o escritório.", 400);
  if (!(await getCompany(String(body.company_id)))) return jsonError("Escritório não encontrado.", 404);
  const expiresAt = body.expires_at !== undefined
    ? toDate(body.expires_at)
    : new Date(Date.now() + DEFAULT_VALIDITY_DAYS * 86_400_000);
  if (!expiresAt || expiresAt.getTime() <= Date.now()) return jsonError("Data de expiração inválida.", 400);
  const name = trimOrNull(body.name) ?? "Credencial emitida pelo painel";
  if (name.length > 100) return jsonError("O nome da credencial deve ter até 100 caracteres.", 400);
  const result = await createCredential(String(body.company_id), { name, expiresAt }, auth.session.user.email);
  return NextResponse.json(result, { status: 201 });
}
