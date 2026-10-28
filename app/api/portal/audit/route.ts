import { NextResponse } from "next/server";
import { requireFirm } from "@/lib/auth";
import { listPortalAuditEvents } from "@/lib/repos/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireFirm();
  if (!auth.ok) return auth.response;
  return NextResponse.json(await listPortalAuditEvents(auth.session.company.id));
}
