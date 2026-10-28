import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { revokeCredential } from "@/lib/repos/credentials";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: Context) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const credential = await revokeCredential((await params).id, auth.session.user.email);
  return credential ? NextResponse.json(credential) : jsonError("Credencial não encontrada.", 404);
}
