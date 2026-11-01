import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSession(undefined, { allowMustChangePassword: true });
  return auth.ok ? NextResponse.json(auth.session) : auth.response;
}
