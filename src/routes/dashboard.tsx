import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { api } from "@/lib/api";
import type { AQICategory } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Overview — TerraPulse AI" },
      { name: "description", content: "Environmental KPIs, trends, and community scores." },
    ],
  }),
  component: DashboardPage,
});

const toneColor: Record<AQICategory | "good" | "moderate" | "poor" | "unhealthy", string> = {
  good: "var(--aqi-good)",
  moderate: "var(--aqi-mod)",
  poor: "var(--aqi-poor)",
  unhealthy: "var(--aqi-bad)",
};

const AXIS = "color-mix(in oklab, var(--foreground) 40%, transparent)";
const GRID = "color-mix(in oklab, var(--foreground) 7%, transparent)";

function Panel({
  eyebrow,
  title,
  aside,
  children,
  className = "",
}: {
  eyebrow: string;
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`border-t border-foreground/15 pt-5 ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h2 className="mt-3 text-2xl leading-none">{title}</h2>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function DashboardPage() {
  const kpis = useQuery({ queryKey: ["kpis"], queryFn: api.kpis });
  const weekly = useQuery({ queryKey: ["weekly"], queryFn: api.weekly });
  const monthly = useQuery({ queryKey: ["monthly"], queryFn: api.monthly });
  const health = kpis.data?.find((k) => k.key === "health");
  const rest = (kpis.data ?? []).filter((k) => k.key !== "health");

  return (
    <AppShell
      title="Environmental overview"
      subtitle="Air quality, cleanliness and community scores"
    >
      {/* Hero: composite score + weekly trend */}
      <div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,20rem)_1fr]">
        <section className="border-t border-foreground/15 pt-5">
          <div className="eyebrow">Environmental health</div>
          <ScoreRing value={health?.value ?? 0} />
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Composite of AQI, cleanliness, noise and green cover.
          </p>
        </section>

        <Panel
          eyebrow="Weekly trends"
          title="Air quality vs cleanliness"
          aside={
            <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-eco" /> Cleanliness
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-lime" /> AQI
              </span>
            </div>
          }
        >
          <div className="h-64" role="img" aria-label="Weekly air quality and cleanliness trend">
            <ResponsiveContainer>
              <AreaChart data={weekly.data ?? []} margin={{ left: -16, right: 4 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--eco)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--eco)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--lime)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--lime)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis
                  dataKey="d"
                  stroke={AXIS}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  stroke={AXIS}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip contentStyle={tipStyle} />
                <Area
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="cleanliness"
                  stroke="var(--eco)"
                  fill="url(#g1)"
                  strokeWidth={2}
                />
                <Area
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="aqi"
                  stroke="var(--lime)"
                  fill="url(#g2)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* KPI strip */}
      <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-9 md:grid-cols-3 lg:grid-cols-6">
        {rest.map((k, i) => (
          <motion.div
            key={k.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="border-t border-foreground/15 pt-4"
          >
            <div className="eyebrow">{k.label}</div>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="font-display text-5xl leading-none tabular-nums">{k.value}</span>
              <span className="text-xs text-muted-foreground">{k.unit}</span>
            </div>
            <div
              className="mt-2 inline-flex items-center gap-1 text-xs"
              style={{ color: toneColor[k.tone] }}
            >
              {k.delta >= 0 ? (
                <TrendingUp className="h-3 w-3" aria-hidden />
              ) : (
                <TrendingDown className="h-3 w-3" aria-hidden />
              )}
              {Math.abs(k.delta).toFixed(1)}% vs last week
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-14 grid grid-cols-1 gap-x-12 gap-y-12 lg:grid-cols-[1.6fr_1fr]">
        <Panel eyebrow="Monthly AQI" title="30-day trajectory">
          <div className="h-56" role="img" aria-label="Thirty day air quality index series">
            <ResponsiveContainer>
              <LineChart data={monthly.data ?? []} margin={{ left: -16, right: 4 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis
                  dataKey="d"
                  stroke={AXIS}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  stroke={AXIS}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip contentStyle={tipStyle} />
                <Line
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="aqi"
                  stroke="var(--lime)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel eyebrow="Traffic pollution" title="Weekday distribution">
          <div className="h-56" role="img" aria-label="Weekday noise level distribution">
            <ResponsiveContainer>
              <BarChart data={weekly.data ?? []} margin={{ left: -16, right: 4 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis
                  dataKey="d"
                  stroke={AXIS}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  stroke={AXIS}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={tipStyle}
                  cursor={{ fill: "color-mix(in oklab, var(--foreground) 5%, transparent)" }}
                />
                <Bar
                  isAnimationActive={false}
                  dataKey="noise"
                  fill="var(--eco)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

const tipStyle = {
  background: "var(--popover)",
  border: "1px solid color-mix(in oklab, var(--foreground) 12%, transparent)",
  borderRadius: 10,
  fontSize: 12,
  color: "var(--foreground)",
};

function ScoreRing({ value }: { value: number }) {
  const R = 78;
  const C = 2 * Math.PI * R;
  const off = C - (value / 100) * C;
  return (
    <div className="mx-auto my-6 grid place-items-center">
      <div className="relative">
        <svg
          width={200}
          height={200}
          viewBox="0 0 200 200"
          role="img"
          aria-label={`Environmental health score ${value} out of 100`}
        >
          <defs>
            <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--eco)" />
              <stop offset="100%" stopColor="var(--lime)" />
            </linearGradient>
          </defs>
          <circle
            cx="100"
            cy="100"
            r={R}
            stroke="color-mix(in oklab, var(--foreground) 9%, transparent)"
            strokeWidth="3"
            fill="none"
          />
          <motion.circle
            cx="100"
            cy="100"
            r={R}
            stroke="url(#ring-grad)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: off }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
            transform="rotate(-90 100 100)"
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="font-display text-7xl leading-none tabular-nums">{value}</div>
            <div className="eyebrow mt-2">/ 100</div>
          </div>
        </div>
      </div>
    </div>
  );
}
