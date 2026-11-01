import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { lgpdSummary } from "@/lib/repos/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  return NextResponse.json(await lgpdSummary());
}
