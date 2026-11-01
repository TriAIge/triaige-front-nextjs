import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { changeOwnPassword, findUser } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { verifyPassword } from "@/lib/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireSession(undefined, { allowMustChangePassword: true });
  if (!auth.ok) return auth.response;
  const body = await readJson(request);
  const currentPassword = body?.current_password != null ? String(body.current_password) : "";
  const newPassword = body?.new_password != null ? String(body.new_password) : "";
  if (!currentPassword || !newPassword) return jsonError("Informe a senha atual e a nova senha.", 400);
  if (newPassword.length < 6) return jsonError("A nova senha deve ter pelo menos 6 caracteres.", 400);
  if (currentPassword === newPassword) return jsonError("A nova senha deve ser diferente da atual.", 400);

  const user = await findUser(auth.session.user.email);
  if (!user || !verifyPassword(currentPassword, user.password_hash)) {
    return jsonError("Senha atual incorreta.", 401);
  }
  await changeOwnPassword(auth.session.user.id, newPassword);
  return NextResponse.json({ success: true });
}
