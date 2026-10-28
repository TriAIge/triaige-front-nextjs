import { NextResponse } from "next/server";
import { METRIC_PERIODS, type MetricPeriod } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsonBody = Record<string, any>;

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function readJson(request: Request): Promise<JsonBody | null> {
  const body = await request.json().catch(() => null);
  return body && typeof body === "object" && !Array.isArray(body) ? body : null;
}

export function isMysqlError(error: unknown, code: string) {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === code;
}

/** SQL fragment that renders a DATETIME column as an ISO-8601 UTC string. */
export const iso = (column: string) => `DATE_FORMAT(${column}, '%Y-%m-%dT%H:%i:%s.000Z')`;

export function toDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parsePeriod(url: URL, fallback: MetricPeriod = 30): MetricPeriod {
  const value = Number(url.searchParams.get("period"));
  return (METRIC_PERIODS as readonly number[]).includes(value) ? (value as MetricPeriod) : fallback;
}

export function parsePaging(url: URL, defaultLimit: number | null, maxLimit = 500) {
  const rawLimit = Number(url.searchParams.get("limit"));
  const limit = rawLimit > 0 ? Math.min(Math.floor(rawLimit), maxLimit) : defaultLimit;
  const page = Math.max(1, Math.floor(Number(url.searchParams.get("page")) || 1));
  return { limit, offset: limit ? (page - 1) * limit : 0 };
}

export function trimOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
