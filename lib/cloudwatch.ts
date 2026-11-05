import { CloudWatchClient, GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";

const CACHE_TTL_MS = 5 * 60 * 1000;
const PERIOD_SECONDS = 300;

let client: CloudWatchClient | null = null;
const cache = new Map<number, { value: number | null; expiresAt: number }>();

function cloudwatch(): CloudWatchClient {
  if (!client) client = new CloudWatchClient({ region: process.env.AWS_REGION || "us-east-1" });
  return client;
}

/**
 * Uptime da API = % dos intervalos de 5 min em que o target group do orchestrator teve
 * pelo menos uma instância saudável no ALB (métrica HealthyHostCount, estatística Minimum).
 * Retorna null se a integração não estiver configurada ou se ainda não houver dados.
 */
export async function apiUptimePercent(days: number): Promise<number | null> {
  const loadBalancer = process.env.CLOUDWATCH_ALB_DIMENSION;
  const targetGroup = process.env.CLOUDWATCH_API_TARGET_GROUP;
  if (!loadBalancer || !targetGroup) return null;

  const cached = cache.get(days);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const values: number[] = [];
  let nextToken: string | undefined;
  do {
    const out = await cloudwatch().send(
      new GetMetricDataCommand({
        StartTime: start,
        EndTime: end,
        NextToken: nextToken,
        MetricDataQueries: [
          {
            Id: "healthy",
            MetricStat: {
              Metric: {
                Namespace: "AWS/ApplicationELB",
                MetricName: "HealthyHostCount",
                Dimensions: [
                  { Name: "LoadBalancer", Value: loadBalancer },
                  { Name: "TargetGroup", Value: targetGroup },
                ],
              },
              Period: PERIOD_SECONDS,
              Stat: "Minimum",
            },
          },
        ],
      }),
    );
    values.push(...(out.MetricDataResults?.[0]?.Values ?? []));
    nextToken = out.NextToken;
  } while (nextToken);

  const value = values.length ? (values.filter((v) => v >= 1).length / values.length) * 100 : null;
  cache.set(days, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}
