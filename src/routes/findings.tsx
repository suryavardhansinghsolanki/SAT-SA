import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertDrawer } from "@/components/sat/alert-drawer";
import { familyTone, SevChip } from "@/components/sat/risk-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { familyLabel } from "@/lib/sat/engine";
import type { FindingFamily, Severity } from "@/lib/sat/types";
import { useSatStore } from "@/lib/sat/store";
import { cn } from "@/lib/utils";

type Search = { id?: string; family?: FindingFamily };

export const Route = createFileRoute("/findings")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    id: typeof s.id === "string" ? s.id : undefined,
    family:
      s.family === "execution-gap" || s.family === "negative-space" || s.family === "anomaly"
        ? s.family
        : undefined,
  }),
  component: FindingsPage,
});

function FindingsPage() {
  const { id, family: familyQ } = Route.useSearch();
  const { dataset, assessment, addNote, notes } = useSatStore();
  const [family, setFamily] = useState<FindingFamily | "all">(familyQ ?? "all");
  const [alertId, setAlertId] = useState<string | null>(null);
  const [noteBody, setNoteBody] = useState("");

  const list = useMemo(() => {
    return [...assessment.findings]
      .sort((a, b) => b.informationGain - a.informationGain)
      .filter((f) => (family === "all" ? true : f.family === family));
  }, [assessment.findings, family]);

  const selected = assessment.findings.find((f) => f.id === id) ?? assessment.findings[0];
  const active = list.find((f) => f.id === selected?.id) ?? list[0];
  const entity = dataset.entities.find((e) => e.id === active?.entityId);

  const FAMILIES: Array<FindingFamily | "all"> = ["all", "execution-gap", "negative-space", "anomaly"];

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden bg-bg">

      {/* ── LEFT: Detector list ──────────────────────────── */}
      <div className="w-full md:w-72 h-[40vh] md:h-full shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-hairline bg-surface overflow-hidden">
        {/* Filter tabs */}
        <div className="px-4 pt-4 pb-3 border-b border-hairline shrink-0">
          <div className="text-[13px] font-semibold text-fg mb-3">Detectors</div>
          <div className="flex flex-wrap gap-1.5">
            {FAMILIES.map((f) => (
              <button
                key={f}
                onClick={() => setFamily(f)}
                className={cn(
                  "px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-sm border transition-colors",
                  family === f
                    ? "bg-elevated border-border text-fg"
                    : "border-hairline text-subtle hover:text-fg hover:border-border",
                )}
              >
                {f === "all" ? "All" : familyLabel(f)}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-2">
          {list.map((f) => {
            const isActive = f.id === active?.id;
            const ent = dataset.entities.find((e) => e.id === f.entityId);
            return (
              <Link
                key={f.id}
                to="/findings"
                search={{ id: f.id }}
                className={cn(
                  "flex flex-col mx-2 my-0.5 px-3 py-2.5 rounded-sm transition-colors border-l-2",
                  isActive
                    ? "bg-elevated border-indicator text-fg"
                    : "border-transparent text-muted hover:bg-elevated/50 hover:text-fg",
                )}
              >
                <div className={cn("font-mono text-[10px] font-semibold", isActive ? "text-indicator" : "text-subtle")}>
                  {f.detectorId}
                </div>
                <div className="text-[12px] font-medium leading-snug mt-0.5">
                  {f.title}
                </div>
                <div className="text-[11px] text-muted mt-0.5">
                  {ent?.shortName}
                </div>
              </Link>
            );
          })}
          {list.length === 0 && (
            <div className="px-4 py-4 text-[12px] text-muted text-center">No findings match filter.</div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Finding detail ────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-bg">
        {!active ? (
          <div className="flex h-full items-center justify-center text-muted text-[13px]">
            Select a finding from the list.
          </div>
        ) : (
          <div className="w-full px-6 py-4 space-y-6">

            {/* Title row */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="font-mono text-[11px] bg-surface border border-border px-2 py-0.5 rounded text-muted">
                  {active.detectorId} v{active.detectorVersion}
                </span>
                <span className="text-[11px] text-subtle">Deterministic Rule</span>
                <SevChip sev={active.severity} />
                <span className="ml-auto font-mono text-[11px] text-muted">
                  Confidence {Math.round(active.confidence * 100)}%
                </span>
              </div>
              <h2 className="text-[18px] font-semibold text-fg leading-snug">
                {active.detectorId} · {active.title}
              </h2>
              {entity && (
                <Link
                  to="/entity/$id"
                  params={{ id: entity.id }}
                  className="mt-1.5 inline-block text-[12px] text-accent hover:underline"
                >
                  {entity.name} — {entity.sector}
                </Link>
              )}
            </div>

            {/* Formula / Threshold / Observed — labeled boxes */}
            <div className="space-y-3">
              <div className="rounded-sm bg-surface border border-hairline px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle mb-1.5">Formula</div>
                <div className="font-mono text-[12px] text-fg">{active.formula}</div>
              </div>
              <div className="rounded-sm bg-surface border border-hairline px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle mb-1.5">Threshold</div>
                <div className="font-mono text-[12px] text-fg">{active.threshold}</div>
              </div>
              <div className="rounded-sm bg-surface border border-hairline px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle mb-1.5">Observed</div>
                <div className={cn(
                  "font-mono text-[13px] font-semibold",
                  active.severity === "critical" || active.severity === "high" ? "text-risk" : "text-concern",
                )}>
                  {active.observed}
                </div>
              </div>
              {active.peerContext && (
                <div className="rounded-sm bg-surface border border-hairline px-4 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle mb-1.5">Peer Context</div>
                  <div className="text-[12px] text-muted">{active.peerContext}</div>
                </div>
              )}
            </div>

            {/* Supporting evidence */}
            <div>
              <div className="text-[12px] font-semibold text-fg mb-3">Supporting Evidence</div>
              <div className="space-y-2">
                {active.evidence.map((ev, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => ev.alertId ? setAlertId(ev.alertId) : undefined}
                    className={cn(
                      "w-full rounded-sm bg-surface border border-hairline px-4 py-3 flex items-center justify-between text-left transition-colors",
                      ev.alertId ? "hover:bg-elevated cursor-pointer" : "cursor-default",
                    )}
                  >
                    <div>
                      {ev.alertId && (
                        <div className="font-mono text-[11px] font-semibold text-accent mb-0.5">{ev.alertId}</div>
                      )}
                      <div className="text-[12px] text-fg">{ev.label}</div>
                    </div>
                    <div className="text-[11px] font-mono text-muted ml-4 shrink-0">{ev.value}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Rationale */}
            <div>
              <div className="text-[12px] font-semibold text-fg mb-3">Rationale</div>
              <ul className="space-y-2">
                {active.rationale.map((r, i) => (
                  <li key={i} className="flex gap-2.5 text-[12px] text-muted">
                    <span className="text-faint shrink-0 mt-0.5">—</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended action */}
            <div className="rounded-sm bg-elevated border border-border px-4 py-3 text-[12px] text-muted">
              <span className="font-semibold text-fg">Recommended action: </span>
              {active.recommendedAction}
            </div>

            {/* Examiner stance */}
            <div className="border-t border-hairline pt-6">
              <div className="text-[12px] font-semibold text-fg mb-3">Examiner Stance</div>
              <textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Record examiner observations or contradictory evidence…"
                rows={3}
                className="w-full rounded-sm bg-surface border border-border px-4 py-3 text-[12px] text-fg placeholder:text-subtle focus:outline-none focus:border-accent resize-none"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {(["corroborates", "does-not-corroborate", "needs-more"] as const).map((stance) => (
                  <Button
                    key={stance}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      addNote({ targetType: "finding", targetId: active.id, body: noteBody.trim() || active.title, stance });
                      setNoteBody("");
                    }}
                    className={cn(
                      "font-semibold text-[11px]",
                      stance === "corroborates" && "border-ok/40 text-ok hover:bg-ok-dim",
                      stance === "does-not-corroborate" && "border-risk/40 text-risk hover:bg-risk-dim",
                      stance === "needs-more" && "border-concern/40 text-concern hover:bg-concern-dim",
                    )}
                  >
                    {stance.replace(/-/g, " ")}
                  </Button>
                ))}
              </div>
              {notes.filter((n) => n.targetId === active.id).length > 0 && (
                <ul className="mt-4 space-y-2">
                  {notes.filter((n) => n.targetId === active.id).map((n) => (
                    <li key={n.id} className="rounded-sm bg-surface border border-border px-4 py-3">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-subtle">{n.stance.replace(/-/g, " ")}</div>
                      <div className="mt-1 text-[12px] text-fg">{n.body}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        )}
      </div>

      <AlertDrawer alertId={alertId} onClose={() => setAlertId(null)} />
    </div>
  );
}



