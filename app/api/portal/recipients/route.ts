import { NextResponse } from "next/server";
import { requireFirm } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/http";
import { createRecipient, listRecipients } from "@/lib/repos/portal";
import type { PortalRecipientInput } from "@/lib/types";
import { parseRecipient } from "./validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireFirm();
  if (!auth.ok) return auth.response;
  return NextResponse.json(await listRecipients(auth.session.company.id));
}

export async function POST(request: Request) {
  const auth = await requireFirm();
  if (!auth.ok) return auth.response;
  const body = await readJson(request);
  if (!body) return jsonError("Corpo da requisição inválido.", 400);
  const parsed = parseRecipient(body, false);
  if ("error" in parsed) return jsonError(parsed.error, 400);
  const created = await createRecipient(auth.session.company.id, parsed.data as PortalRecipientInput);
  return NextResponse.json(created, { status: 201 });
}
