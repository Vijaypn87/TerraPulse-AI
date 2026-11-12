import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Award, Trophy, Flag, Flame, MapPin, Star, Lock } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { api } from "@/lib/api";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — TerraPulse AI" },
      { name: "description", content: "Your environmental contribution, badges, and rank." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const p = useQuery({ queryKey: ["profile"], queryFn: api.profile });
  const b = useQuery({ queryKey: ["badges"], queryFn: api.badges });
  const profile = p.data;
  const badges = b.data ?? [];

  return (
    <AppShell title="Profile" subtitle="Your environmental contribution">
      {profile && (
        <>
          <div className="glass relative overflow-hidden rounded-2xl p-6">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-eco/30 to-accent/20 blur-3xl" />
            <div className="flex flex-col items-start gap-5 md:flex-row md:items-center">
              <div className="relative">
                <div className="grid h-20 w-20 place-items-center rounded-2xl bg-lime text-accent-foreground text-2xl font-semibold shadow-xl">
                  {profile.name
                    .split(" ")
                    .map((s) => s[0])
                    .join("")}
                </div>
                <span className="absolute -right-1 -bottom-1 grid h-7 w-7 place-items-center rounded-full bg-background ring-2 ring-eco">
                  <Star className="h-3.5 w-3.5 text-eco" />
                </span>
              </div>
              <div className="flex-1">
                <div className="font-display text-2xl font-semibold">{profile.name}</div>
                <div className="text-sm text-muted-foreground">
                  {profile.handle} · {profile.role}
                </div>
                <div className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {profile.city}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
                <MiniStat
                  icon={<Trophy className="h-3.5 w-3.5" />}
                  label="Score"
                  value={profile.score.toLocaleString()}
                />
                <MiniStat
                  icon={<Award className="h-3.5 w-3.5" />}
                  label="Rank"
                  value={`#${profile.rank}`}
                />
                <MiniStat
                  icon={<Flag className="h-3.5 w-3.5" />}
                  label="Reports"
                  value={profile.reports}
                />
                <MiniStat
                  icon={<Flame className="h-3.5 w-3.5" />}
                  label="Streak"
                  value={`${profile.streak}d`}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="glass rounded-2xl p-5 lg:col-span-2">
              <h3 className="font-display text-lg font-semibold">Badges</h3>
              <p className="text-xs text-muted-foreground">
                Earn badges by reporting hotspots, joining cleanups, and improving your neighborhood
                score.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                {badges.map((bd, i) => (
                  <motion.div
                    key={bd.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`rounded-2xl border p-4 ${
                      bd.earned
                        ? "border-eco/30 bg-eco/5"
                        : "border-foreground/15 bg-foreground/[0.03] opacity-70"
                    }`}
                  >
                    <div
                      className={`grid h-10 w-10 place-items-center rounded-2xl ${
                        bd.earned
                          ? "bg-lime text-accent-foreground"
                          : "bg-foreground/[0.05] text-muted-foreground"
                      }`}
                    >
                      {bd.earned ? <Award className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                    </div>
                    <div className="mt-3 text-sm font-medium">{bd.name}</div>
                    <div className="text-xs text-muted-foreground">{bd.desc}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <h3 className="font-display text-lg font-semibold">Achievement timeline</h3>
              <ol className="mt-4 space-y-4">
                {[
                  { d: "Today", t: "Reached rank #42 in your city" },
                  { d: "Yesterday", t: "Verified: Litter report at 5th Ave" },
                  { d: "3d ago", t: "Earned Community Voice badge" },
                  { d: "1w ago", t: "10 reports milestone" },
                  { d: "2w ago", t: "Joined Riverside cleanup drive" },
                ].map((ev, i) => (
                  <li key={i} className="relative pl-6">
                    <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-eco shadow-[0_0_10px_var(--eco)]" />
                    <div className="text-sm">{ev.t}</div>
                    <div className="text-[11px] text-muted-foreground">{ev.d}</div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-foreground/15 bg-foreground/[0.04] p-3">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 font-display text-lg font-semibold">{value}</div>
    </div>
  );
}
