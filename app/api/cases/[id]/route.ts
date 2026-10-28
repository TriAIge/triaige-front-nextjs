import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { getCase } from "@/lib/db";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const row = await getCase((await params).id);
  return row ? NextResponse.json(row) : jsonError("Caso não encontrado.", 404);
}
