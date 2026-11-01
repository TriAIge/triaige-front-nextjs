import { NextResponse } from "next/server";
import { requireFirm } from "@/lib/auth";
import { listCases } from "@/lib/db";
import { parsePaging } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireFirm();
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const { limit, offset } = parsePaging(url, null);
  const { items, total } = await listCases({
    company_id: auth.session.company.id, status: url.searchParams.get("status"),
    area: url.searchParams.get("area"), q: url.searchParams.get("q")?.trim(), limit, offset,
  });
  return NextResponse.json(items, { headers: { "X-Total-Count": String(total) } });
}
