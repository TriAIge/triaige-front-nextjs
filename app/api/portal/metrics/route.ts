import { NextResponse } from "next/server";
import { requireFirm } from "@/lib/auth";
import { parsePeriod } from "@/lib/http";
import { portalMetrics } from "@/lib/repos/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireFirm();
  if (!auth.ok) return auth.response;
  return NextResponse.json(await portalMetrics(auth.session.company.id, parsePeriod(new URL(request.url))));
}
