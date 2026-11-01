import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { findUser, updateOwnProfile } from "@/lib/db";
import { isMysqlError, jsonError, readJson, trimOrNull } from "@/lib/http";
import { verifyPassword } from "@/lib/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  const auth = await requireSession(undefined, { allowMustChangePassword: true });
  if (!auth.ok) return auth.response;
  const body = await readJson(request);
  const name = trimOrNull(body?.name);
  const email = trimOrNull(body?.email)?.toLowerCase();
  if (!name || !email) return jsonError("Nome e email são obrigatórios.", 400);

  const newPassword = body?.new_password != null && String(body.new_password).length > 0 ? String(body.new_password) : null;
  if (newPassword) {
    if (newPassword.length < 6) return jsonError("A nova senha deve ter pelo menos 6 caracteres.", 400);
    const currentPassword = body?.current_password != null ? String(body.current_password) : "";
    if (!currentPassword) return jsonError("Informe a senha atual para trocar a senha.", 400);
    const user = await findUser(auth.session.user.email);
    if (!user || !verifyPassword(currentPassword, user.password_hash)) {
      return jsonError("Senha atual incorreta.", 401);
    }
    if (currentPassword === newPassword) return jsonError("A nova senha deve ser diferente da atual.", 400);
  }

  try {
    const profile = await updateOwnProfile(auth.session.user.id, {
      name,
      email,
      job_title: trimOrNull(body?.job_title),
      password: newPassword,
    });
    return NextResponse.json({
      user: {
        id: auth.session.user.id,
        name: profile.name,
        email: profile.email,
        role: auth.session.user.role,
        job_title: profile.job_title,
        must_change_password: newPassword ? false : auth.session.user.must_change_password,
      },
    });
  } catch (error) {
    if (isMysqlError(error, "ER_DUP_ENTRY") || (error as { code?: string }).code === "DUPLICATE") {
      return jsonError("Este email já está cadastrado.", 409);
    }
    throw error;
  }
}
