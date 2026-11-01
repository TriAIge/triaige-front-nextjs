import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { parsePaging, toDate } from "@/lib/http";
import { listAuditEvents } from "@/lib/repos/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const { limit, offset } = parsePaging(url, 200);
  const param = (name: string) => url.searchParams.get(name)?.trim() || undefined;
  const { items, total } = await listAuditEvents({
    company_id: param("company_id"), event_type: param("event_type"), correlation_id: param("correlation_id"),
    from: toDate(param("from"))?.toISOString(), to: toDate(param("to"))?.toISOString(),
    limit: limit ?? 200, offset,
  });
  return NextResponse.json(items, { headers: { "X-Total-Count": String(total) } });
}
