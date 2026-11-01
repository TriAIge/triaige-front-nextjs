import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { deleteStaffUser, setStaffUserActive, updateStaffUser } from "@/lib/db";
import { isMysqlError, jsonError, readJson, trimOrNull } from "@/lib/http";
import { STAFF_ROLES, type StaffRole } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const userId = (await params).id;
  const body = await readJson(request);
  const name = trimOrNull(body?.name);
  const email = trimOrNull(body?.email)?.toLowerCase();
  const role = trimOrNull(body?.role) as StaffRole | null;
  if (!name || !email || !role) return jsonError("Nome, email e perfil são obrigatórios.", 400);
  if (!(STAFF_ROLES as readonly string[]).includes(role)) return jsonError("Perfil inválido.", 400);
  const password = body?.password != null && String(body.password).length > 0 ? String(body.password) : null;
  if (password && password.length < 6) return jsonError("A senha deve ter pelo menos 6 caracteres.", 400);
  try {
    const user = await updateStaffUser(
      userId,
      { name, email, role, job_title: trimOrNull(body?.job_title), password },
      auth.session.user.email,
    );
    return NextResponse.json({ user });
  } catch (error) {
    if (isMysqlError(error, "ER_DUP_ENTRY") || (error as { code?: string }).code === "DUPLICATE") {
      return jsonError("Este email já está cadastrado.", 409);
    }
    if ((error as { code?: string }).code === "NOT_FOUND") return jsonError("Usuário não encontrado.", 404);
    if ((error as { code?: string }).code === "LAST_ADMIN") {
      return jsonError("É preciso manter ao menos um admin ativo.", 409);
    }
    if ((error as { code?: string }).code === "VALIDATION") return jsonError("Perfil inválido.", 400);
    throw error;
  }
}

export async function PATCH(request: Request, { params }: Context) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const userId = (await params).id;
  if (userId === auth.session.user.id) return jsonError("Você não pode inativar a própria conta.", 400);
  const body = await readJson(request);
  if (typeof body?.active !== "boolean") return jsonError("Informe active (true|false).", 400);
  try {
    const user = await setStaffUserActive(userId, body.active, auth.session.user.email);
    return NextResponse.json({ user });
  } catch (error) {
    if ((error as { code?: string }).code === "NOT_FOUND") return jsonError("Usuário não encontrado.", 404);
    if ((error as { code?: string }).code === "LAST_ADMIN") {
      return jsonError("É preciso manter ao menos um admin ativo.", 409);
    }
    throw error;
  }
}

export async function DELETE(_: Request, { params }: Context) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const userId = (await params).id;
  if (userId === auth.session.user.id) return jsonError("Você não pode excluir a própria conta.", 400);
  try {
    await deleteStaffUser(userId, auth.session.user.email);
    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as { code?: string }).code === "NOT_FOUND") return jsonError("Usuário não encontrado.", 404);
    if ((error as { code?: string }).code === "LAST_ADMIN") {
      return jsonError("É preciso manter ao menos um admin ativo.", 409);
    }
    throw error;
  }
}
