import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CapabilityBars } from "@/components/sat/capability-bars";
import { RadarCard } from "@/components/sat/radar-card";
import { RiskChip } from "@/components/sat/risk-chip";
import { useSatStore } from "@/lib/sat/store";
import { formatPct } from "@/lib/utils";

type Search = { a?: string; b?: string };

export const Route = createFileRoute("/compare")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    a: typeof s.a === "string" ? s.a : undefined,
    b: typeof s.b === "string" ? s.b : undefined,
  }),
  component: ComparePage,
});

function ComparePage() {
  const { a: qa, b: qb } = Route.useSearch();
  const { dataset, assessment } = useSatStore();

  const defaults = useMemo(() => {
    const ranked = [...assessment.entities].sort((x, y) => x.sri - y.sri);
    return {
      a: qa ?? ranked[0]?.entityId ?? dataset.entities[0]?.id ?? "",
      b: qb ?? ranked[ranked.length - 1]?.entityId ?? dataset.entities[1]?.id ?? dataset.entities[0]?.id ?? "",
    };
  }, [assessment.entities, dataset.entities, qa, qb]);

  const [left, setLeft] = useState(defaults.a);
  const [right, setRight] = useState(defaults.b);

  const leftEntityId = dataset.entities.some((e) => e.id === left) ? left : (dataset.entities[0]?.id ?? "");
  const rightEntityId = dataset.entities.some((e) => e.id === right)
    ? right
    : (dataset.entities[1]?.id ?? dataset.entities[0]?.id ?? "");

  const A = assessment.entities.find((e) => e.entityId === leftEntityId) ?? assessment.entities[0];
  const B = assessment.entities.find((e) => e.entityId === rightEntityId) ?? assessment.entities[1] ?? assessment.entities[0];
  const eA = dataset.entities.find((e) => e.id === leftEntityId) ?? dataset.entities[0];
  const eB = dataset.entities.find((e) => e.id === rightEntityId) ?? dataset.entities[1] ?? dataset.entities[0];

  if (!A || !B || !eA || !eB) {
    return (
      <div className="p-8 text-muted">
        Insufficient entity data available for peer comparison. Ingest a dataset with at least two entities.
      </div>
    );
  }

  const colors = ["#d16456", "#c5cdd6"];

  const metricRows: { label: string; av: string; bv: string; hint?: string }[] = [
    { label: "Supervisory Risk Index (SRI)", av: String(A.sri), bv: String(B.sri), hint: "0-100 composite index" },
    {
      label: "Alerts Per 100 Assets",
      av: A.stats.alertsPer100Assets.toFixed(1),
      bv: B.stats.alertsPer100Assets.toFixed(1),
      hint: "Normalized volume rate",
    },
    {
      label: "Critical Escalation Rate",
      av: formatPct(A.stats.criticalEscalationPct),
      bv: formatPct(B.stats.criticalEscalationPct),
      hint: "Severity=Critical escalated",
    },
    {
      label: "P1 / High Severity Ratio",
      av: formatPct(A.stats.p1Ratio),
      bv: formatPct(B.stats.p1Ratio),
      hint: "High & critical share",
    },
    {
      label: "P1 Closed in < 15 Min",
      av: formatPct(A.stats.p1CloseUnder15Pct),
      bv: formatPct(B.stats.p1CloseUnder15Pct),
      hint: "Rapid closure without escalation",
    },
    {
      label: "Median Time-to-Close",
      av: `${Math.round(A.stats.medianCloseMin)}m`,
      bv: `${Math.round(B.stats.medianCloseMin)}m`,
      hint: "Median duration",
    },
    {
      label: "90th Percentile Close (P90)",
      av: `${Math.round(A.stats.closureP90Min)}m`,
      bv: `${Math.round(B.stats.closureP90Min)}m`,
      hint: "Tail investigation latency",
    },
    {
      label: "Template Investigation Ratio",
      av: formatPct(A.stats.templateNotePct),
      bv: formatPct(B.stats.templateNotePct),
      hint: "Canned language clusters",
    },
    {
      label: "Telemetry Asset Coverage",
      av: formatPct(A.stats.telemetryAssetCoveragePct),
      bv: formatPct(B.stats.telemetryAssetCoveragePct),
      hint: "Active assets / total assets",
    },
    {
      label: "Taxonomy Coverage",
      av: formatPct(A.stats.taxonomyCoveragePct),
      bv: formatPct(B.stats.taxonomyCoveragePct),
      hint: "Expected sector threat classes",
    },
    {
      label: "Weekend Monitoring Ratio",
      av: formatPct(A.stats.weekendVolumeRatio),
      bv: formatPct(B.stats.weekendVolumeRatio),
      hint: "Weekend / weekday pace",
    },
    {
      label: "Silent Critical Assets",
      av: `${A.stats.silentCriticalAssets} / ${A.stats.criticalAssets}`,
      bv: `${B.stats.silentCriticalAssets} / ${B.stats.criticalAssets}`,
      hint: "Zero alerts in window",
    },
    {
      label: "False-Positive / Benign Ratio",
      av: formatPct(A.stats.falsePositivePct),
      bv: formatPct(B.stats.falsePositivePct),
      hint: "Disposition distribution",
    },
  ];

  return (
    <div className="w-full px-4 py-4 sm:px-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="rounded-sm bg-indicator/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-indicator">
          Triangulated Analytics
        </span>
        <p className="text-[11px] uppercase tracking-[0.2em] text-subtle">Normalized Peer Benchmarking</p>
      </div>
      <h1 className="mt-1 text-2xl font-semibold text-fg tracking-tight">Context-Aware Peer Benchmarking</h1>
      <p className="mt-2 text-sm text-muted">
        Build peer cohorts using Sector, Entity Size, and Asset Profile for meaningful deviation analysis.
        Comparing an enterprise with 20,000 endpoints to a utility with 300 endpoints on absolute counts is invalid;
        rates and residuals expose the true supervisory posture.
      </p>

      {/* Cohort Definition Banner */}
      <div className="mt-6 rounded-sm bg-surface border border-hairline p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase text-subtle font-semibold tracking-wider">Active Cohort Alignment</div>
          <div className="text-sm font-medium text-fg mt-1">
            Sector: <span className="text-accent">{eA.sector}</span> 
            <span className="mx-2 text-border">|</span>
            Asset Profile: <span className="text-accent">{eA.criticality}</span> 
            <span className="mx-2 text-border">|</span>
            Baseline Size: <span className="text-accent">{eA.workforce.toLocaleString()} staff</span>
          </div>
        </div>
        <div className="text-[11px] text-muted">
          Cohorts standardize alert velocity and resolution cadence.
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <select
          value={leftEntityId}
          onChange={(e) => setLeft(e.target.value)}
          className="h-11 rounded-sm border border-border bg-inset px-3 text-sm text-fg"
        >
          {dataset.entities.map((e) => (
            <option key={e.id} value={e.id}>
              {e.shortName} · {e.sector}
            </option>
          ))}
        </select>
        <select
          value={rightEntityId}
          onChange={(e) => setRight(e.target.value)}
          className="h-11 rounded-sm border border-border bg-inset px-3 text-sm text-fg"
        >
          {dataset.entities.map((e) => (
            <option key={e.id} value={e.id}>
              {e.shortName} · {e.sector}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {[
          { e: eA, a: A, c: colors[0] },
          { e: eB, a: B, c: colors[1] },
        ].map((x) => (
          <section key={x.e.id} className="rounded-sm bg-surface p-5 shadow-[var(--shadow-border)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-fg tracking-tight">{x.e.shortName}</h2>
              <RiskChip band={x.a.band} />
            </div>
            <p className="text-xs text-muted">
              {x.e.sector} · Claimed {x.e.declaredMaturity} · SRI: {x.a.sri}
            </p>
            <div className="mt-4">
              <CapabilityBars scores={x.a.capabilities} />
            </div>
          </section>
        ))}
      </div>

      <section className="mt-6 rounded-sm bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="text-lg font-semibold text-fg tracking-tight">Supervisory Dimension Overlay</h2>
        <RadarCard
          series={[
            { name: eA.shortName, scores: A.capabilities, color: colors[0] },
            { name: eB.shortName, scores: B.capabilities, color: colors[1] },
          ]}
        />
      </section>

      <section className="mt-6 rounded-sm bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="text-lg font-semibold text-fg tracking-tight">Normalized Operational Rates</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-hairline text-[11px] uppercase tracking-wider text-subtle font-mono">
              <tr>
                <th className="py-2.5 pr-4 font-medium">Metric Dimension</th>
                <th className="py-2.5 pr-4 font-medium">{eA.shortName}</th>
                <th className="py-2.5 pr-4 font-medium">{eB.shortName}</th>
                <th className="py-2.5 font-medium text-subtle">Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline font-mono text-xs">
              {metricRows.map((r) => (
                <tr key={r.label} className="hover:bg-elevated/40">
                  <td className="py-3 pr-4 font-sans font-medium text-fg">{r.label}</td>
                  <td className="py-3 pr-4 font-semibold text-accent">{r.av}</td>
                  <td className="py-3 pr-4 font-semibold text-fg">{r.bv}</td>
                  <td className="py-3 text-subtle font-sans text-[11px]">{r.hint}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


