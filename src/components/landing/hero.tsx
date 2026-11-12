import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { attachGlobeSurface } from "@/components/scene/globe-drag";
import { useReducedMotion } from "@/hooks/use-env";
import { CtaScroll } from "./primitives";

const ease = [0.16, 1, 0.3, 1] as const;

function Line({ children, delay }: { children: string; delay: number }) {
  const reduced = useReducedMotion();
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <motion.span
        className="block"
        initial={reduced ? false : { y: "105%" }}
        animate={{ y: 0 }}
        transition={{ duration: 1.1, delay, ease }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/** Drag surface over the hero planet. Phones: top band only (touch-none); lg+: right half. */
function HeroGlobePad() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => (ref.current ? attachGlobeSurface(ref.current) : undefined), []);
  return (
    <div
      ref={ref}
      data-globe-pad
      aria-hidden
      className="absolute left-0 top-0 z-20 h-[46%] w-full cursor-grab touch-none lg:left-auto lg:right-0 lg:h-full lg:w-[48%] lg:touch-pan-y"
    />
  );
}

export function Hero() {
  const reduced = useReducedMotion();
  const fade = (delay: number) => ({
    initial: reduced ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1, delay, ease },
  });

  return (
    <section
      id="overview"
      aria-labelledby="hero-title"
      className="relative flex min-h-[100svh] items-end pb-16 pt-32 md:items-center md:pb-0"
    >
      {/* legibility scrim: stronger on phones where the planet sits behind the copy */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/25 md:bg-[linear-gradient(90deg,var(--ink)_0%,color-mix(in_oklab,var(--ink)_60%,transparent)_38%,transparent_62%)]" />

      <HeroGlobePad />

      <div className="relative mx-auto w-full max-w-7xl px-5 md:px-10">
        <motion.p {...fade(0.9)} className="eyebrow mb-7 flex items-center gap-3">
          <span className="h-px w-8 bg-lime" />
          Intelligence for a Living Planet
        </motion.p>

        <h1
          id="hero-title"
          className="max-w-[12ch] text-[clamp(3.2rem,7.2vw,7.4rem)] leading-[0.92] tracking-[-0.025em] md:max-w-[10ch]"
        >
          <Line delay={0.55}>Understand</Line>
          <Line delay={0.67}>Our Planet.</Line>
          <span className="mt-2 block text-gradient-eco">
            <Line delay={0.85}>Protect Its</Line>
            <Line delay={0.97}>Future.</Line>
          </span>
        </h1>

        <motion.p
          {...fade(1.35)}
          className="mt-8 max-w-md text-[17px] leading-relaxed text-foreground/75"
        >
          An intelligent environmental platform transforming real-world environmental data into
          actionable insights.
        </motion.p>

        <motion.div {...fade(1.5)} className="mt-9 flex flex-wrap items-center gap-3">
          <CtaScroll to="pulse">Explore TerraPulse</CtaScroll>
          <CtaScroll to="live-earth" variant="ghost">
            Explore Live Earth
          </CtaScroll>
        </motion.div>

        <motion.div {...fade(1.7)} className="mt-12 flex flex-wrap items-center gap-3">
          <span className="eyebrow hidden sm:inline">Scroll to descend</span>
        </motion.div>
      </div>

      <motion.div
        aria-hidden
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 md:block"
      >
        <div className="relative h-12 w-px overflow-hidden bg-foreground/20">
          <motion.span
            className="absolute inset-x-0 top-0 h-4 bg-lime"
            animate={reduced ? undefined : { y: [-16, 48] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
}
