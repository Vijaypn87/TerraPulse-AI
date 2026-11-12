import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Hotspot } from "@/lib/mock-data";
import { hasWebGL, useMounted } from "@/hooks/use-env";

// three + R3F + drei are heavy: they only load on the client, after first paint.
const EarthScene = lazy(() => import("./earth-scene"));

/** Static, no-WebGL stand-in: the Blue Marble texture as a lit disc. */
function EarthFallback() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(60% 60% at 70% 45%, color-mix(in oklab, var(--eco-strong) 35%, transparent), transparent 70%)",
      }}
    >
      <div
        className="absolute right-[-12vmin] top-1/2 aspect-square w-[78vmin] -translate-y-1/2 rounded-full"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 30%, transparent 0 40%, rgb(0 0 0 / 0.75) 85%), url(/textures/earth-blue-marble.jpg)",
          backgroundSize: "cover, 200% 100%",
          backgroundPosition: "center, 30% 50%",
          boxShadow:
            "0 0 120px -10px color-mix(in oklab, var(--eco) 45%, transparent), inset 0 0 60px rgb(0 0 0 / 0.6)",
        }}
      />
    </div>
  );
}

export function EarthCanvas({
  hotspots,
  eventSource,
  forceFallback,
}: {
  hotspots: Hotspot[];
  eventSource: HTMLElement | null;
  forceFallback?: boolean;
}) {
  const mounted = useMounted();
  const [supported, setSupported] = useState(true);
  const [lost, setLost] = useState(false);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (mounted) setSupported(hasWebGL());
  }, [mounted]);

  const onReady = useCallback(() => setReady(true), []);
  const onLost = useCallback(() => setLost(true), []);

  if (!mounted) return null;
  if (!supported || lost || forceFallback) return <EarthFallback />;

  return (
    <>
      <Suspense fallback={null}>
        <EarthScene
          hotspots={hotspots}
          eventSource={eventSource}
          onReady={onReady}
          onLost={onLost}
          paused={!visible}
          onVisible={setVisible}
        />
      </Suspense>
      <AnimatePresence>
        {!ready && (
          <motion.div
            key="loader"
            role="status"
            aria-live="polite"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[60] grid place-items-center bg-ink"
          >
            <div className="text-center">
              <div className="font-display text-3xl tracking-tight">TerraPulse</div>
              <div className="eyebrow mt-3">Calibrating planet</div>
              <div className="mx-auto mt-5 h-px w-40 overflow-hidden bg-foreground/10">
                <motion.div
                  className="h-full w-1/3 bg-lime"
                  animate={{ x: ["-100%", "300%"] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
