import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { configureMaplibre } from "@/lib/maplibre-setup";
import {
  Layers,
  Locate,
  Search as SearchIcon,
  Satellite,
  Moon,
  Sun,
  X,
  Users,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { api } from "@/lib/api";
import type { Hotspot } from "@/lib/mock-data";
import { aqiColor, aqiLabel } from "@/lib/mock-data";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Live Map — TerraPulse AI" },
      { name: "description", content: "Real-time AQI and cleanliness heatmaps across the globe." },
    ],
  }),
  component: MapPage,
});

type StyleKey = "dark" | "light" | "satellite";
const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    sat: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
    },
    labels: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    { id: "sat", type: "raster", source: "sat" },
    { id: "labels", type: "raster", source: "labels" },
  ],
};
const STYLES: Record<StyleKey, string | maplibregl.StyleSpecification> = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  satellite: SATELLITE_STYLE,
};

// A searched place. No measurements are attached: none are available without a live data source.
type MonitoringPoint = { name: string; lat: number; lng: number; country?: string };

function MapPage() {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const searchMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [selected, setSelected] = useState<Hotspot | null>(null);
  const [searchPoint, setSearchPoint] = useState<MonitoringPoint | null>(null);
  const [style, setStyle] = useState<StyleKey>("satellite");
  const [showAqi, setShowAqi] = useState(true);
  const [showClean, setShowClean] = useState(true);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const hotspots = useQuery({ queryKey: ["hotspots"], queryFn: api.hotspots });
  const data = hotspots.data ?? [];

  // Init map
  useEffect(() => {
    if (!container.current || mapRef.current) return;
    configureMaplibre();
    const map = new maplibregl.Map({
      container: container.current,
      style: STYLES.satellite,
      center: [0, 20],
      zoom: 1.6,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    mapRef.current = map;
    // Ensure map resizes with container
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(container.current);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Style change
  useEffect(() => {
    mapRef.current?.setStyle(STYLES[style]);
  }, [style]);

  // Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !data.length) return;

    const paint = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      data.forEach((h) => {
        const el = document.createElement("div");
        el.style.cursor = "pointer";
        el.innerHTML = `
          <div style="position:relative;display:grid;place-items:center;">
            ${
              showClean
                ? `<div style="position:absolute;width:56px;height:56px;border-radius:9999px;background:radial-gradient(circle,var(--eco),transparent 70%);opacity:${(h.cleanliness / 100) * 0.6};"></div>`
                : ""
            }
            ${
              showAqi
                ? `<div style="position:absolute;width:${20 + Math.min(60, h.aqi / 4)}px;height:${20 + Math.min(60, h.aqi / 4)}px;border-radius:9999px;background:radial-gradient(circle, ${aqiColor(h.aqi)}, transparent 70%);opacity:0.7;"></div>`
                : ""
            }
            <div style="position:relative;width:12px;height:12px;border-radius:9999px;background:${aqiColor(h.aqi)};box-shadow:0 0 0 2px rgba(0,0,0,0.4), 0 0 12px ${aqiColor(h.aqi)};"></div>
          </div>
        `;
        el.addEventListener("click", () => {
          setSelected(h);
          map.easeTo({ center: [h.lng, h.lat], zoom: 4.5, duration: 900 });
        });
        const marker = new maplibregl.Marker({ element: el }).setLngLat([h.lng, h.lat]).addTo(map);
        markersRef.current.push(marker);
      });
    };

    // Markers are plain DOM elements, so they do not need the map style to be loaded.
    paint();
    map.on("styledata", paint);
    return () => {
      map.off("styledata", paint);
    };
  }, [data, showAqi, showClean, style]);

  const filtered = data.filter((h) =>
    query ? h.name.toLowerCase().includes(query.toLowerCase()) : true,
  );

  function locate() {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      mapRef.current?.easeTo({
        center: [pos.coords.longitude, pos.coords.latitude],
        zoom: 10,
        duration: 1200,
      });
    });
  }

  // Free geocoding via OpenStreetMap Nominatim — no API key required.
  async function doSearch() {
    if (!query.trim() || !mapRef.current) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
        { headers: { Accept: "application/json" } },
      );
      const arr = (await res.json()) as Array<{
        lat: string;
        lon: string;
        display_name: string;
      }>;
      if (!arr.length) {
        setSearchError("No location found. Try another query.");
        return;
      }
      const { lat, lon, display_name } = arr[0];
      const latN = parseFloat(lat);
      const lonN = parseFloat(lon);
      const point: MonitoringPoint = {
        name: display_name.split(",")[0],
        lat: latN,
        lng: lonN,
        country: display_name.split(",").slice(-1)[0].trim(),
      };
      setSearchPoint(point);
      setSelected(null);

      // Drop a pin
      searchMarkerRef.current?.remove();
      const el = document.createElement("div");
      el.innerHTML = `<div style="width:16px;height:16px;border-radius:9999px;background:var(--eco);box-shadow:0 0 0 3px rgba(255,255,255,0.9),0 0 24px var(--eco);"></div>`;
      searchMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([lonN, latN])
        .addTo(mapRef.current);

      mapRef.current.flyTo({ center: [lonN, latN], zoom: 9, duration: 1600 });
    } catch {
      setSearchError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <AppShell title="Live Map" subtitle="AQI · cleanliness · community reports" bare>
      <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden">
        <div ref={container} className="h-full w-full" />

        {/* Search + filter sidebar */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="pointer-events-auto absolute left-4 top-4 z-10 w-72 max-w-[calc(100%-32px)] glass-strong rounded-2xl p-3"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              doSearch();
            }}
            className="flex items-center gap-2 rounded-xl border border-foreground/15 bg-black/30 px-3 py-2"
          >
            <SearchIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              placeholder="Search any city or place…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={searching}
              className="rounded-md bg-eco/20 px-2 py-0.5 text-[11px] font-medium text-eco hover:bg-eco/30 disabled:opacity-50"
            >
              {searching ? "…" : "Go"}
            </button>
          </form>
          {searchError && (
            <div className="mt-2 rounded-lg bg-red-500/10 px-2 py-1 text-[11px] text-red-300">
              {searchError}
            </div>
          )}

          <div className="mt-3 space-y-1">
            <div className="px-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              Layers
            </div>
            <LayerToggle
              label="AQI heatmap"
              checked={showAqi}
              onChange={setShowAqi}
              swatch="var(--accent)"
            />
            <LayerToggle
              label="Cleanliness"
              checked={showClean}
              onChange={setShowClean}
              swatch="var(--eco)"
            />
          </div>

          <div className="mt-3 max-h-64 space-y-1 overflow-auto pr-1">
            {!data.length && (
              <div className="px-2 py-3 text-sm text-muted-foreground">
                No monitoring data available
              </div>
            )}
            {filtered.map((h) => (
              <button
                key={h.id}
                onClick={() => {
                  setSelected(h);
                  mapRef.current?.easeTo({ center: [h.lng, h.lat], zoom: 4.5, duration: 900 });
                }}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-foreground/[0.05]"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: aqiColor(h.aqi), boxShadow: `0 0 10px ${aqiColor(h.aqi)}` }}
                />
                <span className="flex-1 truncate text-sm">{h.name}</span>
                <span className="text-xs text-muted-foreground">{h.aqi}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Style + tools cluster */}
        <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
          <div className="glass-strong flex overflow-hidden rounded-full p-1">
            <StyleBtn active={style === "dark"} onClick={() => setStyle("dark")}>
              <Moon className="h-3.5 w-3.5" />
            </StyleBtn>
            <StyleBtn active={style === "light"} onClick={() => setStyle("light")}>
              <Sun className="h-3.5 w-3.5" />
            </StyleBtn>
            <StyleBtn active={style === "satellite"} onClick={() => setStyle("satellite")}>
              <Satellite className="h-3.5 w-3.5" />
            </StyleBtn>
          </div>
          <button
            onClick={locate}
            className="glass-strong grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-foreground/[0.08]"
          >
            <Locate className="h-4 w-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-6 left-4 z-10 glass rounded-2xl px-3 py-2 text-xs">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            <Layers className="h-3 w-3" /> AQI legend
          </div>
          <div className="flex items-center gap-3">
            {[
              ["Good", "var(--aqi-good)"],
              ["Moderate", "var(--aqi-mod)"],
              ["Poor", "var(--aqi-poor)"],
              ["Unhealthy", "var(--aqi-bad)"],
            ].map(([l, c]) => (
              <div key={l} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: c }} /> {l}
              </div>
            ))}
          </div>
        </div>

        {/* Floating detail panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="absolute right-4 bottom-4 z-10 w-[360px] max-w-[calc(100%-32px)] glass-strong rounded-2xl p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {selected.country}
                  </div>
                  <div className="font-display text-xl font-semibold">{selected.name}</div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="grid h-7 w-7 place-items-center rounded-full bg-foreground/[0.05] text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <Stat
                  label="AQI"
                  value={selected.aqi}
                  sub={aqiLabel(selected.aqi)}
                  color={aqiColor(selected.aqi)}
                />
                <Stat
                  label="Cleanliness"
                  value={`${selected.cleanliness}`}
                  sub="/100"
                  color="var(--eco)"
                />
                <Stat
                  label="Population"
                  value={`${(selected.population / 1_000_000).toFixed(1)}M`}
                  sub=""
                  icon={<Users className="h-3.5 w-3.5" />}
                />
                <Stat
                  label="Trend"
                  value={`${selected.trend > 0 ? "+" : ""}${(selected.trend * 100).toFixed(0)}%`}
                  sub="30d"
                  color={selected.trend > 0 ? "var(--aqi-poor)" : "var(--aqi-good)"}
                  icon={<TrendingUp className="h-3.5 w-3.5" />}
                />
              </div>

              <div className="mt-4 rounded-2xl border border-foreground/15 bg-foreground/[0.04] p-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Environmental score
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-display text-2xl font-semibold">{selected.score}</span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/[0.05]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${selected.score}%` }}
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg,var(--eco),var(--accent))" }}
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Recommended actions
                </div>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {(selected.aqi > 150
                    ? [
                        "Issue sensitive-group advisory",
                        "Reroute morning traffic",
                        "Trigger cleanup drive",
                      ]
                    : selected.aqi > 100
                      ? ["Monitor peak hours", "Notify local schools"]
                      : ["Maintain sensor cadence", "Publish weekly report"]
                  ).map((r) => (
                    <li key={r} className="flex items-start gap-2 text-muted-foreground">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-eco" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search result panel — location only; no measurements without a data source */}
        <AnimatePresence>
          {searchPoint && !selected && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="absolute right-4 bottom-4 z-10 w-[380px] max-w-[calc(100%-32px)] glass-strong rounded-2xl p-5"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {searchPoint.country || "Search result"}
                  </div>
                  <div className="font-display text-xl font-semibold truncate">
                    {searchPoint.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {searchPoint.lat.toFixed(3)}°, {searchPoint.lng.toFixed(3)}°
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSearchPoint(null);
                    searchMarkerRef.current?.remove();
                    searchMarkerRef.current = null;
                  }}
                  className="grid h-7 w-7 place-items-center rounded-full bg-foreground/[0.05] text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-foreground/15 bg-foreground/[0.04] p-4">
                <div className="text-sm font-medium">No monitoring data available</div>
                <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
                  There is no verified monitoring station data for this location yet.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

function LayerToggle({
  label,
  checked,
  onChange,
  swatch,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  swatch: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between rounded-xl px-2 py-2 text-sm transition-colors ${
        checked ? "bg-foreground/[0.05]" : "hover:bg-foreground/[0.04]"
      }`}
    >
      <span className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: swatch }} />
        {label}
      </span>
      <span
        className={`h-4 w-7 rounded-full p-0.5 transition-colors ${
          checked ? "bg-eco" : "bg-foreground/[0.08]"
        }`}
      >
        <span
          className={`block h-3 w-3 rounded-full bg-white transition-transform ${
            checked ? "translate-x-3" : ""
          }`}
        />
      </span>
    </button>
  );
}

function StyleBtn({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${
        active ? "bg-white/15 text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Stat({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-foreground/15 bg-foreground/[0.04] p-3">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-display text-xl font-semibold" style={{ color: color ?? "inherit" }}>
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{sub}</span>
      </div>
    </div>
  );
}
