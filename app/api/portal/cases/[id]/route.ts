import { NextResponse } from "next/server";
import { requireFirm } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { getPortalCaseDetail } from "@/lib/repos/portal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  const auth = await requireFirm();
  if (!auth.ok) return auth.response;
  const result = await getPortalCaseDetail(auth.session.company.id, (await params).id);
  return result ? NextResponse.json(result) : jsonError("Caso não encontrado.", 404);
}
