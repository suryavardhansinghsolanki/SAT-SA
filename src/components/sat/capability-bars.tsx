import { CAPABILITY_META, type CapabilityScore } from "@/lib/sat/types";
import { cn } from "@/lib/utils";

export function CapabilityBars({ scores }: { scores: CapabilityScore[] }) {
  return (
    <div className="grid gap-3">
      {scores.map((c) => (
        <div key={c.key} className="grid grid-cols-[7.5rem_1fr_2.2rem] items-center gap-3 sm:grid-cols-[9rem_1fr_2.4rem]">
          <div className="truncate text-xs text-muted">{CAPABILITY_META[c.key].short}</div>
          <div className="h-1.5 overflow-hidden rounded-full bg-inset">
            <div
              className={cn(
                "h-full rounded-full",
                c.score < 45 ? "bg-risk" : c.score < 65 ? "bg-warn" : c.score < 80 ? "bg-info" : "bg-ok",
              )}
              style={{ width: `${c.score}%` }}
            />
          </div>
          <div className="text-right font-mono text-xs tabular text-fg">{c.score}</div>
        </div>
      ))}
    </div>
  );
}
