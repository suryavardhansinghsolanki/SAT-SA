import { cn } from "@/lib/utils";
import { tempoGrid } from "@/lib/sat/trends";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function HeatGrid({
  timestamps,
  caption,
}: {
  timestamps: string[];
  caption?: string;
}) {
  const { grid, max } = tempoGrid(timestamps);
  return (
    <div>
      <div className="overflow-x-auto">
        <div className="min-w-[28rem]">
          <div className="mb-1 grid grid-cols-[2.2rem_repeat(24,minmax(0,1fr))] gap-px text-[9px] uppercase tracking-wider text-subtle">
            <span />
            {Array.from({ length: 24 }, (_, h) => (
              <span key={h} className="text-center">
                {h % 6 === 0 ? String(h).padStart(2, "0") : ""}
              </span>
            ))}
          </div>
          {grid.map((row, d) => (
            <div key={d} className="mb-px grid grid-cols-[2.2rem_repeat(24,minmax(0,1fr))] gap-px">
              <span className="pr-1 text-right text-[10px] text-subtle">{DAYS[d]}</span>
              {row.map((n, h) => {
                const t = n / max;
                return (
                  <div
                    key={h}
                    title={`${DAYS[d]} ${String(h).padStart(2, "0")}:00 · ${n}`}
                    className={cn("h-3.5 rounded-[2px]", n === 0 ? "bg-inset" : "bg-risk")}
                    style={n === 0 ? undefined : { opacity: 0.18 + t * 0.82 }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {caption ? <p className="mt-2 text-xs text-subtle">{caption}</p> : null}
    </div>
  );
}
