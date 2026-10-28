import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { listCases } from "@/lib/db";
import { parsePaging } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Read-only: sessions are created and advanced by triaige-srv-orchestrator. */
export async function GET(request: Request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const { limit, offset } = parsePaging(url, null);
  const { items, total } = await listCases({
    status: url.searchParams.get("status"), company_id: url.searchParams.get("company_id"),
    area: url.searchParams.get("area"), q: url.searchParams.get("q")?.trim(), limit, offset,
  });
  return NextResponse.json(items, { headers: { "X-Total-Count": String(total) } });
}
