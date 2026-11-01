import { NextResponse } from "next/server";
import { requireFirm } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/http";
import { deleteRecipient, updateRecipient } from "@/lib/repos/portal";
import { parseRecipient } from "../validation";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

const NOT_FOUND = "Destinatário não encontrado.";

export async function PATCH(request: Request, { params }: Context) {
  const auth = await requireFirm();
  if (!auth.ok) return auth.response;
  const body = await readJson(request);
  if (!body) return jsonError("Corpo da requisição inválido.", 400);
  const parsed = parseRecipient(body, true);
  if ("error" in parsed) return jsonError(parsed.error, 400);
  const updated = await updateRecipient(auth.session.company.id, (await params).id, parsed.data);
  return updated ? NextResponse.json(updated) : jsonError(NOT_FOUND, 404);
}

export const PUT = PATCH;

export async function DELETE(_: Request, { params }: Context) {
  const auth = await requireFirm();
  if (!auth.ok) return auth.response;
  return await deleteRecipient(auth.session.company.id, (await params).id)
    ? NextResponse.json({ success: true })
    : jsonError(NOT_FOUND, 404);
}
