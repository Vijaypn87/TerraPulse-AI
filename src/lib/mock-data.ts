// Mock data layer. Swap with real fetches by pointing api.ts at VITE_API_BASE_URL.

export type AQICategory = "good" | "moderate" | "poor" | "unhealthy";

export interface Hotspot {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  aqi: number;
  cleanliness: number; // 0-100
  population: number;
  trend: number; // -1..1
  score: number; // 0-100
  category: AQICategory;
}

export const HOTSPOTS: Hotspot[] = [
  {
    id: "1",
    name: "Delhi",
    country: "IN",
    lat: 28.6139,
    lng: 77.209,
    aqi: 268,
    cleanliness: 42,
    population: 32900000,
    trend: 0.18,
    score: 38,
    category: "unhealthy",
  },
  {
    id: "2",
    name: "Beijing",
    country: "CN",
    lat: 39.9042,
    lng: 116.4074,
    aqi: 172,
    cleanliness: 58,
    population: 21500000,
    trend: -0.08,
    score: 54,
    category: "poor",
  },
  {
    id: "3",
    name: "Los Angeles",
    country: "US",
    lat: 34.0522,
    lng: -118.2437,
    aqi: 96,
    cleanliness: 71,
    population: 12800000,
    trend: -0.02,
    score: 68,
    category: "moderate",
  },
  {
    id: "4",
    name: "London",
    country: "UK",
    lat: 51.5074,
    lng: -0.1278,
    aqi: 62,
    cleanliness: 82,
    population: 9500000,
    trend: -0.11,
    score: 78,
    category: "moderate",
  },
  {
    id: "5",
    name: "São Paulo",
    country: "BR",
    lat: -23.5505,
    lng: -46.6333,
    aqi: 118,
    cleanliness: 64,
    population: 22400000,
    trend: 0.04,
    score: 61,
    category: "poor",
  },
  {
    id: "6",
    name: "Cairo",
    country: "EG",
    lat: 30.0444,
    lng: 31.2357,
    aqi: 201,
    cleanliness: 49,
    population: 21300000,
    trend: 0.09,
    score: 45,
    category: "unhealthy",
  },
  {
    id: "7",
    name: "Tokyo",
    country: "JP",
    lat: 35.6762,
    lng: 139.6503,
    aqi: 48,
    cleanliness: 92,
    population: 37400000,
    trend: -0.05,
    score: 88,
    category: "good",
  },
  {
    id: "8",
    name: "Copenhagen",
    country: "DK",
    lat: 55.6761,
    lng: 12.5683,
    aqi: 32,
    cleanliness: 95,
    population: 1300000,
    trend: -0.03,
    score: 93,
    category: "good",
  },
  {
    id: "9",
    name: "Mumbai",
    country: "IN",
    lat: 19.076,
    lng: 72.8777,
    aqi: 184,
    cleanliness: 51,
    population: 20400000,
    trend: 0.06,
    score: 47,
    category: "poor",
  },
  {
    id: "10",
    name: "Lagos",
    country: "NG",
    lat: 6.5244,
    lng: 3.3792,
    aqi: 158,
    cleanliness: 46,
    population: 15300000,
    trend: 0.12,
    score: 44,
    category: "poor",
  },
  {
    id: "11",
    name: "New York",
    country: "US",
    lat: 40.7128,
    lng: -74.006,
    aqi: 71,
    cleanliness: 78,
    population: 19000000,
    trend: -0.04,
    score: 74,
    category: "moderate",
  },
  {
    id: "12",
    name: "Sydney",
    country: "AU",
    lat: -33.8688,
    lng: 151.2093,
    aqi: 41,
    cleanliness: 89,
    population: 5300000,
    trend: -0.01,
    score: 87,
    category: "good",
  },
];

export function aqiColor(aqi: number) {
  if (aqi <= 50) return "var(--aqi-good)";
  if (aqi <= 100) return "var(--aqi-mod)";
  if (aqi <= 150) return "var(--aqi-poor)";
  return "var(--aqi-bad)";
}

export function aqiLabel(aqi: number) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Poor";
  return "Unhealthy";
}

