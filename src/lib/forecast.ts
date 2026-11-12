import { aqiToPm25, type Hotspot } from "./mock-data";
import type { DataSource } from "./provenance";

/** One timestep. `t` is hours relative to now (negative = history). */
export interface ForecastPoint {
  t: number;
  observed?: number; // history only
  predicted?: number; // future only (also set at t=0 to join the lines)
  lo?: number; // lower confidence bound
  hi?: number; // upper confidence bound
}

/**
 * Contract for the future FastAPI endpoint:
 *   GET {VITE_API_BASE_URL}/prediction/forecast?location=<id>&horizon=<24|72>
 * A real model response should set `source: "model"` and fill `modelName`.
 */
export interface ForecastResult {
  source: Extract<DataSource, "demo" | "model">;
  locationId: string;
  locationName: string;
  horizonHours: number;
  unit: "µg/m³ PM2.5";
  modelName?: string;
  confidenceLevel: number; // e.g. 0.8
  points: ForecastPoint[];
}

// Deterministic pseudo-noise so SSR and client agree and the demo is stable.
function noise(i: number, seed: number) {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Synthetic placeholder. Shape = diurnal cycle around the location's demo PM2.5.
 * This is NOT a prediction and must always be presented with the "demo" badge.
 */
export function demoForecast(h: Hotspot, horizonHours: 24 | 72): ForecastResult {
  const base = aqiToPm25(h.aqi);
  const seed = Number(h.id) || 1;
  const value = (t: number) =>
    Math.max(
      1,
      base * (1 + 0.22 * Math.sin(((t - 6) / 24) * Math.PI * 2) + h.trend * (t / 72)) +
        (noise(t, seed) - 0.5) * base * 0.08,
    );
  const points: ForecastPoint[] = [];
  for (let t = -48; t <= horizonHours; t++) {
    if (t < 0) points.push({ t, observed: round(value(t)) });
    else {
      const v = round(value(t));
      const spread = base * (0.06 + (t / 72) * 0.28);
      points.push({
        t,
        predicted: v,
        lo: round(Math.max(0, v - spread)),
        hi: round(v + spread),
        ...(t === 0 ? { observed: v } : {}),
      });
    }
  }
  return {
    source: "demo",
    locationId: h.id,
    locationName: h.name,
    horizonHours,
    unit: "µg/m³ PM2.5",
    confidenceLevel: 0.8,
    points,
  };
}

const round = (n: number) => Math.round(n * 10) / 10;

export type RiskLevel = "Low" | "Moderate" | "High" | "Severe";
export function riskFor(pm25: number): { level: RiskLevel; color: string } {
  if (pm25 <= 9) return { level: "Low", color: "var(--aqi-good)" };
  if (pm25 <= 35.4) return { level: "Moderate", color: "var(--aqi-mod)" };
  if (pm25 <= 55.4) return { level: "High", color: "var(--aqi-poor)" };
  return { level: "Severe", color: "var(--aqi-bad)" };
}
