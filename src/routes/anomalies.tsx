import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  Clock,
  FileSearch,
  Filter,
  Layers,
  ShieldAlert,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { AlertDrawer } from "@/components/sat/alert-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { runLocalAnomalyDetection, type AnomalyFinding } from "@/lib/sat/anomaly";
import { useSatStore } from "@/lib/sat/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/anomalies")({
  component: AnomaliesPage,
});

function AnomaliesPage() {
  const { dataset } = useSatStore();
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("all");
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);

  // Compute anomaly report deterministically from dataset
  const anomalyReport = useMemo(() => {
    return runLocalAnomalyDetection(dataset);
  }, [dataset]);

  const filteredAnomalies = useMemo(() => {
    return anomalyReport.allAnomalies.filter((a) => {
      const matchModel =
        modelFilter === "all" ||
        (modelFilter === "velocity" && a.anomalyType === "triage_velocity") ||
        (modelFilter === "entropy" && a.anomalyType === "note_entropy") ||
        (modelFilter === "diurnal" && a.anomalyType === "diurnal_collapse");
      const matchEntity = selectedEntityId === "all" || a.entityId === selectedEntityId;
      return matchModel && matchEntity;
    });
  }, [anomalyReport.allAnomalies, modelFilter, selectedEntityId]);

  const velocityCount = anomalyReport.allAnomalies.filter((a) => a.anomalyType === "triage_velocity").length;
  const entropyCount = anomalyReport.allAnomalies.filter((a) => a.anomalyType === "note_entropy").length;
  const diurnalCount = anomalyReport.allAnomalies.filter((a) => a.anomalyType === "diurnal_collapse").length;

  return (
    <div className="w-full px-4 py-4 sm:px-6">
      {/* Government Classification Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-accent/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-accent">
              Phase 3 Enhancement
            </span>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-subtle">
              RESTRICTED // NCIIPC SUPERVISORY ASSURANCE
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-fg tracking-tight">Local Anomaly Detection & Statistical ML</h1>
          <p className="mt-2 w-full text-sm leading-relaxed text-muted">
            Deterministic mathematical anomaly detection operating 100% locally. Zero cloud, zero external API, zero telemetry,
            zero black-box models. Isolates superhuman triage velocity fences, repetitive linguistic entropy collapse, and diurnal
            workload drop-offs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="ok" className="px-3 py-1 font-mono text-xs">
            100% Deterministic / Air-Gapped
          </Badge>
        </div>
      </div>

      {/* Metric Tiles */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-sm border border-hairline bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-subtle">Total Outliers</span>
            <Activity className="size-4 text-accent" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-fg">{anomalyReport.totalAnomaliesDetected}</div>
          <div className="mt-1 text-xs text-muted">Active mathematical flags</div>
        </div>

        <div className="rounded-sm border border-hairline bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-subtle">Triage Velocity Fences</span>
            <Clock className="size-4 text-risk" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-risk">{velocityCount}</div>
          <div className="mt-1 text-xs text-muted">Tukey IQR sub-fence closures</div>
        </div>

        <div className="rounded-sm border border-hairline bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-subtle">Linguistic Collapse</span>
            <Layers className="size-4 text-warn" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-warn">{entropyCount}</div>
          <div className="mt-1 text-xs text-muted">Shannon entropy &lt; 2.50 bits</div>
        </div>

        <div className="rounded-sm border border-hairline bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-subtle">Diurnal Collapses</span>
            <TrendingDown className="size-4 text-accent" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-accent">{diurnalCount}</div>
          <div className="mt-1 text-xs text-muted">Poisson weekend drop-offs</div>
        </div>
      </div>

      {/* Model Filters & Entity Select */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "All Algorithms", count: anomalyReport.totalAnomaliesDetected },
            { id: "velocity", label: "Triage Velocity (IQR)", count: velocityCount },
            { id: "entropy", label: "Shannon Note Entropy", count: entropyCount },
            { id: "diurnal", label: "Diurnal Poisson Distribution", count: diurnalCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setModelFilter(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                modelFilter === tab.id
                  ? "bg-accent text-accent-fg"
                  : "bg-surface text-muted hover:bg-elevated hover:text-fg"
              )}
            >
              <span>{tab.label}</span>
              <span className="rounded-full bg-bg/60 px-1.5 py-0.2 font-mono text-[10px]">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Filter Entity:</span>
          <select
            value={selectedEntityId}
            onChange={(e) => setSelectedEntityId(e.target.value)}
            className="h-8 rounded border border-hairline bg-surface px-2.5 font-mono text-xs text-fg focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="all">All Critical Sector Entities</option>
            {dataset.entities.map((e) => (
              <option key={e.id} value={e.id}>
                {e.shortName} ({e.sector})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Anomaly Cards List */}
      <div className="mt-6 space-y-4">
        {filteredAnomalies.length > 0 ? (
          filteredAnomalies.map((a) => {
            const ent = dataset.entities.find((e) => e.id === a.entityId);
            return (
              <div
                key={a.id}
                className="rounded-sm border border-hairline bg-surface p-5 shadow-[var(--shadow-border)] sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-accent">{a.modelName}</span>
                      <span className="rounded bg-inset px-2 py-0.5 font-mono text-[10px] text-subtle">
                        {a.modelVersion}
                      </span>
                      <Badge
                        tone={
                          a.severity === "critical"
                            ? "risk"
                            : a.severity === "high"
                            ? "warn"
                            : "ok"
                        }
                      >
                        {a.severity.toUpperCase()}
                      </Badge>
                      <span className="rounded bg-ok/10 px-2 py-0.5 font-mono text-[11px] font-medium text-ok">
                        Confidence: {a.confidencePct}%
                      </span>
                      {ent ? (
                        <Link
                          to="/entity/$id"
                          params={{ id: ent.id }}
                          className="text-xs font-medium text-muted hover:text-accent hover:underline"
                        >
                          {ent.name} ({ent.sector})
                        </Link>
                      ) : null}
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-fg tracking-tight text-fg">{a.headline}</h3>
                  </div>

                  <div className="rounded-sm bg-inset px-3 py-1.5 text-right font-mono text-xs">
                    <div className="text-[10px] uppercase tracking-wider text-subtle">Deviation Metric</div>
                    <div className="font-bold text-accent">{a.zScoreOrResidual} σ / residual</div>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-muted">{a.explanation}</p>

                {/* Mathematical Explainability Grid */}
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-sm bg-inset p-3">
                    <div className="text-[10px] uppercase tracking-wider text-subtle">Mathematical Formulation</div>
                    <div className="mt-1 font-mono text-xs text-muted">{a.formula}</div>
                  </div>
                  <div className="rounded-sm bg-inset p-3">
                    <div className="text-[10px] uppercase tracking-wider text-subtle">Statistical Threshold</div>
                    <div className="mt-1 font-mono text-xs text-fg">{a.threshold}</div>
                  </div>
                  <div className="rounded-sm bg-inset p-3">
                    <div className="text-[10px] uppercase tracking-wider text-subtle">Observed Parameter</div>
                    <div className="mt-1 font-mono text-xs font-semibold text-warn">{a.observedValue}</div>
                  </div>
                </div>

                {/* Action & Evidence Controls */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
                  <div className="text-xs text-muted">
                    <span className="font-medium text-fg">Supervisory Directive: </span>
                    {a.supervisoryAction}
                  </div>
                  <div className="flex items-center gap-2">
                    {a.affectedAlertIds.length > 0 ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveAlertId(a.affectedAlertIds[0]!)}
                        className="gap-1.5 text-xs"
                      >
                        <FileSearch className="size-3.5" />
                        Drill Into Evidence ({a.affectedCount} Alerts)
                      </Button>
                    ) : null}
                    <Button size="sm" asChild>
                      <Link to="/findings" search={{ id: a.id }}>
                        Open in Findings
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-sm border border-hairline bg-surface p-12 text-center">
            <BrainCircuit className="mx-auto size-8 text-subtle" />
            <p className="mt-3 text-sm font-medium text-fg">No statistical outliers detected</p>
            <p className="mt-1 text-xs text-muted">
              Current operational dataset falls within expected statistical fences.
            </p>
          </div>
        )}
      </div>

      {/* Sector Baseline Comparison Card */}
      <section className="mt-10 rounded-sm border border-hairline bg-surface p-6 shadow-[var(--shadow-border)]">
        <h2 className="text-lg font-semibold text-fg tracking-tight">Sector Operational Baselines</h2>
        <p className="mt-1 text-xs text-muted">
          Deterministic reference distribution parameters computed across each Critical Information Infrastructure sector.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(anomalyReport.sectorBaselines).map(([sector, base]) => (
            <div key={sector} className="rounded-sm bg-inset p-4">
              <div className="text-xs font-semibold text-fg">{sector}</div>
              <div className="mt-3 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-muted">
                  <span>Median Triage:</span>
                  <span className="text-fg">{base.meanTriageMinutes} min</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>IQR Spread:</span>
                  <span className="text-fg">±{base.iqrTriageMinutes} min</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Mean Note Entropy:</span>
                  <span className="text-fg">{base.meanEntropy} bits</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Alerts / Asset:</span>
                  <span className="text-fg">{base.meanAlertsPerAsset}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Alert Drawer Drill-down */}
      <AlertDrawer alertId={activeAlertId} onClose={() => setActiveAlertId(null)} />
    </div>
  );
}


