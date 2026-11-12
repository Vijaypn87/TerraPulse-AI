import { MathUtils } from "three";
import { sceneInput } from "./store";

export const SECTION_IDS = [
  "overview",
  "pulse",
  "live-earth",
  "intelligence",
  "predictions",
  "hotspots",
  "community",
  "finale",
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

/** Everything the scroll story animates. All scalars are interpolated between sections. */
export interface Pose {
  x: number; // earth offset (world units); +x = right of centre
  y: number;
  z: number; // camera distance
  lon: number; // longitude (deg) rotated to face the camera
  lat: number; // latitude (deg) tilted toward the camera
  sun: number; // sun azimuth (deg)
  markers: number; // 0..1 monitoring-location markers
  columns: number; // 0..1 pollution columns
  heat: number; // 0..1 heatmap overlay
  arcs: number; // 0..1 data-flow arcs
  night: number; // 0..1 bias toward night-side city lights
  dim: number; // 0..1 overall brightness
  follow: number; // 0..1 follow the selected location
  spin: number; // idle rotation speed multiplier
}

// Desktop story. The Earth always sits where the copy is not.
export const POSES: Record<SectionId, Pose> = {
  overview: {
    x: 1.3,
    y: -0.05,
    z: 5.7,
    lon: 15,
    lat: 18,
    sun: 35,
    markers: 0.7,
    columns: 0,
    heat: 0,
    arcs: 0,
    night: 0,
    dim: 1,
    follow: 0,
    spin: 1,
  },
  pulse: {
    x: -1.65,
    y: 0,
    z: 4.5,
    lon: 78,
    lat: 22,
    sun: 20,
    markers: 1,
    columns: 1,
    heat: 0,
    arcs: 0,
    night: 0.15,
    dim: 1,
    follow: 0,
    spin: 0.4,
  },
  "live-earth": {
    x: 1.15,
    y: 0,
    z: 5.1,
    lon: 10,
    lat: 20,
    sun: 55,
    markers: 1,
    columns: 0.55,
    heat: 0.25,
    arcs: 0,
    night: 0,
    dim: 1,
    follow: 1,
    spin: 0,
  },
  intelligence: {
    x: 0,
    y: -3.05,
    z: 5.2,
    lon: -40,
    lat: 28,
    sun: 150,
    markers: 0.5,
    columns: 0,
    heat: 0,
    arcs: 1,
    night: 0.85,
    dim: 0.8,
    follow: 0,
    spin: 0.6,
  },
  predictions: {
    x: 2.35,
    y: 0.15,
    z: 6.3,
    lon: 85,
    lat: 20,
    sun: 10,
    markers: 0.4,
    columns: 0,
    heat: 1,
    arcs: 0.3,
    night: 0.1,
    dim: 0.55,
    follow: 0,
    spin: 0.3,
  },
  hotspots: {
    x: 0,
    y: -4.2,
    z: 6.8,
    lon: 70,
    lat: 24,
    sun: 60,
    markers: 0,
    columns: 0,
    heat: 0.7,
    arcs: 0,
    night: 0,
    dim: 0.18,
    follow: 0,
    spin: 0.2,
  },
  community: {
    x: -2.2,
    y: 0.1,
    z: 6.4,
    lon: -20,
    lat: 15,
    sun: 40,
    markers: 0.8,
    columns: 0,
    heat: 0,
    arcs: 0,
    night: 0.3,
    dim: 0.5,
    follow: 0,
    spin: 0.5,
  },
  finale: {
    x: 0,
    y: -2.35,
    z: 4.9,
    lon: 5,
    lat: 30,
    sun: 120,
    markers: 0.5,
    columns: 0,
    heat: 0,
    arcs: 0.6,
    night: 0.55,
    dim: 1,
    follow: 0,
    spin: 0.8,
  },
};

const KEYS = Object.keys(POSES.overview) as (keyof Pose)[];
const smooth = (t: number) => t * t * (3 - 2 * t);
// Hold the pose while a section is being read; travel in the gap between sections.
const hold = (f: number) => smooth(MathUtils.clamp((f - 0.28) / 0.44, 0, 1));

/** Continuous pose for the current scroll position (writes into `out`). */
export function samplePose(out: Pose, narrow: boolean): Pose {
  const c = sceneInput.centers;
  const s = sceneInput.scrollY + sceneInput.viewportH * 0.5;
  if (c.length < 2) {
    Object.assign(out, POSES.overview);
  } else {
    let i = 0;
    while (i < c.length - 2 && s > c[i + 1]) i++;
    const f = MathUtils.clamp((s - c[i]) / Math.max(1, c[i + 1] - c[i]), 0, 1);
    const t = hold(f);
    const a = POSES[SECTION_IDS[i]];
    const b = POSES[SECTION_IDS[i + 1]];
    for (const k of KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
  }
  if (narrow) {
    // Phones: Earth centred and pushed up/back; copy sits over it with a scrim.
    out.x = 0;
    out.y = out.y + 1.0;
    out.z = out.z + 1.6;
    out.dim = out.dim * 0.6;
  }
  return out;
}
