import { createFileRoute, Link } from "@tanstack/react-router";
import { HeatGrid } from "@/components/sat/heat-grid";
import { RiskChip } from "@/components/sat/risk-chip";
import { StatTile } from "@/components/sat/stat-tile";
import { WeekChart } from "@/components/sat/week-chart";
import { useSatStore } from "@/lib/sat/store";
import { entityWeekly, nationalWeekly } from "@/lib/sat/trends";
import { formatPct } from "@/lib/utils";

export const Route = createFileRoute("/trends")({ component: TrendsPage });

function TrendsPage() {
  const { dataset, assessment } = useSatStore();
  const national = nationalWeekly(dataset);
  const theatre = [...assessment.entities].sort((a, b) => b.metricTheatre - a.metricTheatre).slice(0, 5);
  const worst = [...assessment.entities].sort((a, b) => a.sri - b.sri).slice(0, 4);

  return (
    <div className="w-full px-4 py-4 sm:px-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-subtle">Temporal analysis</p>
      <h1 className="mt-2 text-2xl font-semibold text-fg tracking-tight">Ninety days, not a snapshot</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Execution gaps and negative space are often visible only in time: weekend collapse, shift-end dumps, volume that
        never recovers. SAT-SA reads the window as a series, then ranks entities by residual risk and metric theatre.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="National mean SRI" value={assessment.national.meanSri} />
        <StatTile
          label="Metric theatre"
          value={assessment.national.meanMetricTheatre}
          hint="KPI-paced operations"
          tone={assessment.national.meanMetricTheatre > 35 ? "warn" : "default"}
        />
        <StatTile label="Alerts in window" value={assessment.national.alertCount} />
        <StatTile label="Findings" value={assessment.national.findingCount} />
      </div>

      <section className="mt-8 rounded-sm bg-surface p-5 shadow-[var(--shadow-border)] sm:p-6">
        <h2 className="text-lg font-semibold text-fg tracking-tight">National weekly volume</h2>
        <p className="mt-1 text-xs text-muted">High/critical overlaid on all alerts. Quiet weeks on a critical estate are a signal.</p>
        <WeekChart points={national} />
      </section>

      <section className="mt-8 rounded-sm bg-surface p-5 shadow-[var(--shadow-border)] sm:p-6">
        <h2 className="text-lg font-semibold text-fg tracking-tight">When work actually happens</h2>
        <p className="mt-1 text-xs text-muted">UTC hour × weekday of alert creation. A healthy 24×7 SOC does not go dark on Saturday or dump at 17:45.</p>
        <div className="mt-4">
          <HeatGrid timestamps={dataset.alerts.map((a) => a.ts)} caption="All entities, alert-open timestamps." />
        </div>
        <div className="mt-6">
          <HeatGrid
            timestamps={dataset.alerts.filter((a) => a.closedAt).map((a) => a.closedAt!)}
            caption="All entities, closure timestamps — look for the 17:30–18:05 band."
          />
        </div>
      </section>

      <section className="mt-8 rounded-sm bg-surface p-5 shadow-[var(--shadow-border)] sm:p-6">
        <h2 className="text-lg font-semibold text-fg tracking-tight">KPI theatre</h2>
        <p className="mt-1 text-xs text-muted">
          Composite of SLA-cliff closures, shift-end dumps, template notes and sub-15-minute P1 closes. High scores mean
          the SOC is performing the metric, not the control.
        </p>
        <ul className="mt-4 divide-y divide-hairline">
          {theatre.map((e) => {
            const ent = dataset.entities.find((x) => x.id === e.entityId)!;
            return (
              <li key={e.entityId}>
                <Link
                  to="/entity/$id"
                  params={{ id: e.entityId }}
                  className="flex items-center gap-3 py-3 hover:bg-elevated/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{ent.shortName}</div>
                    <div className="text-xs text-muted">
                      {ent.sector} · SLA-met claimed {formatPct(ent.declaredKpis.slaMetPct)}
                    </div>
                  </div>
                  <RiskChip band={e.band} />
                  <div className="w-10 text-right font-mono text-sm tabular">{e.metricTheatre}</div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-fg tracking-tight">Priority entities, weekly</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {worst.map((e) => {
            const ent = dataset.entities.find((x) => x.id === e.entityId)!;
            return (
              <div key={e.entityId} className="rounded-sm bg-surface p-5 shadow-[var(--shadow-border)]">
                <div className="flex items-center justify-between gap-2">
                  <Link to="/entity/$id" params={{ id: e.entityId }} className="font-medium hover:underline">
                    {ent.shortName}
                  </Link>
                  <span className="font-mono text-xs tabular text-subtle">SRI {e.sri}</span>
                </div>
                <WeekChart points={entityWeekly(dataset, e.entityId)} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}


