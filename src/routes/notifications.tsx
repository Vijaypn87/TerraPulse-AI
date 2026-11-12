import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Wind, Trash2, Flame, Car, CloudRain, Bell, Search, MapPin } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { api } from "@/lib/api";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Alerts — TerraPulse AI" },
      { name: "description", content: "Real-time environmental alerts for your community." },
    ],
  }),
  component: NotificationsPage,
});

const KIND_ICON = {
  aqi: Wind,
  garbage: Trash2,
  fire: Flame,
  traffic: Car,
  weather: CloudRain,
} as const;

const LEVEL_STYLE = {
  info: { ring: "ring-accent/30", bg: "bg-accent/10", text: "text-accent", dot: "var(--accent)" },
  warn: {
    ring: "ring-aqi-poor/30",
    bg: "bg-aqi-poor/10",
    text: "text-aqi-poor",
    dot: "var(--aqi-poor)",
  },
  alert: {
    ring: "ring-aqi-bad/30",
    bg: "bg-aqi-bad/10",
    text: "text-aqi-bad",
    dot: "var(--aqi-bad)",
  },
} as const;

function NotificationsPage() {
  const q = useQuery({ queryKey: ["notifs"], queryFn: api.notifications });

  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");

  // Alerts are shown exactly as supplied by the data source. Nothing is generated per location;
  // the search box only filters the alerts that already exist.
  const items = useMemo(() => {
    const base = q.data ?? [];
    const t = term.trim().toLowerCase();
    if (!t) return base;
    return base.filter((n) => `${n.title} ${n.body}`.toLowerCase().includes(t));
  }, [q.data, term]);

  function runSearch(e: React.FormEvent) {
    e.preventDefault();
    setTerm(query);
  }

  return (
    <AppShell title="Alerts" subtitle="Environmental notifications">
      {/* Search bar */}
      <form onSubmit={runSearch} className="mb-4 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-2xl border border-foreground/15 bg-foreground/[0.04] px-3 py-2.5 focus-within:border-eco/40">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search alerts…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setTerm("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-2xl bg-lime text-accent-foreground px-4 py-2.5 text-sm font-medium shadow-lg shadow-eco/20 disabled:opacity-60"
        >
          <Search className="h-4 w-4" />
          Search
        </button>
      </form>

      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-foreground/15 bg-foreground/[0.04] p-4">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-lime text-accent-foreground">
          <Bell className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm font-medium">Environmental alerts</div>
          <div className="text-xs text-muted-foreground">
            {items.filter((i) => i.level !== "info").length} active
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
          No alerts available.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n, i) => {
            const Icon = KIND_ICON[n.kind];
            const s = LEVEL_STYLE[n.level];
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`glass flex items-start gap-4 rounded-2xl p-4 ring-1 ${s.ring}`}
              >
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${s.bg} ${s.text}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
                    <span className="text-sm font-medium">{n.title}</span>
                    <span className={`ml-auto text-[10px] uppercase tracking-widest ${s.text}`}>
                      {n.level}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {n.time}
                    </span>
                    <div className="flex gap-3">
                      <button className="hover:text-foreground">Mute</button>
                      <button className="hover:text-eco">View on map →</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
