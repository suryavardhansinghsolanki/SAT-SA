import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertDrawer } from "@/components/sat/alert-drawer";
import { familyLabel } from "@/lib/sat/engine";
import { SevChip } from "@/components/sat/risk-chip";
import { useSatStore } from "@/lib/sat/store";
import { formatDateTime } from "@/lib/utils";
import type { ExaminerNote } from "@/lib/sat/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/review")({ component: ReviewPage });

const STANCES: { id: ExaminerNote["stance"]; label: string; activeClass: string; idleClass: string }[] = [
  {
    id: "corroborates",
    label: "Corroborates",
    activeClass: "bg-[#059669] text-white border-[#059669] pointer-events-none shadow-sm",
    idleClass: "bg-[#064e3b]/50 border-[#059669]/30 text-[#10b981] hover:bg-[#064e3b]",
  },
  {
    id: "needs-more",
    label: "Needs Evidence",
    activeClass: "bg-[#d97706] text-white border-[#d97706] pointer-events-none shadow-sm",
    idleClass: "bg-[#78350f]/50 border-[#d97706]/30 text-[#f59e0b] hover:bg-[#78350f]",
  },
  {
    id: "does-not-corroborate",
    label: "Does Not Corroborate",
    activeClass: "bg-[#dc2626] text-white border-[#dc2626] pointer-events-none shadow-sm",
    idleClass: "bg-[#7f1d1d]/50 border-[#dc2626]/30 text-[#ef4444] hover:bg-[#7f1d1d]",
  },
];

function ReviewPage() {
  const { dataset, assessment, reviewDone, markReview } = useSatStore();
  const [alertId, setAlertId] = useState<string | null>(null);
  const done = Object.keys(reviewDone).length;
  const total = assessment.reviewQueue.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 shrink-0 w-full">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-fg">Review Queue</h1>
            <p className="text-[14px] text-muted mt-1.5">
              SAT-SA proposes; the examiner decides. Human judgement is final.
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[12px] text-muted mb-2 font-mono">
              {done} / {total} stances recorded
            </div>
            <div className="w-48 h-1.5 bg-inset rounded-full overflow-hidden">
              <div className="h-full bg-ok rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Card list */}
      <div className="flex-1 overflow-y-auto px-6 pb-12">
        <div className="space-y-6 w-full">
          {assessment.reviewQueue.map((item) => {
            const finding = assessment.findings.find((f) => f.id === item.findingId);
            const entity = dataset.entities.find((e) => e.id === item.entityId);
            if (!finding || !entity) return null;

            const alerts = item.alertIds
              .map((id) => dataset.alerts.find((a) => a.id === id))
              .filter(Boolean);
            const stance = reviewDone[item.id];
            const isNegSpace = finding.family === "negative-space";

            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-sm bg-surface border border-border overflow-hidden p-6 flex flex-col gap-4 shadow-card",
                  stance && "border-border",
                )}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[15px] font-semibold text-fg">
                      {item.id} - {entity.name}
                    </div>
                    <div className="text-[13px] text-indicator font-medium mt-0.5">
                      {finding.detectorId} - {finding.title}
                    </div>
                  </div>
                  <div className={cn(
                    "rounded px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    finding.severity === "critical" ? "bg-risk-dim text-risk border border-risk/20" :
                    finding.severity === "high" ? "bg-concern-dim text-concern border border-concern/20" :
                    "bg-watch-dim text-watch border border-watch/20"
                  )}>
                    {finding.severity}
                  </div>
                </div>

                {/* Priority & Flagging Rationale (From Slide) */}
                <div className="rounded-sm bg-inset border border-hairline p-3 grid gap-2 sm:grid-cols-2">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider font-semibold text-subtle mb-0.5">Why Flagged?</div>
                    <div className="text-xs text-muted">{finding.detectorName}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider font-semibold text-subtle mb-0.5">Why this priority?</div>
                    <div className="text-xs text-muted">
                      {finding.severity === "critical" 
                        ? `Highest priority due to severe deviation in ${finding.family} matching.`
                        : `Standard review priority based on SRI impact.`}
                    </div>
                  </div>
                </div>

                {/* Evidence / No Alerts */}
                <div>
                  {isNegSpace || alerts.length === 0 ? (
                    <div className="inline-flex items-center rounded-sm bg-risk-dim border border-risk/30 px-3 py-1.5 mt-1">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-risk">No Supporting Alerts Found (Negative Space)</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 mt-1">
                      {alerts.slice(0, 3).map((a) =>
                        a ? (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => setAlertId(a.id)}
                            className="w-full rounded-sm bg-elevated border border-border px-4 py-2 flex items-center justify-between text-left hover:bg-elevated/80 transition-colors"
                          >
                            <div>
                              <span className="font-mono text-[11px] font-semibold text-accent">{a.id}</span>
                              <span className="text-muted text-[11px] ml-3">{a.category}</span>
                            </div>
                            <SevChip sev={a.severity} />
                          </button>
                        ) : null,
                      )}
                    </div>
                  )}
                </div>

                {/* Objective */}
                <div className="text-[12px] text-muted">
                  <span className="font-medium text-fg">Objective: </span>
                  {item.expectedQuestion}
                </div>

                {/* Verdict buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
                  {STANCES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => markReview(item.id, s.id)}
                      className={cn(
                        "rounded-sm border py-2 text-[12px] font-medium transition-all duration-200",
                        stance === s.id ? s.activeClass : s.idleClass,
                      )}
                    >
                      {stance === s.id && "✓ "}
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Quick links & Stance Indicator */}
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex gap-4">
                    <Link
                      to="/findings"
                      search={{ id: finding.id }}
                      className="text-[12px] text-accent hover:underline"
                    >
                      Full rationale →
                    </Link>
                    <Link
                      to="/entity/$id"
                      params={{ id: entity.id }}
                      className="text-[12px] text-accent hover:underline"
                    >
                      Entity dossier →
                    </Link>
                  </div>
                  {stance && (
                    <div className={cn(
                      "text-[10px] font-mono uppercase tracking-[0.15em] mt-1.5",
                      stance === "corroborates" ? "text-ok" :
                      stance === "does-not-corroborate" ? "text-risk" : "text-concern",
                    )}>
                      Stance: {stance.replace(/-/g, " ")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AlertDrawer alertId={alertId} onClose={() => setAlertId(null)} />
    </div>
  );
}





