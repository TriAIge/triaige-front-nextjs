import { NextResponse } from "next/server";
import { createCase, listCases } from "@/lib/db";
import { CASE_CHANNELS, CASE_STATUSES } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() { return NextResponse.json(await listCases()); }

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.case_code?.trim()) return NextResponse.json({ error: "O ID do case é obrigatório." }, { status: 400 });
  if (!CASE_STATUSES.includes(body.status)) return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  if (!CASE_CHANNELS.includes(body.channel)) return NextResponse.json({ error: "Canal inválido." }, { status: 400 });
  const duplicate = (await listCases()).some((item) => item.case_code.toLowerCase() === body.case_code.trim().toLowerCase());
  if (duplicate) return NextResponse.json({ error: "Já existe um case com este ID." }, { status: 409 });
  const row = await createCase({
    case_code: body.case_code.trim(), company_id: body.company_id || null,
    channel: body.channel, status: body.status, sender_registered: Boolean(body.sender_registered),
    plan: body.plan || null, notes: body.notes?.trim() || null, deadline: body.deadline || null,
  });
  return NextResponse.json(row, { status: 201 });
}

