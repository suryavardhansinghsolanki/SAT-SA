import { Link } from "@tanstack/react-router";
import { HelpCircle, ChevronRight } from "lucide-react";
import { familyLabel } from "@/lib/sat/engine";
import type { Finding } from "@/lib/sat/types";
import { Badge } from "@/components/ui/badge";
import { familyTone, SevChip } from "./risk-chip";
import { cn } from "@/lib/utils";

export function FindingCard({
  finding,
  entityName,
  compact,
}: {
  finding: Finding;
  entityName?: string;
  compact?: boolean;
}) {
  return (
    <Link
      to="/findings"
      search={{ id: finding.id }}
      className={cn(
        "group block rounded-sm border border-hairline bg-surface p-4 shadow-[var(--shadow-border)] transition-all duration-150 hover:border-accent/40 hover:bg-elevated/40",
        compact && "p-3",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[11px] font-semibold text-accent">{finding.detectorId}</span>
          <Badge tone={familyTone(finding.family)} className="text-[10px]">{familyLabel(finding.family)}</Badge>
          <SevChip sev={finding.severity} />
          {entityName ? <span className="text-xs text-muted">· {entityName}</span> : null}
        </div>
        <div className="flex items-center gap-1 rounded bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent group-hover:bg-accent group-hover:text-accent-fg transition-colors">
          <HelpCircle className="size-3" />
          <span>Why Flagged?</span>
        </div>
      </div>

      <h3 className="mt-2 text-sm font-medium text-fg group-hover:text-accent transition-colors">{finding.title}</h3>
      {!compact ? <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">{finding.summary}</p> : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-2.5 font-mono text-[11px]">
        <div className="flex items-center gap-2 text-muted truncate max-w-[80%]">
          <span className="text-subtle">Observed:</span>
          <span className="text-fg truncate">{finding.observed}</span>
        </div>
        <span className="text-accent flex items-center text-[10px] font-sans">
          Details <ChevronRight className="size-3" />
        </span>
      </div>
    </Link>
  );
}
