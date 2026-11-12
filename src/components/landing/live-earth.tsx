import { useCallback, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Move } from "lucide-react";
import { api } from "@/lib/api";
import { aqiColor, aqiLabel, aqiToPm25, type Hotspot } from "@/lib/mock-data";
import { attachGlobeSurface } from "@/components/scene/globe-drag";
import { selection, useSelection, type Layer } from "@/components/scene/store";
import { cn } from "@/lib/utils";
import { Reveal, SectionLabel } from "./primitives";

const LAYERS: { id: Layer; label: string }[] = [
  { id: "aqi", label: "AQI" },
  { id: "pm25", label: "PM2.5" },
  { id: "heat", label: "Heat" },
];

/** Drag-to-rotate surface laid over the (fixed) WebGL canvas. */
function GlobeZone() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => (ref.current ? attachGlobeSurface(ref.current) : undefined), []);

  return (
    <div
      ref={ref}
      data-globe-zone
      aria-hidden
      // Phones: only the top band (where the planet sits) captures touch, so the rest scrolls normally.
      className="absolute inset-x-0 top-0 h-[46%] cursor-grab touch-none md:inset-y-0 md:left-auto md:right-0 md:h-auto md:w-[62%] md:touch-pan-y"
    />
  );
}

function Detail({ h, layer }: { h: Hotspot; layer: Layer }) {
  const color = aqiColor(h.aqi);
  const pm = aqiToPm25(h.aqi);
  const big = layer === "pm25" ? pm.toFixed(1) : String(h.aqi);
  return (
    <motion.div
      key={h.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="eyebrow">
            {h.country} · {h.lat.toFixed(1)}°, {h.lng.toFixed(1)}°
          </div>
          <h3 className="font-display mt-3 text-4xl leading-none">{h.name}</h3>
        </div>
        <span
          className="rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em]"
          style={{ color, borderColor: `color-mix(in oklab, ${color} 45%, transparent)` }}
        >
          {aqiLabel(h.aqi)}
        </span>
      </div>

      <div className="mt-6 flex items-end gap-3">
        <span className="font-display text-[5.5rem] leading-[0.8] tabular-nums" style={{ color }}>
          {big}
        </span>
        <span className="eyebrow pb-1">
          {layer === "pm25" ? (
            <>
              PM2.5 · <span className="normal-case">µg/m³</span>
            </>
          ) : (
            "AQI"
          )}
        </span>
      </div>

      <dl className="mt-7 grid grid-cols-3 gap-4 border-t border-foreground/10 pt-5 text-sm">
        <div>
          <dt className="eyebrow">PM2.5</dt>
          <dd className="mt-2 tabular-nums">{pm.toFixed(1)}</dd>
        </div>
        <div>
          <dt className="eyebrow">Cleanliness</dt>
          <dd className="mt-2 tabular-nums">{h.cleanliness}/100</dd>
        </div>
        <div>
          <dt className="eyebrow">Trend</dt>
          <dd
            className="mt-2 tabular-nums"
            style={{ color: h.trend > 0 ? "var(--aqi-poor)" : "var(--aqi-good)" }}
          >
            {h.trend > 0 ? "+" : ""}
            {(h.trend * 100).toFixed(0)}%
          </dd>
        </div>
        <div className="col-span-3">
          <dt className="eyebrow">Population</dt>
          <dd className="mt-2 tabular-nums">{(h.population / 1e6).toFixed(1)}M</dd>
        </div>
      </dl>
    </motion.div>
  );
}

export function LiveEarth() {
  const hot = useQuery({ queryKey: ["hotspots"], queryFn: api.hotspots });
  const { selectedId, layer } = useSelection();
  const list = hot.data ?? [];
  const selected = list.find((h) => h.id === selectedId) ?? null;

  const pick = useCallback((id: string | null) => selection.set({ selectedId: id }), []);

  // Esc clears the selection
  useEffect(() => {
    const on = (e: KeyboardEvent) => e.key === "Escape" && pick(null);
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [pick]);

  return (
    <section
      id="live-earth"
      aria-labelledby="live-title"
      className="relative flex min-h-[115svh] items-center py-28"
    >
      <GlobeZone />
      <div className="pointer-events-none relative mx-auto w-full max-w-7xl px-5 md:px-10">
        <div className="pointer-events-none max-w-[27rem]">
          <Reveal>
            <SectionLabel index="02">Live Earth Intelligence</SectionLabel>
            <h2 id="live-title" className="mt-6 text-[clamp(2.4rem,4.6vw,4.25rem)] leading-[0.98]">
              Touch the planet.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-foreground/70">
              Drag the globe, pick a monitoring location, and switch the pollution layer. Markers
              rise with intensity.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div
              role="radiogroup"
              aria-label="Data layer"
              className="pointer-events-auto mt-8 inline-flex rounded-full border border-foreground/15 p-1"
            >
              {LAYERS.map((l) => (
                <button
                  key={l.id}
                  role="radio"
                  aria-checked={layer === l.id}
                  onClick={() => selection.set({ layer: l.id })}
                  className={cn(
                    "rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
                    layer === l.id
                      ? "bg-foreground text-ink"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div
              className="pointer-events-auto mt-5 flex flex-wrap gap-1.5"
              role="listbox"
              aria-label="Monitoring locations"
            >
              {list.map((h) => {
                const on = selectedId === h.id;
                return (
                  <button
                    key={h.id}
                    role="option"
                    aria-selected={on}
                    onClick={() => pick(on ? null : h.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                      on
                        ? "border-foreground/50 bg-foreground/10"
                        : "border-foreground/12 text-foreground/75 hover:border-foreground/30 hover:text-foreground",
                    )}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: aqiColor(h.aqi) }}
                    />
                    {h.name}
                  </button>
                );
              })}
            </div>
          </Reveal>

          <Reveal delay={0.18}>
            <div
              className="pointer-events-auto glass-strong mt-7 min-h-[22rem] rounded-2xl p-6"
              aria-live="polite"
            >
              <AnimatePresence mode="wait">
                {selected ? (
                  <div key={selected.id}>
                    <Detail h={selected} layer={layer} />
                    <Link
                      to="/map"
                      className="group mt-6 inline-flex items-center gap-1.5 text-sm text-lime"
                    >
                      Open in interactive map
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex h-[19rem] flex-col justify-between"
                  >
                    <div className="eyebrow">No location selected</div>
                    <div>
                      <Move className="mb-4 h-5 w-5 text-lime" aria-hidden />
                      <p className="font-display text-3xl leading-tight">
                        Select a marker on the globe, or choose a city above.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
