import { NextResponse } from "next/server";
import { requireFirm } from "@/lib/auth";
import { getCompanyCredential } from "@/lib/repos/credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireFirm();
  if (!auth.ok) return auth.response;
  return NextResponse.json(await getCompanyCredential(auth.session.company.id));
}
