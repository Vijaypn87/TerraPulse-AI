import { useEffect, useState } from "react";
import Lenis from "lenis";
import { SECTION_IDS, type SectionId } from "./poses";
import { installWindowGlobeDrag } from "./globe-drag";
import { sceneInput } from "./store";

let activeLenis: Lenis | null = null;

/**
 * Wires DOM → sceneInput (scroll, pointer, viewport, section geometry) and Lenis smooth scroll.
 * Everything registered here is torn down on unmount.
 */
export function useStoryInputs(reducedMotion: boolean) {
  const [active, setActive] = useState<SectionId>("overview");

  useEffect(() => {
    sceneInput.reducedMotion = reducedMotion;

    const measure = () => {
      sceneInput.viewportW = window.innerWidth;
      sceneInput.viewportH = window.innerHeight;
      sceneInput.centers = SECTION_IDS.map((id) => {
        const el = document.getElementById(id);
        if (!el) return 0;
        const r = el.getBoundingClientRect();
        return r.top + window.scrollY + r.height / 2;
      });
    };

    const updateActive = () => {
      const mid = window.scrollY + window.innerHeight * 0.4;
      let cur: SectionId = SECTION_IDS[0];
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= mid) cur = id;
      }
      setActive((prev) => (prev === cur ? prev : cur));
    };

    const onScroll = () => {
      sceneInput.scrollY = window.scrollY;
      updateActive();
    };

    const onPointer = (e: PointerEvent) => {
      sceneInput.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      sceneInput.pointerY = -((e.clientY / window.innerHeight) * 2 - 1);
    };

    measure();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("pointermove", onPointer, { passive: true });

    // Section heights change as content / fonts load.
    const ro = new ResizeObserver(() => {
      measure();
      updateActive();
    });
    ro.observe(document.body);
    document.fonts?.ready.then(measure).catch(() => undefined);

    const removeGlobeDrag = installWindowGlobeDrag();

    let lenis: Lenis | null = null;
    let raf = 0;
    if (!reducedMotion) {
      lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true });
      activeLenis = lenis;
      const loop = (t: number) => {
        lenis?.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      lenis?.destroy();
      activeLenis = null;
      removeGlobeDrag();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      window.removeEventListener("pointermove", onPointer);
      sceneInput.centers = [];
    };
  }, [reducedMotion]);

  return active;
}

/** Smooth anchor scroll that cooperates with Lenis (falls back to native). */
export function scrollToSection(id: string, reduced: boolean) {
  const el = document.getElementById(id);
  if (!el) return;
  if (activeLenis && !reduced) {
    activeLenis.scrollTo(el, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
  } else {
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "auto" });
  }
  history.replaceState(null, "", `#${id}`);
}

/** Smooth scroll back to the very top (hero + Earth). */
export function scrollToTop(reduced: boolean) {
  if (activeLenis && !reduced) {
    activeLenis.scrollTo(0, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
  } else {
    window.scrollTo({ top: 0, behavior: "auto" });
  }
  history.replaceState(null, "", window.location.pathname + window.location.search);
}
