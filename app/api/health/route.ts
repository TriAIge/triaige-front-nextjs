import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
export const runtime = "nodejs";
export async function GET() {
  try {
    await db.query("SELECT 1 AS connected");
    return NextResponse.json({ status: "operational", database: "connected", service: "triaige-api", timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: "unavailable", database: "disconnected", service: "triaige-api", timestamp: new Date().toISOString() }, { status: 503 });
  }
}
