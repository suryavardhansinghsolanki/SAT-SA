import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, RotateCcw, ShieldCheck, Upload, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { datasetToAlertsCsv } from "@/lib/sat/corpus";
import { REQUIRED_COLUMNS, validateAndIngestSubmission, type IngestionResult, type QualityMetrics } from "@/lib/sat/schema";
import { useSatStore } from "@/lib/sat/store";
import type { EvidenceReceipt } from "@/lib/sat/vault";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ingest")({ component: IngestPage });

function generateSampleCsvTemplate(): string {
  const header = REQUIRED_COLUMNS.join(",");
  const row1 = "AL-2026-00001,CSE-PWR-001,Northern Grid Power Corp,Power,AST-SCADA-01,2026-09-01T08:15:00Z,2026-09-01T08:24:00Z,critical,malware,SIEM,closed,incident,CS-1001,true,A. Mehra,60,Host isolated following suspicious C2 beaconing.";
  const row2 = "AL-2026-00002,CSE-PWR-001,Northern Grid Power Corp,Power,AST-PLC-02,2026-09-01T09:30:00Z,2026-09-01T09:42:00Z,critical,unauthorized-access,EDR,closed,true_positive,CS-1002,false,R. Iyer,60,Authentication bypass detected on engineering workstation.";
  const row3 = "AL-2026-00003,CSE-PWR-001,Northern Grid Power Corp,Power,AST-RTU-05,2026-09-01T11:00:00Z,2026-09-01T12:15:00Z,high,misconfiguration,Firewall,closed,false_positive,CS-1003,false,S. Banerjee,120,Routine telemetry sync verified by network engineering.";
  return [header, row1, row2, row3].join("\n");
}

