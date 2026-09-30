import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Seal } from "@/components/sat/seal";
import { Button } from "@/components/ui/button";
import { useSatStore } from "@/lib/sat/store";
import { formatPct } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/briefing")({ component: BriefingPage });

function BriefingPage() {
  const { dataset, assessment } = useSatStore();
  const [i, setI] = useState(0);
  const n = assessment.national;
  const worst = [...assessment.entities].sort((a, b) => a.sri - b.sri)[0];
  const worstE = dataset.entities.find((e) => e.id === worst?.entityId);
  const recall = n && assessment.expectations.total ? assessment.expectations.hit / assessment.expectations.total : 0;

  const slides = [
    {
      kicker: "01 / Problem",
      title: "Manual SOC sampling does not scale. The weaknesses it finds still matter.",
      body: "NCIIPC reviews of alert and case records keep uncovering execution gaps and negative space that policies, audits and KPI dashboards miss. SAT-SA is a supervisory analytics capability — not a SOC, not a SIEM, not a national monitor — that helps examiners see those conditions across many CSEs, then spend scarce human time where it changes the assessment.",
    },
    {
      kicker: "02 / Architecture",
      title: "Fully offline. No AI. No LLM. No cloud.",
      body: "SAT-SA is a deterministic rule engine that runs on an NCIIPC-controlled, air-gapped network. Ingest is periodic CSV/JSON of alert metadata, cases, escalations and inventory. Sixteen detectors (EG-01…AN-03) with formula, threshold and evidence. No internet, no SaaS, no hosted models, no GPU, no model updates. Hardware: a standard examiner workstation.",
    },
    {
      kicker: "03 / Method",
      title: "Eight capabilities. Two weakness families. An index you can explain.",
      body: "SRI blends detection, investigation, escalation, response, secops, governance, discipline and resilience. Execution-gap detectors catch hollow work (rapid P1 close, template notes, ack-without-investigate, SLA cliffs). Negative-space detectors catch missing evidence (silent assets, absent taxonomy, weekend blackouts, OT blind spots, source monoculture). Tempo heatmaps and a metric-theatre index show KPI gaming. The review queue is information-gain sampling, not random tickets.",
    },
    {
      kicker: "04 / This cycle",
      title: `${n.immediateCount + n.concernCount} entities need attention. ${n.findingCount} findings on ${n.entityCount} CSEs.`,
      body: `Lead: ${worstE?.name ?? "—"} (SRI ${worst?.sri}, ${worst?.negativeSpaceCount} negative-space, ${worst?.executionGapCount} execution-gap). National mean SRI ${n.meanSri}. ${n.reviewReady} examiner packs ready. Expert-expectation recall on the seeded gold set: ${formatPct(recall)}.`,
    },
    {
      kicker: "05 / Assurance",
      title: "Validate against yesterday’s manual review. Deploy without the internet.",
      body: "Hold out historical examination findings as a gold file; report detector recall each cycle. Update mechanism: versioned rule pack, signed, shipped on media — not a model card from a vendor. SAT-SA preserves the quality of expert examination by pointing humans at the right evidence, then getting out of the way.",
    },
  ];

  const s = slides[i]!;

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex items-center justify-between px-5 py-4 sm:px-10">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted hover:text-fg">
          <Seal className="size-7" />
          SAT-SA
        </Link>
        <div className="font-mono text-xs tabular text-subtle">{i + 1} / {slides.length}</div>
      </header>
      <div className="mx-auto flex w-full w-full flex-1 flex-col justify-center px-6 py-4 sm:px-10">
        <p className="text-[11px] uppercase tracking-[0.22em] text-subtle">{s.kicker}</p>
        <h1 className="mt-4 text-2xl font-semibold text-fg leading-[1.1] tracking-tight sm:text-5xl">{s.title}</h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{s.body}</p>
      </div>
      <footer className="flex items-center justify-between gap-3 px-5 py-5 sm:px-10">
        <Button variant="outline" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}>
          Previous
        </Button>
        <div className="flex gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              aria-label={`Slide ${idx + 1}`}
              onClick={() => setI(idx)}
              className={cn("h-1.5 w-6 rounded-full", idx === i ? "bg-accent" : "bg-elevated")}
            />
          ))}
        </div>
        {i < slides.length - 1 ? (
          <Button onClick={() => setI((x) => Math.min(slides.length - 1, x + 1))}>Next</Button>
        ) : (
          <Button asChild>
            <Link to="/">Enter the brief</Link>
          </Button>
        )}
      </footer>
    </div>
  );
}


