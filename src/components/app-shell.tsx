import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Map, Sparkles, Flag, Bell, User, ArrowUpLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useSyncExternalStore, type ReactNode } from "react";
import { Logo } from "@/components/logo";
import { IS_DEMO_MODE } from "@/lib/api";
import { getFailedCount, subscribeSources } from "@/lib/provenance";
import { ThemeToggle } from "@/components/theme-toggle";
import { DataBadge } from "@/components/data-badge";
import { DataUnavailableNotice } from "@/components/data-unavailable";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/map", label: "Live Map", icon: Map },
  { to: "/insights", label: "Predictions", icon: Sparkles },
  { to: "/reports", label: "Reports", icon: Flag },
  { to: "/notifications", label: "Alerts", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({
  children,
  title,
  subtitle,
  toolbar,
  bare,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  toolbar?: ReactNode;
  bare?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const backendDown = useSyncExternalStore(subscribeSources, getFailedCount, () => 0) > 0;

  return (
    <div className="min-h-screen bg-aurora text-foreground">
      <div className="pointer-events-none fixed inset-0 grid-dot opacity-[0.18]" />
      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-sidebar backdrop-blur-xl md:flex">
          <div className="px-6 pb-6 pt-6">
            <Logo />
          </div>

          <nav aria-label="Application" className="flex-1 space-y-0.5 px-3">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg bg-foreground/[0.06] ring-1 ring-foreground/10"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  {active && (
                    <span
                      className="absolute -left-3 top-2 h-6 w-0.5 rounded-full bg-lime"
                      aria-hidden
                    />
                  )}
                  <Icon className="relative h-4 w-4" aria-hidden />
                  <span className="relative">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="space-y-3 border-t border-border p-5">
            {!IS_DEMO_MODE && !backendDown && (
              <>
                <DataBadge source="live" label="API connected" />
                <p className="text-[11px] leading-snug text-muted-foreground">
                  Data is requested from your configured backend.
                </p>
              </>
            )}
            {IS_DEMO_MODE && (
              <p className="text-[11px] leading-snug text-muted-foreground/80">
                Environmental measurements and predictions are illustrative until live data
                integration is implemented.
              </p>
            )}
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-lime"
            >
              <ArrowUpLeft className="h-3.5 w-3.5" aria-hidden /> Back to TerraPulse
            </Link>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/70 px-4 py-4 backdrop-blur-xl md:px-10">
            <div className="flex md:hidden">
              <Logo />
            </div>
            <div className="min-w-0 flex-1 max-md:hidden">
              {title && <h1 className="truncate text-3xl leading-none">{title}</h1>}
              {subtitle && (
                <p className="mt-1.5 truncate text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div className="ml-auto flex items-center gap-3">
              {toolbar}
              <ThemeToggle />
            </div>
          </header>

          {/* mobile page title */}
          {title && (
            <div className="px-4 pt-5 md:hidden">
              <h1 className="text-3xl leading-none">{title}</h1>
              {subtitle && <p className="mt-1.5 text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          )}

          {bare ? (
            <div className="flex-1">
              <DataUnavailableNotice className="absolute left-1/2 top-20 z-20 w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 backdrop-blur-xl" />
              {children}
            </div>
          ) : (
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-10 md:py-10">
              <DataUnavailableNotice className="mb-6" />
              {children}
            </main>
          )}

          {IS_DEMO_MODE && (
            <p className="px-4 pb-4 pt-2 text-[11px] leading-relaxed text-muted-foreground/80 md:hidden">
              Environmental measurements and predictions are illustrative until live data
              integration is implemented.
            </p>
          )}
        </div>
      </div>

      {/* Mobile tab bar */}
      <nav
        aria-label="Application"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-border bg-ink/90 backdrop-blur-xl md:hidden"
      >
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={`flex flex-col items-center gap-1 py-2.5 text-[10px] ${
                active ? "text-lime" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
