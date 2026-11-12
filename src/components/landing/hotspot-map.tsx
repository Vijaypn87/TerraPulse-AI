import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import { configureMaplibre } from "@/lib/maplibre-setup";
import type { Hotspot, WasteReport } from "@/lib/mock-data";

import type { LayerFilter, MapPick, Region } from "./hotspot-regions";
import { REGIONS } from "./hotspot-regions";

type GeoData = Parameters<maplibregl.GeoJSONSource["setData"]>[0];
// MapLibre 6 types only known events; "tp-ready" is our own internal event.
type CustomEventMap = { fire(type: string): void; once(type: string, cb: () => void): void };

const AQI_COLOR = [
  "step",
  ["get", "aqi"],
  "#5fd68a",
  51,
  "#e9d65c",
  101,
  "#f0955a",
  151,
  "#ee5a4c",
];

export default function HotspotMap({
  air,
  waste,
  region,
  layer,
  selectedKey,
  onPick,
}: {
  air: Hotspot[];
  waste: WasteReport[];
  region: Region;
  layer: LayerFilter;
  selectedKey: string | null;
  onPick: (p: MapPick) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const readyRef = useRef(false);
  const latest = useRef({ air, waste, onPick });
  latest.current = { air, waste, onPick };

  const airFC = (): GeoData => ({
    type: "FeatureCollection",
    features: latest.current.air.map((h) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [h.lng, h.lat] },
      properties: { id: h.id, aqi: h.aqi, name: h.name },
    })),
  });
  const wasteFC = (): GeoData => ({
    type: "FeatureCollection",
    features: latest.current.waste.map((w) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [w.lng, w.lat] },
      properties: { id: w.id, sev: w.severity, title: w.title },
    })),
  });

  // create map once
  useEffect(() => {
    if (!box.current) return;
    configureMaplibre();
    const map = new maplibregl.Map({
      container: box.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [20, 25],
      zoom: 1.4,
      attributionControl: { compact: true },
      cooperativeGestures: true,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
      map.addSource("air", { type: "geojson", data: airFC() });
      map.addSource("waste", { type: "geojson", data: wasteFC() });
      map.addLayer({
        id: "air-glow",
        type: "circle",
        source: "air",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "aqi"], 0, 14, 300, 52],
          "circle-color": AQI_COLOR as never,
          "circle-opacity": 0.22,
          "circle-blur": 0.9,
        },
      });
      map.addLayer({
        id: "air-dot",
        type: "circle",
        source: "air",
        paint: {
          "circle-radius": 6,
          "circle-color": AQI_COLOR as never,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "rgba(8,14,11,0.85)",
        },
      });
      map.addLayer({
        id: "waste-dot",
        type: "circle",
        source: "waste",
        paint: {
          "circle-radius": ["match", ["get", "sev"], "High", 7, "Medium", 5.5, 4.5],
          "circle-color": "rgba(8,14,11,0.9)",
          "circle-stroke-width": 2,
          "circle-stroke-color": [
            "match",
            ["get", "sev"],
            "High",
            "#ee5a4c",
            "Medium",
            "#e9d65c",
            "#5fd68a",
          ],
        },
      });
      map.addLayer({
        id: "sel",
        type: "circle",
        source: "air",
        filter: ["==", ["get", "id"], "__none__"],
        paint: {
          "circle-radius": 13,
          "circle-color": "rgba(0,0,0,0)",
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#f4f1e6",
        },
      });
      readyRef.current = true;
      (map as unknown as CustomEventMap).fire("tp-ready");
    });

    const clickAir = (e: maplibregl.MapLayerMouseEvent) => {
      const id = e.features?.[0]?.properties?.id as string | undefined;
      const item = latest.current.air.find((h) => h.id === id);
      if (item) latest.current.onPick({ kind: "air", item });
    };
    const clickWaste = (e: maplibregl.MapLayerMouseEvent) => {
      const id = e.features?.[0]?.properties?.id as string | undefined;
      const item = latest.current.waste.find((w) => w.id === id);
      if (item) latest.current.onPick({ kind: "waste", item });
    };
    map.on("click", "air-dot", clickAir);
    map.on("click", "waste-dot", clickWaste);
    const pointer = () => (map.getCanvas().style.cursor = "pointer");
    const reset = () => (map.getCanvas().style.cursor = "");
    for (const l of ["air-dot", "waste-dot"]) {
      map.on("mouseenter", l, pointer);
      map.on("mouseleave", l, reset);
    }

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(box.current);
    return () => {
      ro.disconnect();
      readyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const withMap = (fn: (m: maplibregl.Map) => void) => {
    const m = mapRef.current;
    if (!m) return;
    if (readyRef.current) fn(m);
    else (m as unknown as CustomEventMap).once("tp-ready", () => fn(m));
  };

  // data
  useEffect(() => {
    withMap((m) => {
      (m.getSource("air") as maplibregl.GeoJSONSource | undefined)?.setData(airFC());
      (m.getSource("waste") as maplibregl.GeoJSONSource | undefined)?.setData(wasteFC());
    });
  }, [air, waste]);

  // layer filter
  useEffect(() => {
    withMap((m) => {
      const show = (ids: string[], on: boolean) =>
        ids.forEach((id) => m.setLayoutProperty(id, "visibility", on ? "visible" : "none"));
      show(["air-glow", "air-dot", "sel"], layer !== "waste");
      show(["waste-dot"], layer !== "air");
    });
  }, [layer]);

  // region
  useEffect(() => {
    withMap((m) => {
      const [w, s, e, n] = REGIONS[region].bounds;
      m.fitBounds(
        [
          [w, s],
          [e, n],
        ],
        { padding: 40, duration: 1400, maxZoom: 5 },
      );
    });
  }, [region]);

  // selection ring
  useEffect(() => {
    withMap((m) => {
      m.setFilter("sel", ["==", ["get", "id"], selectedKey ?? "__none__"]);
    });
  }, [selectedKey]);

  return (
    <div
      ref={box}
      className="h-full w-full"
      role="application"
      aria-label="Map of environmental hotspots and waste reports"
    />
  );
}