// Weekly / monthly trends for dashboard
export const WEEKLY = [
  { d: "Mon", aqi: 82, cleanliness: 74, noise: 58, carbon: 42 },
  { d: "Tue", aqi: 91, cleanliness: 71, noise: 62, carbon: 47 },
  { d: "Wed", aqi: 78, cleanliness: 75, noise: 55, carbon: 40 },
  { d: "Thu", aqi: 104, cleanliness: 69, noise: 66, carbon: 52 },
  { d: "Fri", aqi: 121, cleanliness: 66, noise: 71, carbon: 58 },
  { d: "Sat", aqi: 88, cleanliness: 78, noise: 52, carbon: 44 },
  { d: "Sun", aqi: 72, cleanliness: 81, noise: 48, carbon: 39 },
];

// Deterministic pseudo-random so demo series are stable between renders and SSR.
const pseudo = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

export const MONTHLY = Array.from({ length: 30 }).map((_, i) => ({
  d: `${i + 1}`,
  aqi: Math.round(70 + 40 * Math.sin(i / 3) + pseudo(i) * 20),
  green: Math.round(48 + 6 * Math.cos(i / 4) + pseudo(i + 99) * 4),
}));

export const KPIS = [
  {
    key: "health",
    label: "Environmental Health",
    value: 74,
    unit: "/100",
    delta: +2.4,
    tone: "good" as const,
  },
  {
    key: "aqi",
    label: "Air Quality Index",
    value: 92,
    unit: "AQI",
    delta: -3.1,
    tone: "moderate" as const,
  },
  {
    key: "clean",
    label: "Cleanliness Score",
    value: 78,
    unit: "/100",
    delta: +1.2,
    tone: "good" as const,
  },
  {
    key: "noise",
    label: "Noise Level",
    value: 62,
    unit: "dB",
    delta: +0.8,
    tone: "moderate" as const,
  },
  {
    key: "traffic",
    label: "Traffic Pollution",
    value: 118,
    unit: "idx",
    delta: +4.6,
    tone: "poor" as const,
  },
  { key: "green", label: "Green Cover", value: 46, unit: "%", delta: +0.3, tone: "good" as const },
  {
    key: "carbon",
    label: "Carbon Emissions",
    value: 4.2,
    unit: "kt/d",
    delta: -1.4,
    tone: "good" as const,
  },
];

