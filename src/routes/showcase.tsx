import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { detectorCatalog } from "@/lib/sat/engine";
import { useSatStore } from "@/lib/sat/store";
import { formatNumber, formatPct } from "@/lib/utils";

export const Route = createFileRoute("/showcase")({ component: ShowcasePage });

const STEPS = [
  {
    t: "0:00",
    title: "Name the problem",
    body: "Policies, audits and KPI dashboards say the SOC is healthy. Manual sampling of alerts and cases keeps finding the opposite. SAT-SA is built to recover those examiner findings at scale — not to run a SOC.",
    to: "/",
    cta: "Command Brief",
  },
  {
    t: "0:40",
    title: "Who needs attention",
    body: "National SRI, Immediate/Concern bands, metric-theatre (claimed SLA vs operational evidence), and the five findings that most change an on-site plan.",
    to: "/",
    cta: "Stay on Command Brief",
  },
  {
    t: "1:20",
    title: "Open the worst dossier",
    body: "Northern Grid: examiner brief, capability radar vs power peers, silent OT assets, tempo heatmap. This is operational evidence against a claimed maturity.",
    to: "/entity/$id",
    params: { id: "CSE-PWR-001" },
    cta: "Northern Grid dossier",
  },
  {
    t: "2:10",
    title: "Show a finding you can audit",
    body: "Pick any finding. Formula, threshold, observed, peer residual, rationale, recommended examiner action. Then click an alert ID for the evidence drawer.",
    to: "/findings",
    cta: "Findings register",
  },
  {
    t: "2:50",
    title: "Work one review pack",
    body: "Information-gain sample, not a random ticket. Corroborate / does not / needs more. Negative-space packs have no alert table — the evidence is the absence.",
    to: "/review",
    cta: "Review queue",
  },
  {
    t: "3:30",
    title: "Negative space and tempo",
    body: "Weekend blackouts, 17:00 dumps, volume collapse vs peers. These are the conditions sampling rarely sees because there is nothing to sample.",
    to: "/trends",
    cta: "Trends",
  },
  {
    t: "4:10",
    title: "Prove it, then print it",
    body: "Methodology: 16 detectors, 21/21 gold-set recall. Reports: cycle briefing pack + JSON for the examination file. Briefing: five slides.",
    to: "/method",
    cta: "Methodology",
  },
] as const;

const COVERAGE: { id: string; req: string; where: string }[] = [
  { id: "FR-1–3", req: "Multi-CSE ingest of CSV / JSON / DB exports", where: "Ingest · demo corpus of 12 CSEs" },
  { id: "FR-4–7", req: "Detection, investigation, escalation, execution-gap, negative-space, anomalies", where: "16 detectors EG / NS / AN" },
  { id: "FR-8", req: "Peer comparison and benchmarking", where: "Peer Compare · sector residual in every finding" },
  { id: "FR-9–10", req: "Entity SRI and review prioritisation", where: "Entities · Review Queue" },
  { id: "FR-11–14", req: "Rationale, evidence, traceability, why flagged", where: "Findings · alert drawer · detector IDs" },
  { id: "FR-15–17", req: "Dashboards, reports, trends, drill-down", where: "Command Brief · Reports · Trends · dossier" },
  { id: "DEP", req: "Air-gapped, no cloud, no SaaS, no hosted AI", where: "Browser-side engine · no outbound calls" },
  { id: "VAL", req: "Validate against expert manual review", where: "Gold set 21/21 on Methodology" },
];

