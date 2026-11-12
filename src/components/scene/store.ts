import { useSyncExternalStore } from "react";

/**
 * Mutable, per-frame inputs for the 3D scene. Written by DOM listeners, read inside
 * useFrame. Deliberately NOT React state: updating these must never re-render React.
 */
export const sceneInput = {
  scrollY: 0,
  viewportW: 1280,
  viewportH: 800,
  pointerX: 0, // -1..1
  pointerY: 0,
  dragYaw: 0, // radians, user drag on Live Earth
  dragPitch: 0,
  dragVelYaw: 0,
  dragVelPitch: 0,
  /** Earth silhouette on screen (CSS px), written every frame by the scene; used for hit-testing drags. */
  earth: { cx: 0, cy: 0, r: 0, active: false },
  dragging: false,
  reducedMotion: false,
  /** document-relative vertical centres of the story sections, in SECTION_IDS order */
  centers: [] as number[],
};

/** Low-frequency UI state shared between the DOM overlay and the scene (selection, layer). */
export type Layer = "aqi" | "pm25" | "heat";
interface SelectionState {
  selectedId: string | null;
  layer: Layer;
}
let state: SelectionState = { selectedId: null, layer: "aqi" };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const selection = {
  get: () => state,
  set(patch: Partial<SelectionState>) {
    state = { ...state, ...patch };
    emit();
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useSelection(): SelectionState {
  return useSyncExternalStore(selection.subscribe, selection.get, selection.get);
}
