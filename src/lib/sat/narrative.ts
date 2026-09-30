import { bandLabel } from "./engine.ts";
import type { Entity, EntityAssessment, Finding } from "./types.ts";

export function entityNarrative(
  entity: Entity,
  assessment: EntityAssessment,
  findings: Finding[],
): { headline: string; paragraphs: string[] } {
  const top = [...findings].sort((a, b) => b.informationGain - a.informationGain).slice(0, 3);
  const headline = `${entity.shortName} presents as ${entity.declaredMaturity} (${entity.socModel}). Operational evidence in this cycle does not fully support that claim.`;
  const gapLine =
    top.length === 0
      ? "No detector fired. That itself is a supervisory question if peers in the same sector are noisy."
      : top.map((f) => `${f.detectorId} — ${f.title.toLowerCase()}`).join("; ") + ".";
  const kpi = assessment.kpiContradiction.find((k) => k.gap && !k.gap.includes("consistent") && !k.gap.includes("closer"));
  const p1 = `Supervisory Risk Index ${assessment.sri} (${bandLabel(assessment.band)}). ${assessment.executionGapCount} execution-gap, ${assessment.negativeSpaceCount} negative-space and ${assessment.anomalyCount} anomaly findings. Metric-theatre index ${assessment.metricTheatre} — the degree to which operations appear paced to reported KPIs rather than residual risk.`;
  const p2 = `Lead signals: ${gapLine}`;
  const p3 = kpi
    ? `Claim versus evidence: ${kpi.claimed} is reported; observed ${kpi.observed}. ${kpi.gap}`
    : `Claimed coverage ${(entity.declaredKpis.coveragePct * 100).toFixed(0)}% sits against ${assessment.stats.silentCriticalAssets} silent critical assets and taxonomy ${(assessment.stats.taxonomyCoveragePct * 100).toFixed(0)}%.`;
  return { headline, paragraphs: [p1, p2, p3] };
}