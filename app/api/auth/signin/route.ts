import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { findUser } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.email || !body?.password) return NextResponse.json({ error: "Informe email e senha." }, { status: 400 });
  const user = await findUser(body.email);
  if (!user || !verifyPassword(body.password, user.password_hash)) return NextResponse.json({ error: "Email ou senha inválidos. Use demo@triaige.ai / demo123." }, { status: 401 });
  const token = createHash("sha256").update(`${user.id}:${Date.now()}`).digest("hex");
  return NextResponse.json({ user: { name: user.name, email: user.email }, token });
}
