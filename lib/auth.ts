import { createHash, randomBytes } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { jsonError } from "./http";
import { db } from "./mysql";
import { STAFF_ROLES, type SessionInfo, type UserRole } from "./types";

export const SESSION_COOKIE = "triaige_session";
const SESSION_TTL_DAYS = 7;

export type AuthResult = { ok: true; session: SessionInfo } | { ok: false; response: NextResponse };

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);
  await db.execute("DELETE FROM app_sessions WHERE expires_at < NOW(6)");
  await db.execute("INSERT INTO app_sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, NOW(6))",
    [hashToken(token), userId, expiresAt]);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.execute("DELETE FROM app_sessions WHERE token_hash = ?", [hashToken(token)]);
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionInfo | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT u.id, u.nome AS name, u.email, u.role, u.cargo AS job_title, u.must_change_password,
       f.id AS company_id, f.nome AS company_name, COALESCE(f.plano, 'Starter') AS company_plan
     FROM app_sessions s JOIN app_users u ON u.id = s.user_id LEFT JOIN law_firms f ON f.id = u.law_firm_id
     WHERE s.token_hash = ? AND s.expires_at > NOW(6) AND u.ativo = 1 LIMIT 1`,
    [hashToken(token)],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      job_title: row.job_title,
      must_change_password: Boolean(Number(row.must_change_password)),
    },
    company: row.company_id ? { id: row.company_id, name: row.company_name, plan: row.company_plan } : null,
  };
}

export async function requireSession(
  roles?: readonly UserRole[],
  opts?: { allowMustChangePassword?: boolean },
): Promise<AuthResult> {
  const session = await getSession();
  if (!session) return { ok: false, response: jsonError("Sessão expirada ou inexistente. Faça login novamente.", 401) };
  if (roles && !roles.includes(session.user.role)) return { ok: false, response: jsonError("Acesso não permitido para este perfil.", 403) };
  if (session.user.must_change_password && !opts?.allowMustChangePassword) {
    return { ok: false, response: jsonError("Redefina sua senha antes de continuar.", 403) };
  }
  return { ok: true, session };
}

export const requireStaff = () => requireSession(STAFF_ROLES);

/** Firm users only; guarantees `session.company` is present. */
export async function requireFirm(): Promise<
  { ok: true; session: SessionInfo & { company: NonNullable<SessionInfo["company"]> } } | { ok: false; response: NextResponse }
> {
  const auth = await requireSession(["firm_user"]);
  if (!auth.ok) return auth;
  const { company } = auth.session;
  if (!company) return { ok: false, response: jsonError("Usuário sem escritório vinculado.", 403) };
  return { ok: true, session: { ...auth.session, company } };
}
