import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Building2,
  Database,
  FileText,
  LayoutDashboard,
  ListChecks,
  Menu,
  ShieldAlert,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Seal } from "@/components/sat/seal";
import { useSatStore } from "@/lib/sat/store";
import { cn } from "@/lib/utils";

const NAV = [
  {
    group: "Assessment",
    items: [
      { to: "/", label: "Command Brief", icon: LayoutDashboard },
      { to: "/entities", label: "Entities", icon: Building2 },
      { to: "/findings", label: "Findings", icon: ShieldAlert },
      { to: "/review", label: "Review Queue", icon: ListChecks },
    ],
  },
  {
    group: "Assurance",
    items: [
      { to: "/evidence", label: "Evidence Vault", icon: Database },
      { to: "/method", label: "Methodology", icon: BookOpen },
      { to: "/reports", label: "Reports", icon: FileText },
    ],
  },
  {
    group: "Operations",
    items: [
      { to: "/ingest", label: "Ingest & Unify", icon: Upload },
    ],
  },
];

function isActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const national = useSatStore((s) => s.assessment.national);
  const source = useSatStore((s) => s.source);
  const hydrateExaminer = useSatStore((s) => s.hydrateExaminer);

  useEffect(() => {
    hydrateExaminer();
  }, [hydrateExaminer]);

  return (
    <div className="flex h-screen bg-bg text-fg overflow-hidden">
      {/* ─── Sidebar ─────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-56 flex-col bg-surface border-r border-border transition-transform duration-200 md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Logo block */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <Seal className="size-5 shrink-0 text-fg opacity-90" />
            <div>
              <div className="text-[14px] font-bold tracking-tight leading-tight text-fg">SAT-SA</div>
              <div className="text-[10px] uppercase tracking-widest text-muted leading-tight mt-0.5">NCIIPC</div>
            </div>
          </Link>
          <button
            className="size-6 flex items-center justify-center rounded text-muted hover:text-fg md:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          {NAV.map((g) => (
            <div key={g.group}>
              <div className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-faint">
                {g.group}
              </div>
              <div className="space-y-0.5">
                {g.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(pathname, item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-sm px-3 py-2 text-[12px] font-medium transition-all duration-150",
                        active
                          ? "bg-elevated border-l-2 border-indicator text-fg"
                          : "text-muted hover:bg-elevated/50 hover:text-fg border-l-2 border-transparent",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-[14px] shrink-0 transition-colors",
                          active ? "text-indicator" : "text-subtle group-hover:text-muted",
                        )}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Status footer */}
        <div className="border-t border-border px-5 py-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-[0.2em] text-faint font-mono">
              {source === "demo" ? "Demo" : "Live"} Data
            </span>
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ok">
              <span className="size-1.5 rounded-full bg-ok" />
              Offline
            </span>
          </div>
          <div className="text-[11px] text-muted font-mono tabular">
            {national.entityCount} CSEs · {national.findingCount} Findings
          </div>
        </div>
      </aside>

      {open && (
        <button
          className="fixed inset-0 z-30 bg-bg/60 md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Dismiss"
        />
      )}

      {/* ─── Main area ───────────────────────────────────── */}
      <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="flex h-11 shrink-0 items-center gap-3 border-b border-hairline px-4 md:hidden">
          <button
            className="size-8 flex items-center justify-center rounded text-muted hover:bg-elevated"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-4" />
          </button>
          <span className="text-sm font-semibold">SAT-SA</span>
        </header>

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
