import { NextResponse } from "next/server";
import { deleteCase, getCase, listCases, updateCase } from "@/lib/db";
import { CASE_CHANNELS, CASE_STATUSES } from "@/lib/types";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  const row = await getCase((await params).id);
  return row ? NextResponse.json(row) : NextResponse.json({ error: "Case não encontrado." }, { status: 404 });
}

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (body?.status !== undefined && !CASE_STATUSES.includes(body.status)) return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  if (body?.channel !== undefined && !CASE_CHANNELS.includes(body.channel)) return NextResponse.json({ error: "Canal inválido." }, { status: 400 });
  if (!body) return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  if (body.case_code !== undefined && !body.case_code.trim()) return NextResponse.json({ error: "O ID do case não pode ficar vazio." }, { status: 400 });
  if (body.case_code !== undefined && (await listCases()).some((item) => item.id !== id && item.case_code.toLowerCase() === body.case_code.trim().toLowerCase())) return NextResponse.json({ error: "Já existe um case com este ID." }, { status: 409 });
  const allowed = ["case_code", "status", "channel", "company_id", "plan", "deadline", "notes", "sender_registered"] as const;
  const data = Object.fromEntries(allowed.filter((key) => key in body).map((key) => [key, body[key]]));
  const row = await updateCase(id, data);
  return row ? NextResponse.json(row) : NextResponse.json({ error: "Case não encontrado." }, { status: 404 });
}

export const PUT = PATCH;

export async function DELETE(_: Request, { params }: Context) {
  const { id } = await params;
  return await deleteCase(id)
    ? NextResponse.json({ success: true })
    : NextResponse.json({ error: "Case não encontrado." }, { status: 404 });
}
