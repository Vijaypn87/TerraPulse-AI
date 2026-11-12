import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { aqiColor, aqiLabel, aqiToPm25 } from "@/lib/mock-data";
import { useMounted } from "@/hooks/use-env";
import { cn } from "@/lib/utils";
import { REGIONS, inRegion, type LayerFilter, type MapPick, type Region } from "./hotspot-regions";
import { Reveal, SectionLabel } from "./primitives";

const HotspotMap = lazy(() => import("./hotspot-map"));

const SEV_COLOR = {
  High: "var(--aqi-bad)",
  Medium: "var(--aqi-mod)",
  Low: "var(--aqi-good)",
} as const;

export function Hotspots() {
  const mounted = useMounted();
  const hot = useQuery({ queryKey: ["hotspots"], queryFn: api.hotspots });
  const waste = useQuery({ queryKey: ["waste"], queryFn: api.wasteReports });
  const [region, setRegion] = useState<Region>("world");
  const [layer, setLayer] = useState<LayerFilter>("both");
  const [pick, setPick] = useState<MapPick>(null);
  const [near, setNear] = useState(false);
  const holder = useRef<HTMLDivElement>(null);

  // Only create the WebGL map when the section is about to be seen.
  useEffect(() => {
    if (!holder.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(holder.current);
    return () => io.disconnect();
  }, []);

  const air = useMemo(() => hot.data ?? [], [hot.data]);
  const wst = useMemo(() => waste.data ?? [], [waste.data]);
  const airIn = air.filter((h) => inRegion(h.lat, h.lng, region)).sort((a, b) => b.aqi - a.aqi);
  const wasteIn = wst.filter((w) => inRegion(w.lat, w.lng, region));

  const selectedKey = pick?.kind === "air" ? pick.item.id : null;

  return (
    <section id="hotspots" aria-labelledby="hot-title" className="relative bg-ink py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <Reveal className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <SectionLabel index="05">Environmental Hotspots</SectionLabel>
            <h2
              id="hot-title"
              className="mt-6 max-w-2xl text-[clamp(2.4rem,5vw,4.5rem)] leading-[0.98]"
            >
              Where the pressure is building.
            </h2>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Region">
              {(Object.keys(REGIONS) as Region[]).map((r) => (
                <button
                  key={r}
                  role="radio"
                  aria-checked={region === r}
                  onClick={() => setRegion(r)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-[13px] transition-colors",
                    region === r
                      ? "border-foreground/50 bg-foreground/10"
                      : "border-foreground/12 text-foreground/70 hover:border-foreground/30",
                  )}
                >
                  {REGIONS[r].label}
                </button>
              ))}
            </div>
            <div
              className="inline-flex rounded-full border border-foreground/15 p-1"
              role="radiogroup"
              aria-label="Layer"
            >
              {(
                [
                  ["both", "All"],
                  ["air", "Air"],
                  ["waste", "Waste"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  role="radio"
                  aria-checked={layer === id}
                  onClick={() => setLayer(id)}
                  className={cn(
                    "rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
                    layer === id
                      ? "bg-foreground text-ink"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-6 grid grid-cols-1 overflow-hidden rounded-2xl border border-foreground/10 lg:grid-cols-[1fr_22rem]">
            <div
              ref={holder}
              className="relative h-[28rem] bg-[oklch(0.12_0.014_165)] lg:h-[34rem]"
            >
              {mounted && near ? (
                <Suspense fallback={<MapSkeleton />}>
                  <HotspotMap
                    air={air}
                    waste={wst}
                    region={region}
                    layer={layer}
                    selectedKey={selectedKey}
                    onPick={setPick}
                  />
                </Suspense>
              ) : (
                <MapSkeleton />
              )}
              <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-x-4 gap-y-1 rounded-lg bg-ink/75 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground backdrop-blur">
                <span className="flex items-center gap-1.5">
                  <i className="h-2 w-2 rounded-full bg-aqi-bad" /> Air hotspot
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="h-2 w-2 rounded-full border-2 border-aqi-mod" /> Waste report
                </span>
              </div>
            </div>

            <aside
              className="max-h-[34rem] overflow-y-auto border-t border-foreground/10 bg-foreground/[0.02] p-5 lg:border-l lg:border-t-0"
              aria-label="Hotspot list"
            >
              {pick && (
                <div
                  className="mb-5 rounded-xl border border-foreground/15 bg-foreground/[0.04] p-4"
                  aria-live="polite"
                >
                  {pick.kind === "air" ? (
                    <>
                      <div className="eyebrow">Air · {pick.item.country}</div>
                      <div className="font-display mt-2 text-3xl">{pick.item.name}</div>
                      <div className="mt-2 text-sm" style={{ color: aqiColor(pick.item.aqi) }}>
                        AQI {pick.item.aqi} · {aqiLabel(pick.item.aqi)} · PM2.5{" "}
                        {aqiToPm25(pick.item.aqi)}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="eyebrow">Waste report · {pick.item.city}</div>
                      <div className="font-display mt-2 text-2xl leading-tight">
                        {pick.item.title}
                      </div>
                      <div
                        className="mt-2 text-sm"
                        style={{ color: SEV_COLOR[pick.item.severity] }}
                      >
                        {pick.item.severity} severity · {pick.item.status} · {pick.item.ago}
                      </div>
                    </>
                  )}
                  <button
                    onClick={() => setPick(null)}
                    className="eyebrow mt-3 hover:text-foreground"
                  >
                    Clear
                  </button>
                </div>
              )}

              {layer !== "waste" && (
                <>
                  <div className="eyebrow mb-3">Air · {airIn.length}</div>
                  <ul className="space-y-1">
                    {airIn.map((h) => (
                      <li key={h.id}>
                        <button
                          onClick={() => setPick({ kind: "air", item: h })}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-foreground/[0.06]",
                            selectedKey === h.id && "bg-foreground/[0.08]",
                          )}
                        >
                          <span className="flex items-center gap-2.5">
                            <i
                              className="h-2 w-2 rounded-full"
                              style={{ background: aqiColor(h.aqi) }}
                            />
                            {h.name}
                          </span>
                          <span className="tabular-nums text-muted-foreground">{h.aqi}</span>
                        </button>
                      </li>
                    ))}
                    {!airIn.length && (
                      <li className="px-2.5 py-2 text-sm text-muted-foreground">
                        None in this region.
                      </li>
                    )}
                  </ul>
                </>
              )}
              {layer !== "air" && (
                <>
                  <div className="eyebrow mb-3 mt-6">Waste · {wasteIn.length}</div>
                  <ul className="space-y-1">
                    {wasteIn.map((w) => (
                      <li key={w.id}>
                        <button
                          onClick={() => setPick({ kind: "waste", item: w })}
                          className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-foreground/[0.06]"
                        >
                          <i
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full border-2"
                            style={{ borderColor: SEV_COLOR[w.severity] }}
                          />
                          <span>
                            {w.title}
                            <span className="block text-[12px] text-muted-foreground">
                              {w.city} · {w.severity}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                    {!wasteIn.length && (
                      <li className="px-2.5 py-2 text-sm text-muted-foreground">
                        None in this region.
                      </li>
                    )}
                  </ul>
                </>
              )}
            </aside>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function MapSkeleton() {
  return (
    <div className="grid h-full w-full place-items-center" role="status" aria-label="Loading map">
      <div className="eyebrow animate-pulse">Loading map…</div>
    </div>
  );
}
