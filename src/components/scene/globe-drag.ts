import { sceneInput } from "./store";

/**
 * Manual Earth rotation. Writes drag offsets into `sceneInput`; the scene adds them on top of the
 * scroll-driven pose, so scroll transitions keep working and simply "absorb" the user's rotation.
 *
 *  - Surfaces (hero pad, Live Earth zone): any pointer type, element-level listeners.
 *  - Window (mouse/pen only): drag anywhere over the visible planet that isn't UI.
 *    Touch is deliberately NOT captured page-wide, so the page always scrolls normally.
 */

const MAX_PITCH = 1.1; // rad
const MAX_VEL = 6; // rad/s

const drag = { id: -1, x: 0, y: 0, t: 0, lastMove: 0 };

function begin(e: PointerEvent) {
  drag.id = e.pointerId;
  drag.x = e.clientX;
  drag.y = e.clientY;
  drag.t = drag.lastMove = performance.now();
  sceneInput.dragging = true;
  sceneInput.dragVelYaw = 0;
  sceneInput.dragVelPitch = 0;
  document.documentElement.classList.add("tp-dragging");
  window.getSelection()?.removeAllRanges();
}

function move(e: PointerEvent) {
  if (!sceneInput.dragging || e.pointerId !== drag.id) return;
  const now = performance.now();
  const dt = Math.max(1, now - drag.t) / 1000;
  const dx = e.clientX - drag.x;
  const dy = e.clientY - drag.y;
  // The surface follows the pointer: 1 radius of travel ≈ 1 radian of rotation.
  const r = Math.max(120, sceneInput.earth.r || 260);
  const dYaw = -dx / r;
  const dPitch = dy / r;
  sceneInput.dragYaw += dYaw;
  sceneInput.dragPitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, sceneInput.dragPitch + dPitch));
  const clamp = (v: number) => Math.max(-MAX_VEL, Math.min(MAX_VEL, v));
  sceneInput.dragVelYaw = sceneInput.dragVelYaw * 0.55 + clamp(dYaw / dt) * 0.45;
  sceneInput.dragVelPitch = sceneInput.dragVelPitch * 0.55 + clamp(dPitch / dt) * 0.45;
  drag.x = e.clientX;
  drag.y = e.clientY;
  drag.t = drag.lastMove = now;
}

function end(e: PointerEvent) {
  if (e.pointerId !== drag.id) return;
  drag.id = -1;
  sceneInput.dragging = false;
  document.documentElement.classList.remove("tp-dragging");
  // Pointer rested before release → no fling. Reduced motion → no inertia at all.
  if (performance.now() - drag.lastMove > 90 || sceneInput.reducedMotion) {
    sceneInput.dragVelYaw = 0;
    sceneInput.dragVelPitch = 0;
  }
}

/** Make an element a drag surface for the Earth. Returns a cleanup function. */
export function attachGlobeSurface(el: HTMLElement): () => void {
  const down = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    begin(e);
    el.setPointerCapture(e.pointerId);
  };
  const up = (e: PointerEvent) => {
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    end(e);
  };
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
  return () => {
    el.removeEventListener("pointerdown", down);
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerup", up);
    el.removeEventListener("pointercancel", up);
    if (drag.id !== -1) {
      drag.id = -1;
      sceneInput.dragging = false;
      document.documentElement.classList.remove("tp-dragging");
    }
  };
}

// Anything interactive or text-bearing keeps its normal behaviour (click, select, focus).
const BLOCK =
  "a,button,input,select,textarea,label,summary,p,h1,h2,h3,h4,li,dt,dd," +
  '[role="radio"],[role="option"],[role="application"],[role="dialog"],[role="img"],' +
  "[data-no-globe],[data-globe-zone],[data-globe-pad],.glass,.glass-strong,.maplibregl-map," +
  ".recharts-wrapper,header,nav,footer,#hotspots";

function overPlanet(e: PointerEvent): boolean {
  const g = sceneInput.earth;
  if (!g.active || g.r <= 0) return false;
  return Math.hypot(e.clientX - g.cx, e.clientY - g.cy) <= g.r;
}

function canStart(e: PointerEvent): boolean {
  if (e.pointerType === "touch") return false;
  const t = e.target as Element | null;
  if (!t || t.closest(BLOCK)) return false;
  return overPlanet(e);
}

/** Page-wide mouse/pen dragging over the planet + grab cursor. Returns a cleanup function. */
export function installWindowGlobeDrag(): () => void {
  let hoverRaf = 0;
  let hovering = false;
  const setCursor = (on: boolean) => {
    if (on === hovering) return;
    hovering = on;
    document.body.style.cursor = on ? "grab" : "";
  };

  const down = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return; // primary button only
    if (!canStart(e)) return;
    begin(e);
    document.body.style.cursor = "grabbing";
  };
  const mv = (e: PointerEvent) => {
    if (sceneInput.dragging && e.pointerId === drag.id) {
      move(e);
      return;
    }
    if (e.pointerType === "touch" || hoverRaf) return;
    hoverRaf = requestAnimationFrame(() => {
      hoverRaf = 0;
      setCursor(canStart(e));
    });
  };
  const up = (e: PointerEvent) => {
    if (e.pointerId !== drag.id) return;
    end(e);
    document.body.style.cursor = "";
    hovering = false;
  };

  window.addEventListener("pointerdown", down);
  window.addEventListener("pointermove", mv, { passive: true });
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
  return () => {
    cancelAnimationFrame(hoverRaf);
    window.removeEventListener("pointerdown", down);
    window.removeEventListener("pointermove", mv);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", up);
    document.body.style.cursor = "";
    document.documentElement.classList.remove("tp-dragging");
    sceneInput.dragging = false;
  };
}
