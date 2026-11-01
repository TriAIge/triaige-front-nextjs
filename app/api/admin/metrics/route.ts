import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { parsePeriod } from "@/lib/http";
import { businessMetrics } from "@/lib/repos/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  return NextResponse.json(await businessMetrics(parsePeriod(new URL(request.url))));
}
