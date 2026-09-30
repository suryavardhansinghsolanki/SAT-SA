import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  hint,
  tone = "default",
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "risk" | "ok" | "warn";
  className?: string;
}) {
  return (
    <div className={cn("rounded-sm bg-surface p-4 shadow-[var(--shadow-border)]", className)}>
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle">{label}</div>
      <div
        className={cn(
          "mt-2 font-display text-3xl leading-none tabular text-fg",
          tone === "risk" && "text-risk",
          tone === "ok" && "text-ok",
          tone === "warn" && "text-warn",
        )}
      >
        {value}
      </div>
      {hint ? <div className="mt-2 text-xs text-muted">{hint}</div> : null}
    </div>
  );
}