function IngestPage() {
  const { dataset, source, loadDataset, resetDemo, assessment, qualityMetrics, receipts, examinerId } = useSatStore();
  const [successInfo, setSuccessInfo] = useState<{
    metrics: QualityMetrics;
    warnings: string[];
    hash: string;
    datasetId: string;
  } | null>(null);
  const [failureInfo, setFailureInfo] = useState<{
    summary: string;
    details: string[];
    affectedRows?: number[];
  } | null>(null);
  const [processing, setProcessing] = useState(false);

  async function onFile(file: File) {
    setProcessing(true);
    setFailureInfo(null);
    setSuccessInfo(null);

    try {
      const text = await file.text();
      const result: IngestionResult = validateAndIngestSubmission(text, file.name);

      if (!result.success) {
        setFailureInfo({
          summary: result.summary,
          details: result.details,
          affectedRows: result.affectedRows,
        });
        setProcessing(false);
        return;
      }

      // Successful validation
      const receipt: EvidenceReceipt = {
        datasetId: result.datasetId,
        datasetHash: result.datasetHash,
        fileName: file.name,
        ingestedAt: new Date().toISOString(),
        examinerId,
        recordCount: result.metrics.acceptedAlerts,
        entityCount: result.metrics.entitiesDetected,
        qualityScore: result.metrics.qualityScorePct,
        sourceType: file.name.endsWith(".json") ? "json" : "csv",
      };

      loadDataset(result.dataset, "upload", receipt, result.metrics);

      setSuccessInfo({
        metrics: result.metrics,
        warnings: result.warnings,
        hash: result.datasetHash,
        datasetId: result.datasetId,
      });
    } catch {
      setFailureInfo({
        summary: "File ingestion failed unexpectedly.",
        details: ["An unhandled error occurred while reading the file. Ensure the file encoding is UTF-8."],
      });
    } finally {
      setProcessing(false);
    }
  }

  function downloadCurrentCsv() {
    const blob = new Blob([datasetToAlertsCsv(dataset)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sat-sa-${dataset.cycle}-alerts.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadBlankTemplate() {
    const blob = new Blob([generateSampleCsvTemplate()], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nciipc-sat-sa-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="w-full px-4 py-4 sm:px-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-subtle">Data Ingestion & Verification</p>
      <h1 className="mt-2 text-2xl font-semibold text-fg tracking-tight">Structured Submission Ingestion</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Ingest periodic SOC evidence submitted by Critical Sector Entities (CSEs). The ingestion pipeline enforces
        strict schema validation, deterministic field normalization, deduplication, and SHA-256 evidence hashing.
        Execution gap detection, negative space detection, and Supervisory Risk Index (SRI) are recalculated
        dynamically entirely inside your local workstation runtime. No data is transmitted externally.
      </p>

      {/* Active Corpus Status Card */}
      <div className="mt-6 rounded-sm bg-surface border border-border p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-subtle font-semibold">Active Corpus State</div>
            <div className="mt-1 text-base font-semibold text-fg">
              {source === "demo" ? "Demonstration Gold Set (Deterministic Baseline)" : "Uploaded Critical Sector Submission"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 font-mono text-[11px] font-bold tracking-wider",
                source === "demo" ? "bg-accent/10 text-accent border-accent/20" : "bg-ok/10 text-ok border-ok/20"
              )}
            >
              <ShieldCheck className="size-3.5" />
              {source === "demo" ? "BASELINE SEED" : "SEALED VAULT DATA"}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono text-xs">
          <div className="rounded-sm bg-inset border border-hairline p-3">
            <div className="text-[10px] uppercase tracking-wider text-subtle font-sans font-semibold">Entities</div>
            <div className="mt-1 text-[15px] font-bold text-fg">{assessment.national.entityCount}</div>
          </div>
          <div className="rounded-sm bg-inset border border-hairline p-3">
            <div className="text-[10px] uppercase tracking-wider text-subtle font-sans font-semibold">Total Alerts</div>
            <div className="mt-1 text-[15px] font-bold text-fg">{assessment.national.alertCount.toLocaleString()}</div>
          </div>
          <div className="rounded-sm bg-inset border border-hairline p-3">
            <div className="text-[10px] uppercase tracking-wider text-subtle font-sans font-semibold">Findings Recovered</div>
            <div className="mt-1 text-[15px] font-bold text-fg">{assessment.national.findingCount}</div>
          </div>
          <div className="rounded-sm bg-inset border border-hairline p-3">
            <div className="text-[10px] uppercase tracking-wider text-subtle font-sans font-semibold">Data Quality</div>
            <div className="mt-1 text-[15px] font-bold text-ok">
              {qualityMetrics ? `${qualityMetrics.qualityScorePct}%` : "100%"}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-sm bg-accent px-4 text-[13px] font-semibold text-accent-fg hover:opacity-95 transition-opacity">
            <Upload className="size-4" />
            {processing ? "Validating Submission..." : "Seal to Evidence Vault (CSV/JSON)"}
            <input
              type="file"
              accept=".csv,.json,text/csv,application/json"
              className="hidden"
              suppressHydrationWarning
              disabled={processing}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
                e.target.value = "";
              }}
            />
          </label>
          <Button variant="outline" onClick={downloadCurrentCsv} className="gap-2">
            <Download className="size-4" /> Export Current Corpus CSV
          </Button>
          <Button variant="outline" onClick={downloadBlankTemplate} className="gap-2">
            <FileSpreadsheet className="size-4" /> Download Standard Schema CSV
          </Button>
          {source === "upload" ? (
            <Button
              variant="ghost"
              onClick={() => {
                resetDemo();
                setSuccessInfo(null);
                setFailureInfo(null);
              }}
              className="gap-2 text-muted hover:text-fg"
            >
              <RotateCcw className="size-4" /> Restore Demonstration Gold Set
            </Button>
          ) : null}
        </div>
      </div>

      {/* Structured Failure Message (No Stack Traces) */}
      {failureInfo ? (
        <div className="mt-6 rounded-sm border border-risk/40 bg-risk/10 p-5 text-risk">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <div className="font-semibold text-base">{failureInfo.summary}</div>
              <ul className="list-disc pl-5 space-y-1 text-sm text-risk/90 font-mono">
                {failureInfo.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
              {failureInfo.affectedRows && failureInfo.affectedRows.length > 0 ? (
                <div className="text-xs text-risk/80 font-mono">
                  Affected rows: {failureInfo.affectedRows.slice(0, 15).join(", ")}
                  {failureInfo.affectedRows.length > 15 ? "..." : ""}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Structured Ingestion Success Message */}
      {successInfo ? (
        <div className="mt-6 rounded-sm border border-ok/40 bg-ok/10 p-5 text-ok">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
            <div className="space-y-3 flex-1">
              <div className="font-semibold text-base">Submission Validated and Sealed Successfully</div>
              <div className="grid gap-2 text-[13px] font-mono sm:grid-cols-2">
                <div>✓ {successInfo.metrics.acceptedAlerts.toLocaleString()} alerts imported</div>
                <div>✓ {successInfo.metrics.entitiesDetected} entities detected</div>
                <div>✓ {successInfo.metrics.casesSynthesized} case files synthesized</div>
                <div>✓ Dataset Quality Score: {successInfo.metrics.qualityScorePct}%</div>
                <div className="sm:col-span-2 text-accent">
                  ✓ Evidence Vault SHA-256 Receipt:{" "}
                  <span className="text-xs text-fg">{successInfo.hash}</span>
                </div>
                <div className="sm:col-span-2">✓ Assessment & review queue recalculated dynamically</div>
              </div>

              {successInfo.warnings.length > 0 ? (
                <div className="mt-3 rounded-sm border border-warn/30 bg-warn/10 p-3 text-warn">
                  <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider">
                    <AlertTriangle className="size-4" /> Non-fatal Data Diagnostics:
                  </div>
                  <ul className="mt-1 list-disc pl-5 space-y-1 text-xs">
                    {successInfo.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Schema Specification Table */}
      <section className="mt-8 rounded-sm bg-surface p-5 border border-border shadow-card sm:p-6">
        <h2 className="font-semibold text-lg tracking-tight text-fg">NCIIPC Minimum Ingestion Schema</h2>
        <p className="mt-1.5 text-[13px] text-muted">
          Submissions must contain structured operational metadata. Raw logs, network PCAPs, or customer PII are strictly
          prohibited. Field alias mapping is applied automatically during ingestion.
        </p>

        <div className="mt-5 overflow-x-auto rounded-sm border border-hairline">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-hairline bg-elevated/40 text-[10px] uppercase tracking-wider text-subtle font-sans">
              <tr>
                <th className="px-3 py-2.5 font-medium">Canonical Field</th>
                <th className="px-3 py-2.5 font-medium">Type / Format</th>
                <th className="px-3 py-2.5 font-medium">Accepted Aliases</th>
                <th className="px-3 py-2.5 font-medium">Validation Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              <tr>
                <td className="px-3 py-2 text-accent font-semibold">alert_id</td>
                <td className="px-3 py-2 text-fg">String</td>
                <td className="px-3 py-2 text-muted">id, alertid, alert</td>
                <td className="px-3 py-2 text-subtle">Unique per entity</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-accent font-semibold">entity_id</td>
                <td className="px-3 py-2 text-fg">String</td>
                <td className="px-3 py-2 text-muted">cse_id, entity, org_id</td>
                <td className="px-3 py-2 text-subtle">Mandatory identifier</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-accent font-semibold">entity_name</td>
                <td className="px-3 py-2 text-fg">String</td>
                <td className="px-3 py-2 text-muted">cse_name, organisation</td>
                <td className="px-3 py-2 text-subtle">Human-readable name</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-accent font-semibold">sector</td>
                <td className="px-3 py-2 text-fg">Enum</td>
                <td className="px-3 py-2 text-muted">industry, vertical</td>
                <td className="px-3 py-2 text-subtle">Power, BFSI, Telecom, Transport, Healthcare, etc.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-accent font-semibold">asset_id</td>
                <td className="px-3 py-2 text-fg">String</td>
                <td className="px-3 py-2 text-muted">host, host_id, system_id</td>
                <td className="px-3 py-2 text-subtle">Target asset identifier</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-accent font-semibold">timestamp</td>
                <td className="px-3 py-2 text-fg">ISO-8601 UTC</td>
                <td className="px-3 py-2 text-muted">ts, created_at, event_time</td>
                <td className="px-3 py-2 text-subtle">Parseable timestamp</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-accent font-semibold">closed_at</td>
                <td className="px-3 py-2 text-fg">ISO-8601 / Null</td>
                <td className="px-3 py-2 text-muted">closed, close_time</td>
                <td className="px-3 py-2 text-subtle">Closure timestamp if closed</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-accent font-semibold">severity</td>
                <td className="px-3 py-2 text-fg">Enum</td>
                <td className="px-3 py-2 text-muted">sev, priority, p1..p4</td>
                <td className="px-3 py-2 text-subtle">critical, high, medium, low</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-accent font-semibold">escalated</td>
                <td className="px-3 py-2 text-fg">Boolean</td>
                <td className="px-3 py-2 text-muted">escalation, is_escalated</td>
                <td className="px-3 py-2 text-subtle">true / false, 1 / 0, yes / no</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-accent font-semibold">notes</td>
                <td className="px-3 py-2 text-fg">Text</td>
                <td className="px-3 py-2 text-muted">comments, note, summary</td>
                <td className="px-3 py-2 text-subtle">Used for template clustering</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}



