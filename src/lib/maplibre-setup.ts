import * as maplibregl from "maplibre-gl";
// MapLibre GL 6 resolves its web worker relative to its own module URL, which breaks once the
// library is bundled. Import the worker as an emitted asset and point MapLibre at it explicitly.
// This is an explicit function call (not a bare side-effect import) so it survives tree-shaking
// under package.json "sideEffects": false and stays inside the lazily loaded map chunks.
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";

let configured = false;
export function configureMaplibre() {
  if (configured) return;
  configured = true;
  maplibregl.setWorkerUrl(workerUrl);
}
