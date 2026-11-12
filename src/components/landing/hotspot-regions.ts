import type { Hotspot, WasteReport } from "@/lib/mock-data";

export type Region = "world" | "americas" | "europe-africa" | "asia" | "oceania";
export type LayerFilter = "both" | "air" | "waste";
export type MapPick = { kind: "air"; item: Hotspot } | { kind: "waste"; item: WasteReport } | null;

export const REGIONS: Record<Region, { label: string; bounds: [number, number, number, number] }> =
  {
    world: { label: "World", bounds: [-170, -50, 175, 70] },
    americas: { label: "Americas", bounds: [-130, -45, -35, 55] },
    "europe-africa": { label: "Europe & Africa", bounds: [-25, -38, 60, 62] },
    asia: { label: "Asia", bounds: [60, -8, 150, 55] },
    oceania: { label: "Oceania", bounds: [110, -48, 180, -5] },
  };

export function inRegion(lat: number, lng: number, r: Region) {
  const [w, s, e, n] = REGIONS[r].bounds;
  return lng >= w && lng <= e && lat >= s && lat <= n;
}
