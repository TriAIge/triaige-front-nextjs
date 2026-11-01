import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { deleteFirmUser, getCompany, setFirmUserActive, updateFirmUser } from "@/lib/db";
import { isMysqlError, jsonError, readJson, trimOrNull } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string; userId: string }> };

export async function PUT(request: Request, { params }: Context) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { id: companyId, userId } = await params;
  if (!(await getCompany(companyId))) return jsonError("Escritório não encontrado.", 404);
  const body = await readJson(request);
  const name = trimOrNull(body?.name);
  const email = trimOrNull(body?.email)?.toLowerCase();
  if (!name || !email) return jsonError("Nome e email são obrigatórios.", 400);
  const password = body?.password != null && String(body.password).length > 0 ? String(body.password) : null;
  if (password && password.length < 6) return jsonError("A senha deve ter pelo menos 6 caracteres.", 400);
  try {
    const user = await updateFirmUser(
      companyId,
      userId,
      { name, email, job_title: trimOrNull(body?.job_title), password },
      auth.session.user.email,
    );
    return NextResponse.json({ user });
  } catch (error) {
    if (isMysqlError(error, "ER_DUP_ENTRY") || (error as { code?: string }).code === "DUPLICATE") {
      return jsonError("Este email já está cadastrado.", 409);
    }
    if ((error as { code?: string }).code === "NOT_FOUND") return jsonError("Usuário não encontrado.", 404);
    throw error;
  }
}

export async function PATCH(request: Request, { params }: Context) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { id: companyId, userId } = await params;
  if (!(await getCompany(companyId))) return jsonError("Escritório não encontrado.", 404);
  const body = await readJson(request);
  if (typeof body?.active !== "boolean") return jsonError("Informe active (true|false).", 400);
  try {
    const user = await setFirmUserActive(companyId, userId, body.active, auth.session.user.email);
    return NextResponse.json({ user });
  } catch (error) {
    if ((error as { code?: string }).code === "NOT_FOUND") return jsonError("Usuário não encontrado.", 404);
    throw error;
  }
}

export async function DELETE(_: Request, { params }: Context) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const { id: companyId, userId } = await params;
  if (!(await getCompany(companyId))) return jsonError("Escritório não encontrado.", 404);
  try {
    await deleteFirmUser(companyId, userId, auth.session.user.email);
    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as { code?: string }).code === "NOT_FOUND") return jsonError("Usuário não encontrado.", 404);
    throw error;
  }
}
