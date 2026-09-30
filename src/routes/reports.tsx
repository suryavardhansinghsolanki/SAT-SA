import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Download, Lock, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RiskChip } from "@/components/sat/risk-chip";
import { familyLabel } from "@/lib/sat/engine";
import { entityNarrative } from "@/lib/sat/narrative";
import { generateEd25519KeyPair, signWithEd25519, type Ed25519SignatureBlock } from "@/lib/sat/signer";
import { useSatStore } from "@/lib/sat/store";
import { formatDateTime, formatNumber } from "@/lib/utils";

export const Route = createFileRoute("/reports")({ component: ReportsPage });

function ReportsPage() {
  const { dataset, assessment, notes, reviewDone, examinerId, auditLedger, receipts } = useSatStore();
  const [signatureBlock, setSignatureBlock] = useState<Ed25519SignatureBlock | null>(null);
  const [signing, setSigning] = useState(false);
  const ranked = [...assessment.entities].sort((a, b) => a.sri - b.sri);
  const benchmark = assessment.validationBenchmark;

  async function handleSignBrief() {
    setSigning(true);
    try {
      const kp = await generateEd25519KeyPair();
      const docHash = assessment.datasetHash || "DEMO-HASH";
      const sig = await signWithEd25519(kp.privateKey, docHash, examinerId);
      sig.publicKeyHex = kp.publicKeyHex;
      setSignatureBlock(sig);
    } finally {
      setSigning(false);
    }
  }

  function downloadJson() {
    const reportData = {
      nciipcReportType: "Supervisory Analytics Brief",
      assessmentId: assessment.datasetId,
      datasetHash: assessment.datasetHash,
      generatedAt: new Date().toISOString(),
      examinerAuthority: examinerId,
      detectorPackVersion: "v1.2",
      detectorPackUpdated: "2026-08-12",
      validationBenchmark: benchmark,
      datasetMetadata: {
        cycle: dataset.cycle,
        windowStart: dataset.windowStart,
        windowEnd: dataset.windowEnd,
        entitiesCount: dataset.entities.length,
        alertsCount: dataset.alerts.length,
      },
      nationalSummary: assessment.national,
      entityAssessments: assessment.entities,
      findings: assessment.findings,
      examinerReviewQueue: assessment.reviewQueue,
      auditLedgerHeight: auditLedger.length,
      auditLedgerProof: auditLedger,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nciipc-sat-sa-assessment-${assessment.datasetId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="w-full px-6 py-6 sm:px-8 sat-enter max-w-7xl mx-auto">
      {/* Page header & action bar */}
      <div className="flex flex-wrap items-start justify-between gap-6 border-b border-hairline pb-8" data-print-hide>
        <div>
          <div className="font-mono text-sm uppercase tracking-[0.22em] text-subtle font-semibold">NCIIPC Supervisory Brief</div>
          <h1 className="mt-2 text-3xl font-semibold text-fg tracking-tight">Assessment Export</h1>
          <p className="mt-2 text-base text-muted">
            Generate a formal supervisory record for NCIIPC oversight files.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => window.print()} className="gap-2 h-10 text-sm">
            <Printer className="size-4" /> Print Brief
          </Button>
          <Button onClick={downloadJson} className="gap-2 h-10 text-sm">
            <Download className="size-4" /> Export JSON
          </Button>
          <Button variant="outline" onClick={handleSignBrief} disabled={signing} className="gap-2 h-10 text-sm">
            <Lock className="size-4" />
            {signatureBlock ? "Ed25519 Signed" : "Sign with Ed25519"}
          </Button>
        </div>
      </div>

      {/* Provenance block */}
      <section className="mt-8 rounded-md border border-hairline bg-surface p-6 shadow-sm">
        <div className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-subtle mb-5">Assessment Provenance</div>
        <div className="grid gap-6 sm:grid-cols-2 font-mono text-sm">
          <div className="p-3 bg-inset rounded border border-hairline">
            <div className="text-xs font-semibold uppercase text-subtle mb-1.5">Assessment Identifier</div>
            <div className="text-accent font-bold text-base">{assessment.datasetId}</div>
          </div>
          <div className="p-3 bg-inset rounded border border-hairline">
            <div className="text-xs font-semibold uppercase text-subtle mb-1.5">Examiner Authority</div>
            <div className="text-fg font-bold text-base">{examinerId}</div>
          </div>
          <div className="sm:col-span-2 p-3 bg-inset rounded border border-hairline">
            <div className="text-xs font-semibold uppercase text-subtle mb-1.5">Dataset SHA-256 Hash</div>
            <div className="break-all text-sm text-fg bg-bg p-2 rounded border border-hairline mt-1">{assessment.datasetHash}</div>
          </div>
          <div className="p-3 bg-inset rounded border border-hairline">
            <div className="text-xs font-semibold uppercase text-subtle mb-1.5">Report Generated (UTC)</div>
            <div className="text-fg">{formatDateTime(new Date().toISOString())}</div>
          </div>
          <div className="p-3 bg-inset rounded border border-hairline">
            <div className="text-xs font-semibold uppercase text-subtle mb-1.5">Detector Pack</div>
            <div className="text-fg">v1.2 &middot; FIPS 180-4 &middot; rev 2026-08-12</div>
          </div>
        </div>
      </section>

      {/* National summary metrics */}
      <section className="mt-10">
        <div className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-subtle mb-4">National Summary</div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-md bg-inset border border-hairline p-5">
            <div className="font-mono text-xs uppercase text-subtle font-semibold">Mean SRI</div>
            <div className="mt-2 font-mono text-4xl font-bold text-fg tabular">{assessment.national.meanSri}</div>
          </div>
          <div className="rounded-md bg-inset border border-hairline p-5">
            <div className="font-mono text-xs uppercase text-subtle font-semibold">Immediate Priority</div>
            <div className="mt-2 font-mono text-4xl font-bold text-risk tabular">{assessment.national.immediateCount}</div>
          </div>
          <div className="rounded-md bg-inset border border-hairline p-5">
            <div className="font-mono text-xs uppercase text-subtle font-semibold">Execution Gaps</div>
            <div className="mt-2 font-mono text-4xl font-bold text-fg tabular">{assessment.national.executionGaps}</div>
          </div>
          <div className="rounded-md bg-inset border border-hairline p-5">
            <div className="font-mono text-xs uppercase text-subtle font-semibold">Negative Space</div>
            <div className="mt-2 font-mono text-4xl font-bold text-fg tabular">{assessment.national.negativeSpace}</div>
          </div>
        </div>
        <div className="mt-6 rounded-md bg-surface border border-hairline p-5">
          <ul className="space-y-3 text-sm text-fg leading-relaxed list-none">
            <li className="flex items-start gap-2">
              <span className="text-subtle">&bull;</span>
              <span>
                <strong>Evaluation window:</strong> {dataset.windowStart.slice(0, 10)} to {dataset.windowEnd.slice(0, 10)} covering{" "}
                <span className="font-mono text-accent">{formatNumber(assessment.national.alertCount)}</span> operational records across <span className="font-mono text-accent">{assessment.national.entityCount}</span> Critical Sector Entities.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-subtle">&bull;</span>
              <span>
                <strong>Supervisory findings:</strong> {assessment.national.findingCount} actionable conditions ({assessment.national.executionGaps} execution gaps,
                {" "}{assessment.national.negativeSpace} negative space blind spots, {assessment.national.anomalies} operational anomalies).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-subtle">&bull;</span>
              <span>
                <strong>Examiner oversight:</strong> {Object.keys(reviewDone).length} structured supervisory decisions recorded (audit ledger: {auditLedger.length} blocks).
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Entity SRI table */}
      <section className="mt-12">
        <div className="flex justify-between items-end mb-4">
          <div>
            <div className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-subtle mb-1">Entity SRI League</div>
            <p className="text-sm text-muted">
              Formula: SRI = 100 &minus; (0.35 &times; E + 0.25 &times; N + 0.20 &times; P + 0.20 &times; A)
            </p>
          </div>
        </div>
        <div className="overflow-x-auto rounded-md border border-hairline bg-surface shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-elevated border-b border-hairline font-mono text-[11px] uppercase tracking-[0.14em] text-subtle font-semibold">
              <tr>
                <th className="px-4 py-3.5">Rank</th>
                <th className="px-4 py-3.5">Critical Sector Entity</th>
                <th className="px-4 py-3.5">Sector</th>
                <th className="px-4 py-3.5">Band</th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">E (35%)</th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">N (25%)</th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">P (20%)</th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">A (20%)</th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">SRI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {ranked.map((a, i) => {
                const e = dataset.entities.find((x) => x.id === a.entityId);
                const c = a.sriComponents;
                return (
                  <tr key={a.entityId} className="hover:bg-elevated/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-sm tabular text-subtle">{String(i + 1).padStart(2, "0")}</td>
                    <td className="px-4 py-3.5 text-base font-semibold text-fg">{e?.name ?? a.entityId}</td>
                    <td className="px-4 py-3.5 text-sm text-muted">{e?.sector}</td>
                    <td className="px-4 py-3.5">
                      <RiskChip band={a.band} />
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-sm tabular text-muted">{c.executionGap}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-sm tabular text-muted">{c.negativeSpace}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-sm tabular text-muted">{c.peerDeviation}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-sm tabular text-muted">{c.operationalAnomaly}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-base font-bold tabular text-accent">{a.sri}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Priority entity narratives */}
      <section className="mt-12">
        <div className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-subtle mb-4">Priority Entity Narratives</div>
        <div className="space-y-6">
          {ranked.slice(0, 3).map((a) => {
            const e = dataset.entities.find((x) => x.id === a.entityId)!;
            const findings = assessment.findings.filter((f) => f.entityId === a.entityId);
            const n = entityNarrative(e, a, findings);
            return (
              <article key={a.entityId} className="rounded-md border border-hairline bg-surface p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 border-b border-hairline pb-4 mb-4">
                  <div>
                    <span className="font-bold text-lg text-fg">{e.name}</span>
                    <span className="text-muted text-base ml-2">({e.sector})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <RiskChip band={a.band} />
                    <span className="font-mono text-lg font-bold text-accent">SRI {a.sri}</span>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-fg leading-relaxed mb-3">{n.headline}</h3>
                <div className="space-y-2 text-sm text-muted leading-relaxed">
                  {n.paragraphs.map((p, idx) => <p key={idx}>{p}</p>)}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Material findings */}
      <section className="mt-12">
        <div className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-subtle mb-4">Material Findings Registry</div>
        <p className="text-sm text-muted mb-6">Complete inventory of Critical and High severity findings with detector provenance and mathematical conditions.</p>
        <div className="space-y-4">
          {assessment.findings
            .filter((f) => f.severity === "critical" || f.severity === "high")
            .map((f) => {
              const e = dataset.entities.find((x) => x.id === f.entityId);
              return (
                <article key={f.id} className="rounded-md border border-hairline bg-surface p-6 shadow-sm flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 font-mono text-sm">
                      <span className="font-bold text-accent px-2 py-1 bg-accent/10 rounded">{f.detectorId}</span>
                      <span className="text-muted">v{f.detectorVersion}</span>
                      <span className="text-subtle font-semibold px-2 py-1 bg-inset border border-hairline rounded uppercase text-xs">{familyLabel(f.family)}</span>
                      <span className="font-semibold text-fg">{e?.name || e?.shortName}</span>
                    </div>
                    <span className="font-mono text-ok text-xs font-bold uppercase tracking-wider bg-ok/10 rounded px-2.5 py-1 border border-ok/20">
                      Confidence {Math.round(f.confidence * 100)}%
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-fg mt-1">{f.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{f.summary}</p>
                  
                  {/* Formula and Observed Evidence block */}
                  <div className="mt-3 rounded-md bg-inset border border-hairline p-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="font-mono text-[10px] uppercase text-subtle font-semibold mb-1">Mathematical Formula</div>
                      <div className="font-mono text-xs text-muted break-all">{f.formula}</div>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase text-subtle font-semibold mb-1">Observed Evidence</div>
                      <div className="font-mono text-xs text-fg font-medium">{f.observed}</div>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
      </section>

      {/* Sign-off block */}
      <section className="mt-16 rounded-md border border-hairline bg-surface p-8 shadow-sm print-page-break">
        <div className="flex flex-wrap items-center justify-between border-b border-hairline pb-4 mb-8">
          <div className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-subtle">Supervisory Audit Verification</div>
          <span className="font-mono text-xs font-bold text-ok bg-ok/10 rounded px-3 py-1.5 uppercase tracking-widest border border-ok/20">Official Use Only</span>
        </div>

        <div className="grid gap-10 sm:grid-cols-2">
          <div className="font-mono">
            <div className="text-xs font-semibold uppercase text-subtle mb-1.5">Examiner / Auditor ID</div>
            <div className="text-lg font-bold text-fg">{examinerId}</div>
            
            <div className="mt-8 text-xs font-semibold uppercase text-subtle mb-1.5">Audit Chain Height</div>
            <div className="text-lg font-bold text-ok">{auditLedger.length} Verified Blocks</div>
          </div>
          <div>
            <div className="font-mono text-xs font-semibold uppercase text-subtle mb-12">Physical Examiner Signature</div>
            <div className="border-b-2 border-dashed border-subtle w-72 mb-2" />
            <div className="font-mono text-xs text-muted font-medium">National Critical Information Infrastructure Protection Centre</div>
          </div>
        </div>

        {signatureBlock && (
          <div className="mt-10 rounded-md border border-ok/30 bg-ok/5 p-6 shadow-sm">
            <div className="flex items-center gap-3 text-ok font-bold text-base mb-5">
              <CheckCircle2 className="size-5" />
              <span className="tracking-wide">Ed25519 Cryptographic Attestation (RFC 8032)</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 font-mono text-sm text-muted">
              <div>
                <div className="text-xs font-semibold uppercase text-subtle mb-1">Attestation Timestamp</div>
                <div className="text-fg font-medium">{signatureBlock.signedAt}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-subtle mb-1">Public Key (Hex)</div>
                <div className="truncate text-fg font-medium bg-bg p-2 rounded border border-hairline">{signatureBlock.publicKeyHex}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs font-semibold uppercase text-subtle mb-1">Digital Signature (Hex)</div>
                <div className="break-all text-fg font-medium bg-bg p-3 rounded border border-hairline leading-relaxed">{signatureBlock.signatureHex}</div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
