// Thin API service layer. Points to VITE_API_BASE_URL (e.g. a FastAPI backend) when set,
// otherwise uses bundled DEMO data (intentional demo mode only; if a configured backend
// fails, calls reject and the UI shows an unavailable state). Each call records its provenance
// ("live" vs "demo") so the UI can label what the user is looking at honestly.
// Every function is async so screens can be swapped to real endpoints later.

import {
  HOTSPOTS,
  WEEKLY,
  MONTHLY,
  KPIS,
  INSIGHTS,
  NOTIFICATIONS,
  REPORTS,
  BADGES,
  PROFILE,
  WASTE_REPORTS,
  CLEANUPS,
  type Hotspot,
} from "./mock-data";
import { demoForecast, type ForecastResult } from "./forecast";
import { setFailed, setSource } from "./provenance";

const BASE = (import.meta as unknown as { env: Record<string, string | undefined> }).env
  .VITE_API_BASE_URL;

/** True when no backend is configured: every number in the UI is bundled demo data. */
export const IS_DEMO_MODE = !BASE;

async function delay<T>(v: T, ms = 250): Promise<T> {
  return new Promise((r) => setTimeout(() => r(v), ms));
}

async function get<T>(path: string, fallback: T): Promise<T> {
  if (!BASE) {
    setSource(path, "demo");
    return delay(fallback);
  }
  try {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as T;
    setSource(path, "live");
    setFailed(path, false);
    return data;
  } catch (err) {
    // A configured backend is unreachable: never substitute sample data. Surface the error.
    setFailed(path, true);
    throw err;
  }
}

/**
 * Forecast. Only labelled "model" when the backend says so; otherwise a synthetic
 * demo curve (see lib/forecast.ts). No ML model is bundled with this frontend.
 */
async function forecast(h: Hotspot, horizon: 24 | 72): Promise<ForecastResult> {
  const path = "/prediction/forecast";
  if (BASE) {
    try {
      const res = await fetch(`${BASE}${path}?location=${h.id}&horizon=${horizon}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as ForecastResult;
      setSource(path, data.source === "model" ? "model" : "live");
      setFailed(path, false);
      return data;
    } catch (err) {
      setFailed(path, true);
      throw err;
    }
  }
  setSource(path, "demo");
  return delay(demoForecast(h, horizon), 180);
}

export const api = {
  hotspots: () => get("/heatmap", HOTSPOTS),
  kpis: () => get("/dashboard/kpis", KPIS),
  weekly: () => get("/statistics/weekly", WEEKLY),
  monthly: () => get("/statistics/monthly", MONTHLY),
  insights: () => get("/prediction/insights", INSIGHTS),
  notifications: () => get("/alerts", NOTIFICATIONS),
  reports: () => get("/reports", REPORTS),
  badges: () => get("/me/badges", BADGES),
  profile: () => get("/me", PROFILE),
  wasteReports: () => get("/reports/waste", WASTE_REPORTS),
  cleanups: () => get("/cleanups", CLEANUPS),
  forecast,
};

/** Endpoint paths, used as keys for provenance lookups (see useDataSource). */
export const SOURCE_KEYS = {
  hotspots: "/heatmap",
  kpis: "/dashboard/kpis",
  weekly: "/statistics/weekly",
  monthly: "/statistics/monthly",
  insights: "/prediction/insights",
  notifications: "/alerts",
  reports: "/reports",
  badges: "/me/badges",
  profile: "/me",
  waste: "/reports/waste",
  cleanups: "/cleanups",
  forecast: "/prediction/forecast",
} as const;
