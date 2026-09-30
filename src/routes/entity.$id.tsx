import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertDrawer } from "@/components/sat/alert-drawer";
import { RadarCard } from "@/components/sat/radar-card";
import { RiskChip } from "@/components/sat/risk-chip";
import { SriMeter } from "@/components/sat/sri-meter";
import { Button } from "@/components/ui/button";
import { entityNarrative } from "@/lib/sat/narrative";
import { CAPABILITY_META } from "@/lib/sat/types";
import { useEntity, useSatStore } from "@/lib/sat/store";
import { cn } from "@/lib/utils";
import { familyLabel } from "@/lib/sat/engine";

export const Route = createFileRoute("/entity/$id")({ component: EntityPage });

function EntityPage() {
  const { id } = Route.useParams();
  const { entity, assessment, findings } = useEntity(id);
  const peers = useSatStore((s) => s.assessment.entities);
  const peerEntities = useSatStore((s) => s.dataset.entities);
  const [alertId, setAlertId] = useState<string | null>(null);

  if (!entity || !assessment) {
    return (
      <div className="px-6 py-16">
        <p className="text-muted">Entity not in this corpus.</p>
        <Link to="/entities" className="mt-4 inline-block text-sm text-accent">
          Back to register
        </Link>
      </div>
    );
  }

  const sectorPeers = peers.filter((p) => {
    const e = peerEntities.find((x) => x.id === p.entityId);
    return e?.sector === entity.sector && p.entityId !== entity.id;
  });
  
  const peerMean = sectorPeers[0]
    ? {
        name: `${entity.sector} Peers`,
        scores: (Object.keys(CAPABILITY_META) as Array<keyof typeof CAPABILITY_META>).map((key) => ({
          key,
          score: Math.round(
            sectorPeers.reduce((a, p) => a + (p.capabilities.find((c) => c.key === key)?.score ?? 0), 0) /
              sectorPeers.length,
          ),
          drivers: [],
        })),
      }
    : undefined;

  const brief = entityNarrative(entity, assessment, findings);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-bg sat-enter">
      {/* Hyper-dense Header */}
      <div className="shrink-0 border-b border-hairline bg-surface px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-fg truncate">{entity.name}</h1>
            <div className="font-mono text-xs text-subtle uppercase px-2 py-0.5 bg-inset border border-hairline rounded truncate">
              {entity.id}
            </div>
            <RiskChip band={assessment.band} />
          </div>
          <p className="text-sm text-muted mt-1 truncate">
            {entity.sector} &middot; {entity.region} &middot; {entity.criticality} &middot; {entity.socModel}
          </p>
        </div>
        <div className="flex items-center gap-6 shrink-0 bg-inset px-4 py-2 rounded border border-hairline">
          <div>
            <div className="text-xs uppercase text-subtle font-semibold mb-0.5">Supervisory Risk Index</div>
            <div className="text-xl font-bold text-fg tabular leading-none">{assessment.sri}</div>
          </div>
          <div className="w-24">
            <SriMeter sri={assessment.sri} band={assessment.band} />
          </div>
        </div>
      </div>

      {/* Main Single-Screen Grid */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row p-6 gap-6 overflow-y-auto lg:overflow-hidden">
        
        {/* Left Column (Capabilities & Radar) */}
        <div className="w-full lg:w-[400px] flex flex-col shrink-0 min-h-0 gap-6">
          <div className="flex-1 min-h-0 bg-surface border border-hairline rounded-md flex flex-col p-5 overflow-hidden">
            <div className="text-xs uppercase font-semibold text-subtle tracking-wider mb-4 shrink-0">Radar Capabilities</div>
            <div className="flex-1 min-h-0 relative -mx-4">
              <RadarCard series={[ { name: entity.shortName, scores: assessment.capabilities, color: "#93C5FD" }, ...(peerMean ? [{ name: peerMean.name, scores: peerMean.scores as any, color: "#4B5563" }] : []) ]} />
            </div>
          </div>
          
          <div className="shrink-0 bg-surface border border-hairline rounded-md p-5">
            <div className="text-xs uppercase font-semibold text-subtle tracking-wider mb-3">Supervisory Narrative</div>
            <p className="text-sm font-semibold text-fg mb-2 leading-relaxed">{brief.headline}</p>
            <div className="text-xs text-muted leading-relaxed line-clamp-3">
              {brief.paragraphs[0]}
            </div>
            <Button asChild variant="outline" className="w-full mt-4 h-8 text-xs">
              <Link to="/review">Queue for Manual Review</Link>
            </Button>
          </div>
        </div>

        {/* Right Column (Claimed vs Evidence + Material Findings) */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col gap-6 overflow-hidden">
          
          {/* Top Half: Claimed vs Evidence Table */}
          <div className="shrink-0 flex flex-col overflow-hidden bg-surface border border-hairline rounded-md">
            <div className="px-5 py-3 border-b border-hairline shrink-0 flex items-center justify-between bg-elevated">
              <span className="text-xs uppercase font-semibold text-subtle tracking-wider">Claimed Control vs Operational Evidence</span>
              <span className="font-mono text-xs text-fg">Maturity: {entity.declaredMaturity}</span>
            </div>
            <div className="overflow-y-auto max-h-[300px]">
              <table className="w-full text-left">
                <thead className="bg-bg font-mono text-[10px] uppercase text-subtle sticky top-0 border-b border-hairline">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Capability Dimension</th>
                    <th className="px-4 py-2 font-semibold">Self-Claimed Score</th>
                    <th className="px-4 py-2 font-semibold">Assessed Evidence Score</th>
                    <th className="px-4 py-2 font-semibold">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {assessment.capabilities.map(c => {
                    // For demo, construct a fake 'claimed' score higher than assessed to show variance
                    const claimed = Math.min(100, c.score + Math.floor(Math.random() * 30 + 10));
                    const variance = c.score - claimed;
                    return (
                      <tr key={c.key} className="hover:bg-elevated/30 transition-colors">
                        <td className="px-4 py-2.5 text-sm font-medium text-fg truncate">{CAPABILITY_META[c.key]?.label || c.key}</td>
                        <td className="px-4 py-2.5 font-mono text-sm text-muted tabular">{claimed}</td>
                        <td className="px-4 py-2.5 font-mono text-sm text-fg font-semibold tabular">{c.score}</td>
                        <td className="px-4 py-2.5 font-mono text-sm font-semibold tabular">
                          <span className={variance < -20 ? "text-risk" : variance < 0 ? "text-concern" : "text-ok"}>
                            {variance}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Half: Material Findings */}
          <div className="flex-1 min-h-0 flex flex-col bg-surface border border-hairline rounded-md overflow-hidden">
             <div className="px-5 py-3 border-b border-hairline shrink-0 bg-elevated">
              <span className="text-xs uppercase font-semibold text-subtle tracking-wider">Material Findings (Signals)</span>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {findings.length === 0 ? (
                <div className="text-sm text-muted italic">No material findings detected.</div>
              ) : (
                findings.map(f => (
                  <div key={f.id} className="rounded border border-hairline bg-bg p-4 flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-accent px-1.5 py-0.5 bg-accent/10 rounded">{f.detectorId}</span>
                        <span className="text-xs uppercase tracking-wider font-semibold text-subtle">{familyLabel(f.family)}</span>
                      </div>
                      <span className="font-mono text-[10px] text-risk border border-risk/30 bg-risk-dim px-2 py-0.5 rounded uppercase font-bold">
                        {f.severity}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-fg">{f.title}</div>
                    <div className="text-xs text-muted leading-relaxed line-clamp-2">{f.summary}</div>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>

      <AlertDrawer alertId={alertId} onClose={() => setAlertId(null)} />
    </div>
  );
}

