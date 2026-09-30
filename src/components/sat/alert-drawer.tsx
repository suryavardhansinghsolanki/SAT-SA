import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { SevChip } from "./risk-chip";
import { Button } from "@/components/ui/button";
import { useSatStore } from "@/lib/sat/store";
import { formatDateTime } from "@/lib/utils";

export function AlertDrawer({
  alertId,
  onClose,
}: {
  alertId: string | null;
  onClose: () => void;
}) {
  const dataset = useSatStore((s) => s.dataset);
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    setArmed(false);
    const t = window.setTimeout(() => setArmed(true), 50);
    return () => window.clearTimeout(t);
  }, [alertId]);
  if (!alertId) return null;
  const alert = dataset.alerts.find((a) => a.id === alertId);
  if (!alert) return null;
  const entity = dataset.entities.find((e) => e.id === alert.entityId);
  const asset = dataset.assets.find((a) => a.id === alert.assetId);
  const cse = dataset.cases.find((c) => c.id === alert.caseId || c.alertId === alert.id);
  const esc = dataset.escalations.find((e) => e.alertId === alert.id);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button className="absolute inset-0 bg-bg/70" aria-label="Dismiss evidence" onClick={() => armed && onClose()} />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto bg-surface shadow-[var(--shadow-elevated)]">
        <div className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
          <div>
            <div className="font-mono text-xs text-subtle">{alert.id}</div>
            <h2 className="mt-1 text-lg font-semibold text-fg tracking-tight">Alert evidence</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>
        <div className="space-y-4 px-5 py-5 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <SevChip sev={alert.severity} />
            <span className="text-muted">{alert.category}</span>
          </div>
          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-subtle">Opened</dt>
              <dd className="font-mono text-xs">{formatDateTime(alert.ts)}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-subtle">Closed</dt>
              <dd className="font-mono text-xs">{alert.closedAt ? formatDateTime(alert.closedAt) : "open"}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-subtle">Source</dt>
              <dd>{alert.source}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-subtle">Disposition</dt>
              <dd>{alert.disposition ?? alert.status}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-subtle">Analyst</dt>
              <dd>{alert.analyst}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-subtle">Escalated</dt>
              <dd>{alert.escalated ? "Yes" : "No"}</dd>
            </div>
          </dl>
          {asset ? (
            <div className="rounded-sm bg-inset p-3">
              <div className="text-[10px] uppercase tracking-wider text-subtle">Asset</div>
              <div className="mt-1">{asset.name}</div>
              <div className="text-xs text-muted">
                {asset.zone} · {asset.type} · {asset.criticality}
              </div>
            </div>
          ) : null}
          {cse ? (
            <div className="rounded-sm bg-inset p-3">
              <div className="text-[10px] uppercase tracking-wider text-subtle">Case {cse.id}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{cse.notes}</p>
              <div className="mt-2 text-xs text-subtle">
                {cse.actions} recorded actions · {cse.rootCauseFix ? "root-cause marked" : "no remediation flag"}
                {cse.template ? " · template language" : ""}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">No linked case record — the investigation trail is absent.</p>
          )}
          {esc ? (
            <p className="text-xs text-muted">
              Escalation {esc.fromLevel} → {esc.toLevel} {esc.accepted ? "(accepted)" : "(not accepted)"}.
            </p>
          ) : null}
          {entity ? (
            <Button variant="outline" className="w-full" asChild>
              <Link to="/entity/$id" params={{ id: entity.id }} onClick={onClose}>
                {entity.shortName} dossier
              </Link>
            </Button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