export interface Insight {
  id: string;
  title: string;
  kind: string;
  confidence: number;
  summary: string;
  series: { x: string; y: number }[];
}
export const INSIGHTS: Insight[] = [
  {
    id: "i1",
    title: "Pollution Forecast",
    kind: "72h forecast",
    confidence: 0.92,
    summary: "Illustrative scenario: PM2.5 rising about 18% in downtown corridors.",
    series: Array.from({ length: 24 }).map((_, i) => ({
      x: `${i}h`,
      y: Math.round(60 + 30 * Math.sin(i / 4) + i),
    })),
  },
  {
    id: "i2",
    title: "AQI Prediction",
    kind: "trend projection",
    confidence: 0.87,
    summary: "Illustrative scenario: weekly AQI trending downward.",
    series: Array.from({ length: 14 }).map((_, i) => ({
      x: `d${i}`,
      y: Math.round(110 - i * 3 + pseudo(i + 17) * 10),
    })),
  },
  {
    id: "i3",
    title: "Cleanliness Trend",
    kind: "computer vision",
    confidence: 0.81,
    summary: "Waste hotspots dropped 12% after Sector 4 cleanup drive.",
    series: Array.from({ length: 12 }).map((_, i) => ({
      x: `w${i}`,
      y: 60 + i * 1.5 + pseudo(i + 17) * 4,
    })),
  },
  {
    id: "i4",
    title: "Weather Impact",
    kind: "coupled model",
    confidence: 0.78,
    summary: "Illustrative scenario: rain bringing AQI relief of ~22 points for 36 hours.",
    series: Array.from({ length: 24 }).map((_, i) => ({
      x: `${i}h`,
      y: 50 + 25 * Math.cos(i / 3),
    })),
  },
  {
    id: "i5",
    title: "Green Cover Analysis",
    kind: "satellite ndvi",
    confidence: 0.94,
    summary: "Canopy up 0.6% YoY across monitored districts.",
    series: Array.from({ length: 12 }).map((_, i) => ({
      x: `m${i}`,
      y: 42 + i * 0.4 + pseudo(i + 17),
    })),
  },
  {
    id: "i6",
    title: "Community Risk Score",
    kind: "composite index",
    confidence: 0.85,
    summary: "3 neighborhoods entered elevated risk. Recommend targeted alerts.",
    series: Array.from({ length: 10 }).map((_, i) => ({
      x: `n${i}`,
      y: 30 + pseudo(i * 7 + 3) * 40,
    })),
  },
];

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  level: "info" | "warn" | "alert";
  kind: "aqi" | "garbage" | "fire" | "traffic" | "weather";
  time: string;
}
export const NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    title: "AQI spike detected",
    body: "Sector 12 crossed 180 AQI — sensitive groups avoid outdoor activity.",
    level: "alert",
    kind: "aqi",
    time: "2m ago",
  },
  {
    id: "n2",
    title: "Garbage hotspot reported",
    body: "3 citizen reports near Riverside Park in the past hour.",
    level: "warn",
    kind: "garbage",
    time: "18m ago",
  },
  {
    id: "n3",
    title: "Wildfire smoke inbound",
    body: "PM2.5 haze arriving in ~6h from the north.",
    level: "alert",
    kind: "fire",
    time: "42m ago",
  },
  {
    id: "n4",
    title: "Heavy traffic pollution",
    body: "NO₂ elevated on Highway 4 during rush hour.",
    level: "warn",
    kind: "traffic",
    time: "1h ago",
  },
  {
    id: "n5",
    title: "Weather warning",
    body: "Temperature inversion tonight — expect AQI worsening after 10pm.",
    level: "info",
    kind: "weather",
    time: "3h ago",
  },
];

export interface Report {
  id: string;
  type: "Litter" | "Smoke" | "Water" | "Noise" | "Other";
  severity: "Low" | "Medium" | "High";
  description: string;
  location: string;
  status: "Pending" | "Verified" | "Resolved" | "Rejected";
  date: string;
}
export const REPORTS: Report[] = [
  {
    id: "r1",
    type: "Litter",
    severity: "Medium",
    description: "Overflowing bins on 5th Ave.",
    location: "Downtown",
    status: "Verified",
    date: "2 days ago",
  },
  {
    id: "r2",
    type: "Smoke",
    severity: "High",
    description: "Industrial smoke plume near river.",
    location: "Eastside",
    status: "Pending",
    date: "5h ago",
  },
  {
    id: "r3",
    type: "Water",
    severity: "High",
    description: "Discoloration in canal near Sector 9.",
    location: "Sector 9",
    status: "Resolved",
    date: "1 week ago",
  },
];

export const BADGES = [
  { id: "b1", name: "Clean Streets", desc: "10 verified litter reports", earned: true },
  { id: "b2", name: "Air Guardian", desc: "First AQI alert responded", earned: true },
  { id: "b3", name: "Community Voice", desc: "50 upvotes on reports", earned: true },
  { id: "b4", name: "Green Advocate", desc: "Plant 5 trees", earned: false },
  { id: "b5", name: "Data Contributor", desc: "Upload 25 photos", earned: false },
];

export const PROFILE = {
  name: "Alex Rivera",
  handle: "@alex.rivera",
  role: "Community Volunteer",
  city: "San Francisco, CA",
  score: 2148,
  rank: 42,
  reports: 27,
  streak: 14,
};

// ---------------------------------------------------------------------------
// Community + hotspot demo data (all DEMONSTRATION data — not real measurements)
// ---------------------------------------------------------------------------

export interface WasteReport {
  id: string;
  title: string;
  lat: number;
  lng: number;
  city: string;
  severity: "Low" | "Medium" | "High";
  status: "Pending" | "Verified" | "Resolved";
  reportedBy: string;
  ago: string;
  upvotes: number;
}

