import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { findUser, signupFirmUser } from "@/lib/db";
import { isMysqlError, jsonError, readJson, trimOrNull } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await readJson(request);
  const name = trimOrNull(body?.name);
  const email = trimOrNull(body?.email)?.toLowerCase();
  const company = trimOrNull(body?.company);
  if (!name || !email || !body?.password) return jsonError("Nome, email e senha são obrigatórios.", 400);
  if (!company) return jsonError("Informe a empresa ou escritório.", 400);
  if (String(body.password).length < 6) return jsonError("A senha deve ter pelo menos 6 caracteres.", 400);
  if (await findUser(email)) return jsonError("Este email já está cadastrado.", 409);
  try {
    const userId = await signupFirmUser({ name, email, password: String(body.password), company, job_title: trimOrNull(body.job_title) });
    await createSession(userId);
  } catch (error) {
    if (isMysqlError(error, "ER_DUP_ENTRY")) return jsonError("Este email já está cadastrado.", 409);
    throw error;
  }
  return NextResponse.json({ user: { name, email, role: "firm_user" } }, { status: 201 });
}
