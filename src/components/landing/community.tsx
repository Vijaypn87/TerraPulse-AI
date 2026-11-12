import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, CalendarDays, ChevronUp, Plus, Users } from "lucide-react";
import { api } from "@/lib/api";
import type { WasteReport } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Counter, Reveal, SectionLabel } from "./primitives";

type Status = WasteReport["status"] | "All";
const SEV = { High: "var(--aqi-bad)", Medium: "var(--aqi-mod)", Low: "var(--aqi-good)" } as const;

export function Community() {
  const waste = useQuery({ queryKey: ["waste"], queryFn: api.wasteReports });
  const cleanups = useQuery({ queryKey: ["cleanups"], queryFn: api.cleanups });

  const [local, setLocal] = useState<WasteReport[]>([]);
  const [votes, setVotes] = useState<Record<string, boolean>>({});
  const [joined, setJoined] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<Status>("All");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    city: "",
    severity: "Medium" as WasteReport["severity"],
  });

  const reports = useMemo(() => [...local, ...(waste.data ?? [])], [local, waste.data]);
  const shown = reports.filter((r) => filter === "All" || r.status === filter);
  const ev = cleanups.data ?? [];

  const verified = reports.filter((r) => r.status === "Verified").length;
  const resolved = reports.filter((r) => r.status === "Resolved").length;
  const volunteers = ev.reduce((a, c) => a + c.volunteers + (joined[c.id] ? 1 : 0), 0);
  const kg = ev.reduce((a, c) => a + (c.kgCollected ?? 0), 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    setLocal((l) => [
      {
        id: `local-${Date.now()}`,
        title: draft.title.trim(),
        city: draft.city.trim() || "Unspecified",
        lat: 0,
        lng: 0,
        severity: draft.severity,
        status: "Pending",
        reportedBy: "You",
        ago: "just now",
        upvotes: 0,
      },
      ...l,
    ]);
    setDraft({ title: "", city: "", severity: "Medium" });
    setOpen(false);
  };

  return (
    <section
      id="community"
      aria-labelledby="comm-title"
      className="relative flex min-h-[120svh] items-center py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(270deg,var(--ink)_0%,color-mix(in_oklab,var(--ink)_82%,transparent)_50%,transparent_85%)]" />
      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-12 gap-x-0 px-5 md:gap-x-10 md:px-10">
        <div className="col-span-12 md:col-span-8 md:col-start-5">
          <Reveal>
            <SectionLabel index="06">Community Impact</SectionLabel>
            <h2 id="comm-title" className="mt-6 text-[clamp(2.4rem,5vw,4.75rem)] leading-[0.98]">
              Every report is a signal.
            </h2>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-8 md:grid-cols-4">
              {[
                { l: "Citizen reports", v: reports.length },
                { l: "Verified", v: verified },
                { l: "Resolved", v: resolved },
                { l: "Volunteers", v: volunteers },
              ].map((s) => (
                <div key={s.l} className="border-t border-foreground/15 pt-4">
                  <div className="eyebrow">{s.l}</div>
                  <div className="font-display mt-3 text-5xl leading-none">
                    <Counter value={s.v} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[13px] text-muted-foreground">
              Cleanups completed so far: {kg.toLocaleString("en-US")} kg collected.
            </p>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-[1.35fr_1fr]">
            {/* feed */}
            <Reveal>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div
                  className="flex gap-1.5"
                  role="radiogroup"
                  aria-label="Filter reports by status"
                >
                  {(["All", "Verified", "Pending", "Resolved"] as Status[]).map((s) => (
                    <button
                      key={s}
                      role="radio"
                      aria-checked={filter === s}
                      onClick={() => setFilter(s)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-[12px] transition-colors",
                        filter === s
                          ? "border-foreground/50 bg-foreground/10"
                          : "border-foreground/12 text-foreground/70 hover:border-foreground/30",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setOpen((o) => !o)}
                  aria-expanded={open}
                  className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-[12px] font-medium text-ink transition-transform hover:-translate-y-0.5 active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" /> Report an issue
                </button>
              </div>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.form
                    onSubmit={submit}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="glass mb-4 space-y-3 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <span className="eyebrow">New report</span>
                      </div>
                      <label className="block text-[12px] text-muted-foreground">
                        What did you see?
                        <input
                          required
                          value={draft.title}
                          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                          placeholder="Overflowing bins near the park"
                          className="mt-1.5 w-full rounded-lg border border-foreground/15 bg-ink/50 px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground/30 focus:border-lime/60"
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="block text-[12px] text-muted-foreground">
                          City
                          <input
                            value={draft.city}
                            onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                            className="mt-1.5 w-full rounded-lg border border-foreground/15 bg-ink/50 px-3 py-2 text-sm text-foreground outline-none focus:border-lime/60"
                          />
                        </label>
                        <label className="block text-[12px] text-muted-foreground">
                          Severity
                          <select
                            value={draft.severity}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                severity: e.target.value as WasteReport["severity"],
                              })
                            }
                            className="mt-1.5 w-full rounded-lg border border-foreground/15 bg-ink px-3 py-2 text-sm text-foreground outline-none focus:border-lime/60"
                          >
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                          </select>
                        </label>
                      </div>
                      <button
                        type="submit"
                        className="rounded-full bg-lime px-4 py-2 text-[13px] font-medium text-accent-foreground transition-transform hover:-translate-y-0.5 active:scale-95"
                      >
                        Add to feed
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              <ul className="divide-y divide-foreground/10 border-y border-foreground/10">
                <AnimatePresence initial={false}>
                  {shown.slice(0, 6).map((r) => (
                    <motion.li
                      key={r.id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-4 py-4"
                    >
                      <button
                        onClick={() => setVotes((v) => ({ ...v, [r.id]: !v[r.id] }))}
                        aria-pressed={!!votes[r.id]}
                        aria-label={`Upvote: ${r.title}`}
                        className={cn(
                          "flex w-11 shrink-0 flex-col items-center rounded-lg border py-1.5 text-[12px] transition-colors",
                          votes[r.id]
                            ? "border-lime/60 bg-lime/10 text-lime"
                            : "border-foreground/12 text-muted-foreground hover:border-foreground/30",
                        )}
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                        <span className="tabular-nums">{r.upvotes + (votes[r.id] ? 1 : 0)}</span>
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="text-[15px] leading-snug">{r.title}</div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                          <span>{r.city}</span>
                          <span>{r.ago}</span>
                          <span style={{ color: SEV[r.severity] }}>{r.severity}</span>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
                          r.status === "Verified" && "border-eco/40 text-eco",
                          r.status === "Resolved" && "border-lime/40 text-lime",
                          r.status === "Pending" && "border-foreground/20 text-muted-foreground",
                        )}
                      >
                        {r.status !== "Pending" && <BadgeCheck className="h-3 w-3" aria-hidden />}
                        {r.status}
                      </span>
                    </motion.li>
                  ))}
                </AnimatePresence>
                {!shown.length && (
                  <li className="py-6 text-sm text-muted-foreground">
                    No reports with this status.
                  </li>
                )}
              </ul>
            </Reveal>

            {/* cleanups */}
            <Reveal delay={0.1}>
              <div className="eyebrow mb-4 flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden /> Cleanup activities
              </div>
              <ul className="space-y-5">
                {ev.map((c) => {
                  const done = c.status === "Completed";
                  const on = !!joined[c.id];
                  return (
                    <li key={c.id} className="border-t border-foreground/10 pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[15px] leading-snug">{c.title}</div>
                          <div className="mt-1 text-[12px] text-muted-foreground">
                            {c.city} · {c.date}
                          </div>
                        </div>
                        {done ? (
                          <span className="eyebrow text-lime">{c.kgCollected} kg</span>
                        ) : (
                          <button
                            onClick={() => setJoined((j) => ({ ...j, [c.id]: !j[c.id] }))}
                            aria-pressed={on}
                            className={cn(
                              "shrink-0 rounded-full border px-3 py-1 text-[12px] transition-colors",
                              on
                                ? "border-lime/60 bg-lime/10 text-lime"
                                : "border-foreground/20 hover:border-foreground/50",
                            )}
                          >
                            {on ? "Joined" : "Join"}
                          </button>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                        <Users className="h-3.5 w-3.5" aria-hidden />
                        {c.volunteers + (on ? 1 : 0)} volunteers · {done ? "Completed" : "Upcoming"}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
