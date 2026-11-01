import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { createStaffUser, listStaffUsers } from "@/lib/db";
import { isMysqlError, jsonError, readJson, trimOrNull } from "@/lib/http";
import { STAFF_ROLES, type StaffRole } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  return NextResponse.json(await listStaffUsers());
}

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const body = await readJson(request);
  const name = trimOrNull(body?.name);
  const email = trimOrNull(body?.email)?.toLowerCase();
  const role = trimOrNull(body?.role) as StaffRole | null;
  if (!name || !email || !body?.password || !role) {
    return jsonError("Nome, email, senha e perfil são obrigatórios.", 400);
  }
  if (!(STAFF_ROLES as readonly string[]).includes(role)) return jsonError("Perfil inválido.", 400);
  if (String(body.password).length < 6) return jsonError("A senha deve ter pelo menos 6 caracteres.", 400);
  try {
    const user = await createStaffUser(
      { name, email, password: String(body.password), role, job_title: trimOrNull(body?.job_title) },
      auth.session.user.email,
    );
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (isMysqlError(error, "ER_DUP_ENTRY") || (error as { code?: string }).code === "DUPLICATE") {
      return jsonError("Este email já está cadastrado.", 409);
    }
    if ((error as { code?: string }).code === "VALIDATION") return jsonError("Perfil inválido.", 400);
    throw error;
  }
}
