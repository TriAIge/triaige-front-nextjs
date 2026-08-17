import { NextResponse } from "next/server";
export const runtime = "nodejs";
export function GET() { return NextResponse.json({ status: "operational", service: "triaige-api", timestamp: new Date().toISOString() }); }