export const WASTE_REPORTS: WasteReport[] = [
  {
    id: "w1",
    title: "Overflowing bins along the canal",
    lat: 28.66,
    lng: 77.23,
    city: "Delhi",
    severity: "High",
    status: "Verified",
    reportedBy: "Citizen",
    ago: "3h ago",
    upvotes: 41,
  },
  {
    id: "w2",
    title: "Illegal dumping near riverbank",
    lat: 19.1,
    lng: 72.88,
    city: "Mumbai",
    severity: "High",
    status: "Pending",
    ago: "5h ago",
    reportedBy: "Citizen",
    upvotes: 18,
  },
  {
    id: "w3",
    title: "Plastic accumulation at the shoreline",
    lat: 6.5,
    lng: 3.38,
    city: "Lagos",
    severity: "Medium",
    status: "Verified",
    reportedBy: "NGO partner",
    ago: "1d ago",
    upvotes: 27,
  },
  {
    id: "w4",
    title: "Construction debris on public road",
    lat: 30.05,
    lng: 31.25,
    city: "Cairo",
    severity: "Medium",
    status: "Pending",
    reportedBy: "Citizen",
    ago: "2d ago",
    upvotes: 9,
  },
  {
    id: "w5",
    title: "Park litter after weekend event",
    lat: 51.51,
    lng: -0.12,
    city: "London",
    severity: "Low",
    status: "Resolved",
    reportedBy: "Volunteer",
    ago: "4d ago",
    upvotes: 12,
  },
  {
    id: "w6",
    title: "Market waste not collected",
    lat: -23.55,
    lng: -46.64,
    city: "São Paulo",
    severity: "High",
    status: "Verified",
    reportedBy: "Citizen",
    ago: "6h ago",
    upvotes: 33,
  },
  {
    id: "w7",
    title: "Storm-drain blockage",
    lat: 34.06,
    lng: -118.25,
    city: "Los Angeles",
    severity: "Low",
    status: "Resolved",
    reportedBy: "Volunteer",
    ago: "1w ago",
    upvotes: 6,
  },
  {
    id: "w8",
    title: "Beach cleanup follow-up needed",
    lat: -33.87,
    lng: 151.21,
    city: "Sydney",
    severity: "Low",
    status: "Pending",
    reportedBy: "Citizen",
    ago: "2d ago",
    upvotes: 4,
  },
];

export interface Cleanup {
  id: string;
  title: string;
  city: string;
  date: string;
  volunteers: number;
  status: "Upcoming" | "Completed";
  kgCollected?: number;
}

export const CLEANUPS: Cleanup[] = [
  {
    id: "c1",
    title: "Yamuna riverbank sweep",
    city: "Delhi",
    date: "Sat 09:00",
    volunteers: 64,
    status: "Upcoming",
  },
  {
    id: "c2",
    title: "Lagos shoreline plastics drive",
    city: "Lagos",
    date: "Sun 08:30",
    volunteers: 38,
    status: "Upcoming",
  },
  {
    id: "c3",
    title: "Hyde Park litter patrol",
    city: "London",
    date: "Last Sat",
    volunteers: 22,
    status: "Completed",
    kgCollected: 310,
  },
  {
    id: "c4",
    title: "Bondi dune restoration",
    city: "Sydney",
    date: "Last Sun",
    volunteers: 41,
    status: "Completed",
    kgCollected: 520,
  },
];

/**
 * Approximate PM2.5 (µg/m³) from a US-EPA AQI value using the published
 * linear breakpoint table (2024). This is a unit conversion of demo AQI, not a measurement.
 */
export function aqiToPm25(aqi: number): number {
  const bp: [number, number, number, number][] = [
    [0, 50, 0, 9.0],
    [51, 100, 9.1, 35.4],
    [101, 150, 35.5, 55.4],
    [151, 200, 55.5, 125.4],
    [201, 300, 125.5, 225.4],
    [301, 500, 225.5, 325.4],
  ];
  const row = bp.find(([lo, hi]) => aqi >= lo && aqi <= hi) ?? bp[bp.length - 1];
  const [iLo, iHi, cLo, cHi] = row;
  return Math.round((cLo + ((aqi - iLo) * (cHi - cLo)) / (iHi - iLo)) * 10) / 10;
}
