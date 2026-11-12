import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { api } from "@/lib/api";
import { aqiColor, aqiLabel, aqiToPm25 } from "@/lib/mock-data";
import { Counter, Meter, Reveal, SectionLabel } from "./primitives";

function Stat({
  label,
  children,
  note,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="border-t border-foreground/15 pt-5">
      <div className="eyebrow">{label}</div>
      <div className="font-display mt-4 text-[clamp(3rem,5.5vw,5.5rem)] leading-none">
        {children}
      </div>
      {note && (
        <p className="mt-3 max-w-[22ch] text-[13px] leading-snug text-muted-foreground">{note}</p>
      )}
    </div>
  );
}

export function PlanetaryPulse() {
  const hot = useQuery({ queryKey: ["hotspots"], queryFn: api.hotspots });
  const weekly = useQuery({ queryKey: ["weekly"], queryFn: api.weekly });
  const list = useMemo(() => hot.data ?? [], [hot.data]);

  const s = useMemo(() => {
    if (!list.length) return null;
    const avgAqi = list.reduce((a, h) => a + h.aqi, 0) / list.length;
    const avgPm = list.reduce((a, h) => a + aqiToPm25(h.aqi), 0) / list.length;
    const hotspots = list.filter((h) => h.aqi > 150).length;
    const trend = (list.reduce((a, h) => a + h.trend, 0) / list.length) * 100;
    const ranked = [...list].sort((a, b) => b.aqi - a.aqi);
    return { avgAqi, avgPm, hotspots, trend, ranked };
  }, [list]);

  return (
    <section
      id="pulse"
      aria-labelledby="pulse-title"
      className="relative flex min-h-[130svh] items-center py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(270deg,var(--ink)_0%,color-mix(in_oklab,var(--ink)_70%,transparent)_45%,transparent_75%)]" />
      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-12 gap-x-0 md:gap-x-8 px-5 md:px-10">
        <div className="col-span-12 md:col-span-7 md:col-start-6">
          <Reveal>
            <SectionLabel index="01">Planetary Pulse</SectionLabel>
            <h2 id="pulse-title" className="mt-6 text-[clamp(2.4rem,5vw,4.75rem)] leading-[0.98]">
              The planet, measured in a breath.
            </h2>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="text-[13px] text-muted-foreground">
                {list.length} monitoring locations
              </span>
            </div>
          </Reveal>

          <div className="mt-14 grid grid-cols-2 gap-x-8 gap-y-12">
            <Reveal delay={0.05}>
              <Stat
                label="Air Quality Index"
                note={s ? `Mean across locations · ${aqiLabel(s.avgAqi)}` : undefined}
              >
                <Counter value={s?.avgAqi ?? 0} />
              </Stat>
            </Reveal>
            <Reveal delay={0.12}>
              <Stat
                label={
                  <>
                    PM2.5 · <span className="normal-case">µg/m³</span>
                  </>
                }
                note="Converted from AQI via EPA breakpoints"
              >
                <Counter value={s?.avgPm ?? 0} decimals={1} />
              </Stat>
            </Reveal>
            <Reveal delay={0.19}>
              <Stat label="Environmental hotspots" note="Locations with AQI above 150">
                <Counter value={s?.hotspots ?? 0} />
              </Stat>
            </Reveal>
            <Reveal delay={0.26}>
              <Stat label="Pollution trend" note="Mean change across locations">
                <Counter
                  value={s?.trend ?? 0}
                  decimals={1}
                  prefix={s && s.trend > 0 ? "+" : ""}
                  suffix="%"
                />
              </Stat>
            </Reveal>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-5">
            <Reveal className="lg:col-span-3">
              <div className="eyebrow mb-5 flex items-center justify-between">
                <span>Locations by AQI</span>
                <span>{list.length} sites</span>
              </div>
              <ul className="space-y-3.5">
                {(s?.ranked ?? []).map((h) => (
                  <li key={h.id}>
                    <div className="mb-1.5 flex items-baseline justify-between text-sm">
                      <span>
                        {h.name} <span className="text-muted-foreground">· {h.country}</span>
                      </span>
                      <span className="tabular-nums" style={{ color: aqiColor(h.aqi) }}>
                        {h.aqi}
                      </span>
                    </div>
                    <Meter value={h.aqi} max={300} color={aqiColor(h.aqi)} />
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.1} className="lg:col-span-2">
              <div className="eyebrow mb-5">Weekly AQI pulse</div>
              <div
                className="h-40"
                role="img"
                aria-label="Area chart of the weekly air quality index trend"
              >
                <ResponsiveContainer>
                  <AreaChart
                    data={weekly.data ?? []}
                    margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient id="pulse-g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--lime)" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="var(--lime)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="aqi"
                      stroke="var(--lime)"
                      strokeWidth={1.75}
                      fill="url(#pulse-g)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-3 text-[13px] leading-snug text-muted-foreground">
                Weekly AQI, Monday to Sunday.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
