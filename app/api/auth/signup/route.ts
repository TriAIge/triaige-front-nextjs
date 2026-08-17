import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createUser, findUser } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.name?.trim() || !body?.email?.trim() || !body?.password) return NextResponse.json({ error: "Nome, email e senha são obrigatórios." }, { status: 400 });
  if (body.password.length < 6) return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });
  if (await findUser(body.email)) return NextResponse.json({ error: "Este email já está cadastrado." }, { status: 409 });
  const user = await createUser({ name: body.name.trim(), email: body.email.trim().toLowerCase(), password: body.password });
  const token = createHash("sha256").update(`${user.id}:${Date.now()}`).digest("hex");
  return NextResponse.json({ user: { name: user.name, email: user.email }, token }, { status: 201 });
}

