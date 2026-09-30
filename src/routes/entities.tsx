import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RiskChip } from "@/components/sat/risk-chip";
import { SriMeter } from "@/components/sat/sri-meter";
import { bandLabel } from "@/lib/sat/engine";
import type { RiskBand, Sector } from "@/lib/sat/types";
import { SECTORS } from "@/lib/sat/types";
import { useSatStore } from "@/lib/sat/store";

export const Route = createFileRoute("/entities")({ component: EntitiesPage });

const BANDS: RiskBand[] = ["immediate", "concern", "watch", "tolerance", "exemplar"];

function EntitiesPage() {
  const { dataset, assessment } = useSatStore();
  const [sector, setSector] = useState<Sector | "all">("all");
  const [band, setBand] = useState<RiskBand | "all">("all");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    return [...assessment.entities]
      .sort((a, b) => b.reviewPriority - a.reviewPriority)
      .map((a) => ({ a, e: dataset.entities.find((x) => x.id === a.entityId)! }))
      .filter(({ a, e }) => {
        if (!e) return false;
        if (sector !== "all" && e.sector !== sector) return false;
        if (band !== "all" && a.band !== band) return false;
        if (q && !`${e.name} ${e.id}`.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      });
  }, [assessment.entities, dataset.entities, sector, band, q]);

  const inputCls = "h-9 rounded-sm border border-border bg-elevated px-3 text-[13px] text-fg placeholder:text-subtle focus:border-accent focus:outline-none";

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <h1 className="text-[18px] font-semibold text-fg">Entities Under Assessment</h1>
        <p className="text-[12px] text-muted mt-1">
          Sorted by review priority. SRI ranges 0–100; lower = higher risk.
        </p>
      </div>

      {/* Filter bar */}
      <div className="px-6 pb-4 flex flex-wrap items-center gap-3 shrink-0">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search entity name or ID…"
          className={`${inputCls} min-w-[200px] max-w-xs`}
          aria-label="Search"
        />
        <select
          value={sector}
          onChange={(e) => setSector(e.target.value as Sector | "all")}
          className={inputCls}
        >
          <option value="all">All sectors</option>
          {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={band}
          onChange={(e) => setBand(e.target.value as RiskBand | "all")}
          className={inputCls}
        >
          <option value="all">All bands</option>
          {BANDS.map((b) => <option key={b} value={b}>{bandLabel(b)}</option>)}
        </select>
        <span className="ml-auto text-[11px] text-muted font-mono tabular">
          {rows.length} / {assessment.entities.length}
        </span>
      </div>

      {/* Table — desktop */}
      <div className="flex-1 mx-6 mb-6 rounded-sm bg-surface border border-hairline overflow-hidden flex flex-col min-h-0">
        {/* Table head sticky */}
        <div className="hidden md:grid grid-cols-[2fr_1fr_80px_120px_72px_72px_120px] gap-0 border-b border-hairline bg-elevated shrink-0">
          {["Entity", "Sector", "SRI", "Band", "Gaps", "Neg Space", "Claimed Maturity"].map((h) => (
            <div key={h} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle">
              {h}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {rows.length === 0 && (
            <div className="flex items-center justify-center h-32 text-[13px] text-muted">
              No entities match the filter.
            </div>
          )}
          {rows.map(({ a, e }) => (
            <Link
              key={e.id}
              to="/entity/$id"
              params={{ id: e.id }}
              className="group hidden md:grid grid-cols-[2fr_1fr_80px_120px_72px_72px_120px] border-b border-hairline last:border-0 hover:bg-elevated/60 transition-colors"
            >
              <div className="px-4 py-3.5">
                <div className="text-[13px] font-semibold text-fg group-hover:text-accent transition-colors">{e.shortName}</div>
                <div className="font-mono text-[10px] text-subtle mt-0.5">{e.id}</div>
              </div>
              <div className="px-4 py-3.5 flex items-center text-[12px] text-muted">{e.sector}</div>
              <div className="px-4 py-3.5 flex flex-col items-start justify-center gap-1">
                <span className="font-bold text-[14px] text-fg tabular">{a.sri}</span>
                <div className="w-12">
                  <SriMeter sri={a.sri} band={a.band} size="sm" />
                </div>
              </div>
              <div className="px-4 py-3.5 flex items-center">
                <RiskChip band={a.band} />
              </div>
              <div className="px-4 py-3.5 flex items-center font-bold text-[14px] text-fg tabular">{a.executionGapCount}</div>
              <div className="px-4 py-3.5 flex items-center font-bold text-[14px] text-fg tabular">{a.negativeSpaceCount}</div>
              <div className="px-4 py-3.5 flex items-center text-[12px] text-muted">{e.declaredMaturity}</div>
            </Link>
          ))}

          {/* Mobile cards */}
          {rows.map(({ a, e }) => (
            <Link
              key={`m-${e.id}`}
              to="/entity/$id"
              params={{ id: e.id }}
              className="md:hidden flex items-center gap-4 px-5 py-4 border-b border-hairline last:border-0 hover:bg-elevated/60 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-fg">{e.shortName}</div>
                <div className="text-[11px] text-muted mt-0.5">{e.sector} · {a.executionGapCount} gaps</div>
                <div className="mt-2 w-24">
                  <SriMeter sri={a.sri} band={a.band} size="sm" />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[18px] font-bold text-fg tabular">{a.sri}</div>
                <RiskChip band={a.band} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


