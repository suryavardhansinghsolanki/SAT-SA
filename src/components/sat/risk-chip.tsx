import { bandLabel } from "@/lib/sat/engine";
import type { FindingFamily, RiskBand, Severity } from "@/lib/sat/types";
import { Badge } from "@/components/ui/badge";

export function bandTone(band: RiskBand) {
  if (band === "immediate") return "risk" as const;
  if (band === "concern") return "warn" as const;
  if (band === "watch") return "info" as const;
  if (band === "exemplar") return "ok" as const;
  return "default" as const;
}

export function sevTone(sev: Severity) {
  if (sev === "critical") return "risk" as const;
  if (sev === "high") return "warn" as const;
  if (sev === "medium") return "info" as const;
  return "default" as const;
}

export function familyTone(f: FindingFamily) {
  if (f === "execution-gap") return "warn" as const;
  if (f === "negative-space") return "info" as const;
  return "default" as const;
}

export function RiskChip({ band }: { band: RiskBand }) {
  return <Badge tone={bandTone(band)}>{bandLabel(band)}</Badge>;
}

export function SevChip({ sev }: { sev: Severity }) {
  return <Badge tone={sevTone(sev)}>{sev}</Badge>;
}
