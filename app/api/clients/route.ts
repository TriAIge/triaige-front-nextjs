import { NextResponse } from "next/server";
import { createCompany, listCompanies } from "@/lib/db";
import { PLANS } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() { return NextResponse.json(await listCompanies()); }

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.name?.trim()) return NextResponse.json({ error: "O nome do escritório é obrigatório." }, { status: 400 });
  if (!PLANS.includes(body.plan)) return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
  const company = await createCompany({
    name: body.name.trim(), cnpj: body.cnpj?.trim() || null,
    contact_email: body.contact_email?.trim() || null, contact_phone: body.contact_phone?.trim() || null,
    plan: body.plan, notes: body.notes?.trim() || null,
  });
  return NextResponse.json(company, { status: 201 });
}

