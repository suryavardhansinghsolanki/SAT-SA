import { createFileRoute, Link } from "@tanstack/react-router";
import { RiskChip } from "@/components/sat/risk-chip";
import { useSatStore } from "@/lib/sat/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: CommandBrief });

// Band → status label
const BAND_LABEL: Record<string, string> = {
  immediate: "Immediate",
  concern: "Concern",
  watch: "Elevated Watch",
  tolerance: "Within Tolerance",
  exemplar: "Exemplar",
};

function bandDotClass(band: string) {
  switch (band) {
    case "immediate": return "bg-risk";
    case "concern": return "bg-concern";
    case "watch": return "bg-watch";
    case "tolerance": return "bg-ok";
    default: return "bg-muted";
  }
}

function bandLabelClass(band: string) {
  switch (band) {
    case "immediate": return "text-risk";
    case "concern": return "text-concern";
    case "watch": return "text-watch";
    case "tolerance": return "text-ok";
    default: return "text-muted";
  }
}

function CommandBrief() {
  const { dataset, assessment } = useSatStore();
  const { national } = assessment;
  const ranked = [...assessment.entities].sort((a, b) => a.sri - b.sri);

  const maxSignal = Math.max(national.executionGaps, national.negativeSpace, national.anomalies || 1, 1);

  const sriColor =
    national.meanSri < 55 ? "text-risk" :
    national.meanSri < 70 ? "text-concern" : "text-ok";

  return (
    <div className="flex flex-col h-full p-6 gap-4 bg-bg min-h-0">

      {/* ── Header bar ───────────────────────────────────── */}
      <div className="flex items-center justify-between rounded-sm bg-surface border border-hairline px-5 py-3 shrink-0">
        <div>
          <div className="text-[14px] font-semibold text-fg">SAT-SA - Audit the Evidence, Not the Metrics</div>
          <div className="text-[12px] text-muted mt-0.5">
            Cycle {dataset.cycle} - {dataset.windowStart.slice(0,10)} to {dataset.windowEnd.slice(0,10)} - Evidence Integrity: Cryptographically Sealed
          </div>
        </div>
        <div className="flex items-center gap-2 text-[12px] font-medium text-ok">
          <span className="size-2 rounded-full bg-ok" />
          OFFLINE RUNTIME</div><div className="text-[10px] text-muted font-mono uppercase tracking-widest mt-1">Team CyberWolves</div>
      </div>

      {/* ── 4 KPI cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {[
          { label: "Critical Sector Entities", value: national.entityCount, color: "text-fg" },
          { label: "Immediate Review",          value: national.immediateCount, color: national.immediateCount > 0 ? "text-risk" : "text-fg" },
          { label: "Supervisory Findings",      value: national.findingCount,   color: "text-fg" },
          { label: "Mean Strategic Risk",       value: national.meanSri,        color: sriColor },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-sm bg-surface border border-hairline px-5 py-4">
            <div className="text-[12px] text-muted font-medium mb-2">{kpi.label}</div>
            <div className={cn("text-3xl font-semibold tabular leading-none", kpi.color)}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Two-column bottom ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 flex-1 min-h-0">

        {/* Priority Review Queue */}
        <div className="rounded-sm bg-surface border border-hairline flex flex-col overflow-hidden">
          <div className="px-5 py-3 border-b border-hairline flex items-center justify-between shrink-0">
            <div className="font-semibold text-[13px] uppercase tracking-wider text-fg">Priority Review Queue</div>
            <Link to="/entities" className="text-[12px] text-accent hover:underline">
              View all →
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            {ranked.slice(0, 8).map((e, i) => {
              const ent = dataset.entities.find((x) => x.id === e.entityId)!;
              return (
                <Link
                  key={e.entityId}
                  to="/entity/$id"
                  params={{ id: e.entityId }}
                  className="flex items-center gap-4 px-5 py-3 border-b border-hairline last:border-0 hover:bg-elevated/60 transition-colors group"
                >
                  {/* Dot */}
                  <span className={cn("size-2 rounded-full shrink-0", bandDotClass(e.band))} />

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-fg group-hover:text-accent transition-colors truncate">
                      {ent?.shortName}
                    </div>
                    <div className="text-[11px] text-muted truncate">{ent?.sector}</div>
                  </div>

                  {/* Status */}
                  <div className={cn("text-[11px] font-medium shrink-0", bandLabelClass(e.band))}>
                    {BAND_LABEL[e.band] ?? e.band}
                  </div>

                  {/* SRI */}
                  <div className="w-14 text-right shrink-0">
                    <span className="text-[11px] font-medium text-muted tabular">SRI </span>
                    <span className="text-[13px] font-bold text-fg tabular">{e.sri}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Supervisory Signals */}
        <div className="rounded-sm bg-surface border border-hairline flex flex-col">
          <div className="px-5 py-3 border-b border-hairline shrink-0">
            <div className="font-semibold text-[13px] uppercase tracking-wider text-fg">Supervisory Signals</div>
          </div>
          <div className="flex-1 px-5 py-4 flex flex-col gap-5">
            {/* Execution Gaps */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-medium text-fg">Execution Gaps</span>
                <span className="text-[13px] font-bold text-concern tabular">{national.executionGaps}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-inset overflow-hidden border border-hairline">
                <div
                  className="h-full bg-concern transition-all duration-500"
                  style={{ width: `${(national.executionGaps / maxSignal) * 100}%` }}
                />
              </div>
            </div>

            {/* Negative Space */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-medium text-fg">Negative Space</span>
                <span className="text-[13px] font-bold text-risk tabular">{national.negativeSpace}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-inset overflow-hidden border border-hairline">
                <div
                  className="h-full bg-risk transition-all duration-500"
                  style={{ width: `${(national.negativeSpace / maxSignal) * 100}%` }}
                />
              </div>
            </div>

            {/* Operational Anomalies */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-medium text-fg">Operational Anomalies</span>
                <span className="text-[13px] font-bold text-accent tabular">{national.anomalies || 0}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-inset overflow-hidden border border-hairline">
                <div
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${((national.anomalies || 0) / maxSignal) * 100}%` }}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-hairline pt-4 mt-auto">
              <Link
                to="/review"
                className="block w-full rounded-sm bg-elevated border border-border text-center py-2 text-[12px] font-semibold text-fg hover:bg-elevated/80 transition-colors"
              >
                Open Review Queue
              </Link>
            </div>

            {/* Posture tags */}
            <div className="flex items-center justify-center gap-3 text-[10px] text-faint font-mono uppercase tracking-widest">
              <span>No AI</span>
              <span>·</span>
              <span>Air-Gapped</span>
              <span>·</span>
              <span>Deterministic</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




