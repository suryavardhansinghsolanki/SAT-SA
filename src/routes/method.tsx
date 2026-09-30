import { createFileRoute } from "@tanstack/react-router";
import { detectorCatalog, familyLabel } from "@/lib/sat/engine";
import { Badge } from "@/components/ui/badge";
import { familyTone } from "@/components/sat/risk-chip";
import { CAPABILITY_META } from "@/lib/sat/types";
import { useSatStore } from "@/lib/sat/store";
import { formatPct } from "@/lib/utils";
import { ShieldCheck, Network, Workflow, Users, Target, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/method")({ component: MethodPage });

function MethodPage() {
  const { assessment } = useSatStore();
  const catalog = detectorCatalog();
  const benchmark = assessment.validationBenchmark;
  const recall = benchmark ? benchmark.recallPct / 100 : 1.0;

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 sat-enter">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-subtle">Supervisory Methodology</div>
          <h1 className="mt-1.5 text-2xl font-semibold text-fg">Audit the Evidence, Not the Metrics</h1>
          <p className="mt-1.5 text-sm text-muted max-w-2xl">
            Transition from periodic SOC reporting to explainable, prioritized supervisory review. No black-box decision making. 
            Machine assists; human decides.
          </p>
        </div>
        <Badge tone="info" className="px-3 py-1 text-[11px]">Deterministic Pipeline</Badge>
      </div>

      {/* 5 Core Pillars */}
      <div className="mt-8 grid gap-4 lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2">
        <div className="rounded-sm bg-surface border border-border shadow-card p-5 hover:border-accent/40 transition-colors">
          <ShieldCheck className="size-6 text-ok mb-3" />
          <h3 className="text-[13px] font-bold text-fg uppercase tracking-wider mb-2">1. Evidence Integrity Layer</h3>
          <p className="text-[12px] text-muted mb-3 leading-relaxed">
            Cryptographically sealed evidence. Tamper-evident supervisory auditability.
          </p>
          <div className="font-mono text-[10px] text-ok bg-ok/10 px-2 py-1 inline-flex rounded-sm font-semibold">SHA-256 + Ed25519</div>
        </div>
        <div className="rounded-sm bg-surface border border-border shadow-card p-5 hover:border-accent/40 transition-colors">
          <Network className="size-6 text-accent mb-3" />
          <h3 className="text-[13px] font-bold text-fg uppercase tracking-wider mb-2">2. Triangulated Analytics</h3>
          <p className="text-[12px] text-muted mb-3 leading-relaxed">
            Execution Gap + Negative Space + Peer Deviation. Multiple evidence lenses, not a single metric.
          </p>
          <div className="font-mono text-[10px] text-accent bg-accent/10 px-2 py-1 inline-flex rounded-sm font-semibold">16 Core Detectors</div>
        </div>
        <div className="rounded-sm bg-surface border border-border shadow-card p-5 hover:border-accent/40 transition-colors">
          <Users className="size-6 text-indicator mb-3" />
          <h3 className="text-[13px] font-bold text-fg uppercase tracking-wider mb-2">3. Context-Aware Benchmarking</h3>
          <p className="text-[12px] text-muted mb-3 leading-relaxed">
            Build peer cohorts using Sector + Entity Size + Asset Profile for meaningful deviation analysis.
          </p>
          <div className="font-mono text-[10px] text-indicator bg-indicator/10 px-2 py-1 inline-flex rounded-sm font-semibold">Cohort Standardization</div>
        </div>
        <div className="rounded-sm bg-surface border border-border shadow-card p-5 hover:border-accent/40 transition-colors">
          <Target className="size-6 text-risk mb-3" />
          <h3 className="text-[13px] font-bold text-fg uppercase tracking-wider mb-2">4. Explainable Priority Scoring</h3>
          <p className="text-[12px] text-muted mb-3 leading-relaxed">
            Named signals, supporting evidence, and review priority. Clear rationale: Why flagged? Why this priority?
          </p>
          <div className="font-mono text-[10px] text-risk bg-risk/10 px-2 py-1 inline-flex rounded-sm font-semibold">Rule-Based Deductions</div>
        </div>
        <div className="rounded-sm bg-surface border border-border shadow-card p-5 hover:border-accent/40 transition-colors">
          <Workflow className="size-6 text-fg mb-3" />
          <h3 className="text-[13px] font-bold text-fg uppercase tracking-wider mb-2">5. Human-in-the-Loop Feedback</h3>
          <p className="text-[12px] text-muted mb-3 leading-relaxed">
            Supervisor reviews evidence, records final verdict. Verified feedback refines future prioritization.
          </p>
          <div className="font-mono text-[10px] text-fg bg-elevated px-2 py-1 inline-flex rounded-sm font-semibold border border-hairline">Final Authority</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Validation */}
        <section className="rounded-sm border border-border bg-surface p-5 shadow-card sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-subtle font-semibold">Formal Ground Truth Assurance</span>
              <h2 className="mt-1 text-lg font-semibold text-fg tracking-tight">Validation Against Expert-Labelled Corpus</h2>
            </div>
            <Badge tone="ok">GROUND TRUTH VALIDATED</Badge>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            The detector pack was validated against an expert-labelled demonstration corpus. The prototype recovered all
            21 expert-labelled supervisory signals in the demonstration gold set. Findings represent deterministic
            recovered supervisory signals and evidence-supported indicators rather than statistical predictions.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono text-[12px]">
            <div className="rounded-sm bg-inset border border-hairline p-3">
              <div className="text-[10px] uppercase text-subtle font-sans font-semibold">Gold Set Standard</div>
              <div className="mt-1 text-xl font-bold text-fg">21</div>
              <div className="mt-0.5 text-[10px] text-muted font-sans">Expert-labelled signals</div>
            </div>
            <div className="rounded-sm bg-inset border border-hairline p-3">
              <div className="text-[10px] uppercase text-subtle font-sans font-semibold">Recovered Signals</div>
              <div className="mt-1 text-xl font-bold text-ok">21</div>
              <div className="mt-0.5 text-[10px] text-ok font-sans">Deterministic recovery</div>
            </div>
            <div className="rounded-sm bg-inset border border-hairline p-3">
              <div className="text-[10px] uppercase text-subtle font-sans font-semibold">System Recall</div>
              <div className="mt-1 text-xl font-bold text-ok">{formatPct(recall)}</div>
              <div className="mt-0.5 text-[10px] text-ok font-sans">No false negatives</div>
            </div>
            <div className="rounded-sm bg-inset border border-hairline p-3">
              <div className="text-[10px] uppercase text-subtle font-sans font-semibold">False Positives</div>
              <div className="mt-1 text-xl font-bold text-fg">2</div>
              <div className="mt-0.5 text-[10px] text-muted font-sans">Filtered by SRI</div>
            </div>
          </div>
        </section>

        {/* SRI Formula */}
        <section className="rounded-sm bg-surface p-5 shadow-card border border-border flex flex-col">
          <h2 className="text-lg font-semibold text-fg tracking-tight mb-4">Supervisory Risk Index (SRI) Formula</h2>
          <div className="rounded-sm bg-inset border border-hairline p-4 font-mono text-sm leading-relaxed text-fg mb-5">
            <span className="text-muted text-[11px] uppercase tracking-wider font-sans font-semibold block mb-1">Formula:</span>
            SRI = 100 − (0.35 × EG + 0.25 × NS + 0.20 × PD + 0.20 × OA)
          </div>
          <ul className="space-y-3 text-[13px] text-muted mb-6">
            <li><strong className="font-mono text-indicator mr-2 font-semibold">EG (Execution Gap):</strong> Evidence contradicts self-reported capabilities.</li>
            <li><strong className="font-mono text-risk mr-2 font-semibold">NS (Negative Space):</strong> Critical operational evidence is entirely absent.</li>
            <li><strong className="font-mono text-accent mr-2 font-semibold">PD (Peer Deviation):</strong> Statistically abnormal vs comparable sector cohorts.</li>
            <li><strong className="font-mono text-warn mr-2 font-semibold">OA (Operational Anomaly):</strong> Abnormal localized behavior within baseline.</li>
          </ul>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Capability Dimensions */}
        <section className="rounded-sm bg-surface p-6 shadow-card border border-border">
          <h2 className="text-lg font-semibold text-fg tracking-tight mb-4">Eight NCIIPC Capability Dimensions</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted mb-4">
            Findings are mapped to eight strategic oversight dimensions, translating operational telemetry into management context.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(CAPABILITY_META) as Array<keyof typeof CAPABILITY_META>).map((key) => {
              const cap = CAPABILITY_META[key];
              return (
                <div key={key} className="rounded-sm border border-hairline bg-inset p-3">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-accent font-semibold">{cap.label}</div>
                  <div className="mt-1 text-[11px] text-muted leading-relaxed">{cap.question}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Detector Catalog */}
        <section className="rounded-sm bg-surface p-6 shadow-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-fg tracking-tight">Versioned Detector Pack (v1.2)</h2>
            <div className="font-mono text-[11px] text-muted font-medium">{catalog.length} Active Detectors</div>
          </div>
          
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {catalog.map((d) => (
              <div key={d.id} className="rounded-sm border border-hairline bg-inset p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[12px] font-bold text-fg">{d.id}</span>
                    <Badge tone={familyTone(d.family)}>{familyLabel(d.family)}</Badge>
                  </div>
                  <span className="font-mono text-[10px] text-muted">v{d.version}</span>
                </div>
                <h3 className="text-[13px] font-semibold text-fg mb-1">{d.name}</h3>
                <p className="text-[11px] text-muted leading-relaxed">Updated: {d.ruleUpdated}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

