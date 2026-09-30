import type { Alert, Dataset } from "./types.ts";

const WEEK_MS = 7 * 24 * 3600 * 1000;

export interface WeekPoint {
  week: string;
  startMs: number;
  label: string;
  alerts: number;
  closed: number;
  critical: number;
  weekend: number;
}

export function weeklyVolume(alerts: Alert[], windowStart: string, windowEnd: string): WeekPoint[] {
  const start = new Date(windowStart).getTime();
  const end = new Date(windowEnd).getTime();
  const n = Math.max(1, Math.ceil((end - start) / WEEK_MS));
  const buckets: WeekPoint[] = [];
  for (let i = 0; i < n; i++) {
    const s = start + i * WEEK_MS;
    const e = Math.min(end, s + WEEK_MS);
    const slice = alerts.filter((a) => {
      const t = new Date(a.ts).getTime();
      return t >= s && t < e;
    });
    buckets.push({
      week: `W${i + 1}`,
      startMs: s,
      label: new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      alerts: slice.length,
      closed: slice.filter((a) => a.closedAt).length,
      critical: slice.filter((a) => a.severity === "critical" || a.severity === "high").length,
      weekend: slice.filter((a) => {
        const d = new Date(a.ts).getUTCDay();
        return d === 0 || d === 6;
      }).length,
    });
  }
  return buckets;
}

export function nationalWeekly(ds: Dataset): WeekPoint[] {
  return weeklyVolume(ds.alerts, ds.windowStart, ds.windowEnd);
}

export function entityWeekly(ds: Dataset, entityId: string): WeekPoint[] {
  return weeklyVolume(
    ds.alerts.filter((a) => a.entityId === entityId),
    ds.windowStart,
    ds.windowEnd,
  );
}

export function tempoGrid(timestamps: string[]): { grid: number[][]; max: number } {
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  for (const iso of timestamps) {
    const d = new Date(iso);
    const day = d.getUTCDay();
    const hour = d.getUTCHours();
    grid[day]![hour]! += 1;
  }
  const max = Math.max(1, ...grid.flat());
  return { grid, max };
}