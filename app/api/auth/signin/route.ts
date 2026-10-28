import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { findUser } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { verifyPassword } from "@/lib/password";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body?.email || !body?.password) return jsonError("Informe email e senha.", 400);
  const user = await findUser(String(body.email));
  if (!user || !verifyPassword(String(body.password), user.password_hash)) return jsonError("Email ou senha inválidos.", 401);
  if (user.role === "firm_user" && !user.company_id) return jsonError("Usuário sem escritório vinculado. Fale com o suporte.", 403);
  await createSession(user.id);
  return NextResponse.json({ user: { name: user.name, email: user.email, role: user.role } });
}
