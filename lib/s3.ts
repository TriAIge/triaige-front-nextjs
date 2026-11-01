import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

const CACHE_TTL_MS = 5 * 60 * 1000;
const FAILURE_TTL_MS = 60 * 1000;
const CACHE_MAX_ENTRIES = 500;

let client: S3Client | null = null;
const cache = new Map<string, { value?: unknown; error?: unknown; expiresAt: number }>();

function s3(): S3Client {
  if (!client) {
    const endpoint = process.env.AWS_S3_ENDPOINT || undefined;
    client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      endpoint,
      forcePathStyle: Boolean(endpoint),
    });
  }
  return client;
}

function remember(key: string, entry: { value?: unknown; error?: unknown }, ttl: number) {
  if (cache.size >= CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value!);
  cache.set(key, { ...entry, expiresAt: Date.now() + ttl });
}

/**
 * Reads and parses a JSON object. Report objects are immutable once written, so results are cached by bucket/key;
 * failures are cached for a shorter time so a missing object or absent credentials don't stall every request.
 */
export async function getReportJson<T = unknown>(bucket: string, key: string): Promise<T> {
  const cacheKey = `${bucket}/${key}`;
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) {
    if (hit.error) throw hit.error;
    return hit.value as T;
  }

  try {
    const response = await s3().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!response.Body) throw new Error(`S3 object s3://${cacheKey} has no body`);
    const value = JSON.parse(await response.Body.transformToString("utf-8")) as T;
    remember(cacheKey, { value }, CACHE_TTL_MS);
    return value;
  } catch (error) {
    remember(cacheKey, { error }, FAILURE_TTL_MS);
    throw error;
  }
}
