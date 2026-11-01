import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { createFirmUser, getCompany, listFirmUsers } from "@/lib/db";
import { isMysqlError, jsonError, readJson, trimOrNull } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const companyId = (await params).id;
  if (!(await getCompany(companyId))) return jsonError("Escritório não encontrado.", 404);
  return NextResponse.json(await listFirmUsers(companyId));
}

export async function POST(request: Request, { params }: Context) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const companyId = (await params).id;
  const body = await readJson(request);
  const name = trimOrNull(body?.name);
  const email = trimOrNull(body?.email)?.toLowerCase();
  if (!name || !email || !body?.password) return jsonError("Nome, email e senha são obrigatórios.", 400);
  if (String(body.password).length < 6) return jsonError("A senha deve ter pelo menos 6 caracteres.", 400);
  try {
    const created = await createFirmUser(
      { name, email, password: String(body.password), company_id: companyId, job_title: trimOrNull(body.job_title) },
      auth.session.user.email,
    );
    const users = await listFirmUsers(companyId);
    const user = users.find((u) => u.id === created.id)!;
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (isMysqlError(error, "ER_DUP_ENTRY") || (error as { code?: string }).code === "DUPLICATE") {
      return jsonError("Este email já está cadastrado.", 409);
    }
    if ((error as { code?: string }).code === "NOT_FOUND") return jsonError("Escritório não encontrado.", 404);
    throw error;
  }
}
