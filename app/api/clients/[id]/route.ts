import { NextResponse } from "next/server";
import { deleteCompany, getCompany, updateCompany } from "@/lib/db";
import { PLANS } from "@/lib/types";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  const company = await getCompany((await params).id);
  return company ? NextResponse.json(company) : NextResponse.json({ error: "Escritório não encontrado." }, { status: 404 });
}

export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.name?.trim()) return NextResponse.json({ error: "O nome do escritório é obrigatório." }, { status: 400 });
  if (!PLANS.includes(body.plan)) return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
  const company = await updateCompany(id, {
    name: body.name.trim(), cnpj: body.cnpj?.trim() || null,
    contact_email: body.contact_email?.trim() || null, contact_phone: body.contact_phone?.trim() || null,
    plan: body.plan, notes: body.notes?.trim() || null,
  });
  return company ? NextResponse.json(company) : NextResponse.json({ error: "Escritório não encontrado." }, { status: 404 });
}

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  if (body.name !== undefined && !body.name.trim()) return NextResponse.json({ error: "O nome não pode ficar vazio." }, { status: 400 });
  if (body.plan !== undefined && !PLANS.includes(body.plan)) return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
  const allowed = ["name", "cnpj", "contact_email", "contact_phone", "plan", "notes"] as const;
  const data = Object.fromEntries(allowed.filter((key) => key in body).map((key) => [key, typeof body[key] === "string" ? body[key].trim() || null : body[key]]));
  if (typeof data.name === "string") data.name = data.name.trim();
  const company = await updateCompany(id, data);
  return company ? NextResponse.json(company) : NextResponse.json({ error: "Escritório não encontrado." }, { status: 404 });
}

export async function DELETE(_: Request, { params }: Context) {
  const { id } = await params;
  return await deleteCompany(id)
    ? NextResponse.json({ success: true })
    : NextResponse.json({ error: "Escritório não encontrado." }, { status: 404 });
}
