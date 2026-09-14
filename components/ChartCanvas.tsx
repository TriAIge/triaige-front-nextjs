"use client";

import { useEffect, useRef } from "react";
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type ChartConfiguration,
} from "chart.js";

Chart.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  ArcElement,
  DoughnutController,
  Filler,
  Legend,
  Tooltip,
);

type ChartCanvasProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: ChartConfiguration<any, any, any>;
  className?: string;
};

export function ChartCanvas({ config, className }: ChartCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    Chart.defaults.color = "oklch(0.74 0.03 90)";
    Chart.defaults.borderColor = "oklch(1 0 0 / 0.08)";
    Chart.defaults.font.family = "Inter, ui-sans-serif, system-ui, sans-serif";
    chartRef.current = new Chart(canvasRef.current, config);
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [config]);

  return (
    <div className={className ?? "h-56"}>
      <canvas ref={canvasRef} />
    </div>
  );
}
