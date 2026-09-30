import { cn } from "@/lib/utils";
import type { RiskBand } from "@/lib/sat/types";

export function SriMeter({ sri, band, size = "md" }: { sri: number; band: RiskBand; size?: "sm" | "md" | "lg" }) {
  const tone =
    band === "immediate" || band === "concern"
      ? "bg-risk"
      : band === "watch"
        ? "bg-warn"
        : band === "exemplar"
          ? "bg-ok"
          : "bg-info";
  const h = size === "lg" ? "h-2" : size === "sm" ? "h-1" : "h-1.5";
  return (
    <div className="w-full">
      <div className={cn("w-full overflow-hidden rounded-full bg-inset", h)}>
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${sri}%` }} />
      </div>
    </div>
  );
}