function ShowcasePage() {
  const { dataset, assessment } = useSatStore();
  const n = assessment.national;
  const worst = [...assessment.entities].sort((a, b) => a.sri - b.sri)[0];
  const worstE = dataset.entities.find((e) => e.id === worst?.entityId);
  const recall = n.entityCount ? assessment.expectations.hit / assessment.expectations.total : 0;
  const catalog = detectorCatalog();

  return (
    <div className="w-full px-4 py-4 sm:px-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-subtle">Evaluator showcase · 5 minutes</p>
      <h1 className="mt-2 w-full text-2xl font-semibold text-fg leading-[1.1] tracking-tight sm:text-5xl">
        SAT-SA is a working supervisory prototype. Walk it like an examiner.
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        NCIIPC already finds execution gaps and negative space by reading SOC alert and case records by hand. That
        work does not scale. This tool does the same reading, at cycle scale, then hands the examiner a ranked queue
        and a paper trail. It does not replace judgement, a SOC, or a SIEM.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        <Stat k="Entities" v={String(n.entityCount)} h={`${n.immediateCount} immediate · ${n.concernCount} concern`} />
        <Stat k="Findings" v={String(n.findingCount)} h={`${n.executionGaps} gaps · ${n.negativeSpace} negative space`} />
        <Stat k="Gold-set recall" v={formatPct(recall)} h={`${assessment.expectations.hit} of ${assessment.expectations.total} expert signals`} />
        <Stat k="Detectors" v={String(catalog.length)} h="Deterministic · formula on every flag" />
      </div>

      <section className="mt-10 rounded-sm bg-surface p-5 shadow-[var(--shadow-border)] sm:p-6">
        <h2 className="text-lg font-semibold text-fg tracking-tight">The problem this solves</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Conventional reporting (policies, audits, self-assessments, KPI dashboards) describes what a CSE{" "}
          <em>says</em> it can do. Alert and case-management records describe what the SOC <em>did</em>. The gap
          between those two is where NCIIPC keeps finding: alerts acknowledged but not investigated; P1s closed in
          minutes; criticals never escalated; OT estates with no OT alerts; weekend blackouts; metric theatre.
          SAT-SA exists so an examiner can see those conditions across many CSEs in one cycle, then spend scarce
          human time on the packs that change the assessment.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Lead this cycle: <span className="text-fg">{worstE?.name ?? "—"}</span> (SRI {worst?.sri},{" "}
          {worst?.negativeSpaceCount} negative-space, {worst?.executionGapCount} execution-gap) among{" "}
          {formatNumber(n.alertCount)} alerts.
        </p>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <Posture k="Network" v="Fully offline" d="Air-gapped NCIIPC network. No internet at run time." />
        <Posture k="Intelligence" v="No AI · no LLM" d="16 formula detectors. Spreadsheet-reproducible. No model weights." />
        <Posture k="Processing" v="Local only" d="Browser-side engine. No cloud, no SaaS, no hosted APIs." />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-fg tracking-tight">Five-minute live script</h2>
        <ol className="mt-4 space-y-3">
          {STEPS.map((s) => (
            <li key={s.t} className="flex flex-col gap-3 rounded-sm bg-surface p-4 shadow-[var(--shadow-border)] sm:flex-row sm:items-start">
              <span className="w-12 shrink-0 font-mono text-xs tabular text-subtle">{s.t}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{s.title}</div>
                <p className="mt-1 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
              {"params" in s ? (
                <Button variant="outline" size="sm" className="shrink-0" asChild>
                  <Link to={s.to} params={s.params}>
                    {s.cta} <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="shrink-0" asChild>
                  <Link to={s.to}>
                    {s.cta} <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-fg tracking-tight">Requirement coverage</h2>
        <div className="mt-4 divide-y divide-hairline rounded-sm bg-surface shadow-[var(--shadow-border)]">
          {COVERAGE.map((row) => (
            <div key={row.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[5.5rem_1fr_1fr] sm:items-baseline">
              <span className="font-mono text-[11px] text-subtle">{row.id}</span>
              <span className="text-sm">{row.req}</span>
              <span className="text-xs text-muted sm:text-right">{row.where}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-sm bg-elevated p-5">
        <h2 className="text-lg font-semibold text-fg tracking-tight">Deliberately not built</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>Not a SOC, SIEM, or national monitoring platform.</li>
          <li>No live log collection, no packet capture, no cloud model, no SaaS.</li>
          <li>No scoring black box — every flag has a formula a spreadsheet can reproduce.</li>
          <li>Does not close alerts or issue detections back to the CSE.</li>
        </ul>
        <p className="mt-4 text-sm text-muted">
          Remaining evaluator artefacts live in-app: <Link to="/briefing" className="text-accent">5-slide briefing</Link>
          , <Link to="/method" className="text-accent">methodology</Link>,{" "}
          <Link to="/reports" className="text-accent">cycle report</Link>. Architecture note is{" "}
          <span className="font-mono text-xs">docs/ARCHITECTURE.md</span>. Setup is in the README.
        </p>
      </section>
    </div>
  );
}

function Stat({ k, v, h }: { k: string; v: string; h: string }) {
  return (
    <div className="rounded-sm bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
      <div className="text-[10px] uppercase tracking-wider text-subtle">{k}</div>
      <div className="mt-1 font-display text-3xl tabular tracking-tight">{v}</div>
      <div className="mt-1 text-xs text-muted">{h}</div>
    </div>
  );
}

function Posture({ k, v, d }: { k: string; v: string; d: string }) {
  return (
    <div className="rounded-sm bg-surface px-4 py-4 shadow-[var(--shadow-border)]">
      <div className="text-[10px] uppercase tracking-[0.16em] text-subtle">{k}</div>
      <div className="mt-1 text-lg font-semibold text-fg tracking-tight">{v}</div>
      <p className="mt-1 text-xs leading-relaxed text-muted">{d}</p>
    </div>
  );
}


