import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-env";
import { cn } from "@/lib/utils";
import { Reveal, SectionLabel } from "./primitives";

/** Pointer-reactive 3D tilt wrapper (pure CSS 3D — no extra WebGL context). */
function Tilt({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 18 });
  const sy = useSpring(my, { stiffness: 120, damping: 18 });
  const rotY = useTransform(sx, [-0.5, 0.5], [-14, 14]);
  const rotX = useTransform(sy, [-0.5, 0.5], [10, -10]);

  return (
    <div
      ref={ref}
      className={cn("[perspective:1100px]", className)}
      onPointerMove={(e) => {
        if (reduced || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      <motion.div
        style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
        className="h-full w-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

/* 1 — stacked data layers */
function MonitoringArt() {
  const layers = [
    { z: 0, label: "Raw signal" },
    { z: 46, label: "Cleaned" },
    { z: 92, label: "Fused" },
    { z: 138, label: "Insight" },
  ];
  return (
    // The stack is drawn at a fixed 256px; --tp-s scales it (all three axes, so the layer spacing
    // scales with it) to the width of its column: ~375px footprint at 1.0.
    <Tilt className="mx-auto h-[16rem] w-full max-w-md min-[375px]:h-[19rem] min-[430px]:h-[22rem] md:h-[19rem] lg:h-[22rem]">
      <div className="relative h-full w-full [transform-style:preserve-3d]">
        <div
          className="absolute left-1/2 top-1/2 h-64 w-64 [--tp-s:0.72] [transform-style:preserve-3d] min-[375px]:[--tp-s:0.85] min-[430px]:[--tp-s:1] md:[--tp-s:0.78] lg:[--tp-s:1]"
          style={{
            // Centre once (inline transform). A second -translate-1/2 class used to stack on top of this
            // and pushed the whole diagram ~130px up and left, out of its box.
            transform:
              "translate(-50%,-50%) scale3d(var(--tp-s),var(--tp-s),var(--tp-s)) rotateX(62deg) rotateZ(-34deg)",
          }}
        >
          {layers.map((l, i) => (
            <div
              key={l.label}
              className="tp-layer absolute inset-0 rounded-md border border-foreground/20"
              style={
                {
                  "--z": l.z,
                  background:
                    i === layers.length - 1
                      ? "linear-gradient(135deg, color-mix(in oklab, var(--lime) 30%, transparent), color-mix(in oklab, var(--eco) 12%, transparent))"
                      : "linear-gradient(135deg, color-mix(in oklab, var(--eco) 12%, transparent), color-mix(in oklab, white 2%, transparent))",
                  backdropFilter: "blur(2px)",
                } as React.CSSProperties
              }
            >
              <div
                className="absolute inset-0 opacity-50"
                style={{
                  backgroundImage:
                    "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
                  backgroundSize: "30px 30px",
                }}
              />
              {Array.from({ length: i === 0 ? 14 : i === 1 ? 8 : i === 2 ? 4 : 1 }).map((_, k) => (
                <span
                  key={k}
                  className="absolute h-1.5 w-1.5 rounded-full bg-lime"
                  style={{
                    left: `${((k * 37 + i * 19) % 88) + 4}%`,
                    top: `${((k * 53 + i * 31) % 84) + 6}%`,
                    boxShadow: "0 0 12px var(--lime)",
                    opacity: i === layers.length - 1 ? 1 : 0.7,
                  }}
                />
              ))}
              <span className="absolute -right-2 top-0 origin-left translate-x-full font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground [transform:rotateZ(34deg)_rotateX(-62deg)]">
                {l.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Tilt>
  );
}

/* 2 — forecast ribbon */
function PredictiveArt() {
  const reduced = useReducedMotion();
  return (
    <Tilt className="mx-auto h-[22rem] w-full max-w-md">
      <div className="relative h-full w-full [transform-style:preserve-3d]">
        <div
          className="absolute inset-x-0 top-[14%] h-[70%] [transform-style:preserve-3d]"
          style={{ transform: "rotateX(48deg) rotateZ(-8deg)" }}
        >
          <div
            className="absolute inset-0 rounded-md border border-foreground/15"
            style={{
              backgroundImage:
                "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              background:
                "linear-gradient(135deg, color-mix(in oklab, var(--eco) 10%, transparent), transparent)",
            }}
          />
          <svg
            viewBox="0 0 400 220"
            className="absolute inset-0 h-full w-full overflow-visible"
            aria-hidden
          >
            <defs>
              <linearGradient id="band" x1="0" x2="1">
                <stop offset="0" stopColor="var(--lime)" stopOpacity="0" />
                <stop offset="1" stopColor="var(--lime)" stopOpacity="0.32" />
              </linearGradient>
            </defs>
            <polygon points="200,118 400,40 400,190 200,128" fill="url(#band)" />
            <motion.path
              d="M0 150 C40 120 70 170 110 132 S170 96 200 120"
              fill="none"
              stroke="var(--foreground)"
              strokeWidth="2.2"
              strokeLinecap="round"
              initial={reduced ? false : { pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, ease: "easeOut" }}
            />
            <motion.path
              d="M200 120 C250 90 300 130 400 90"
              fill="none"
              stroke="var(--lime)"
              strokeWidth="2.2"
              strokeDasharray="6 7"
              strokeLinecap="round"
              initial={reduced ? false : { pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, delay: 1.2, ease: "easeOut" }}
            />
            <line
              x1="200"
              y1="10"
              x2="200"
              y2="210"
              stroke="var(--foreground)"
              strokeOpacity="0.3"
              strokeDasharray="2 5"
            />
            <circle cx="200" cy="120" r="5" fill="var(--lime)" />
          </svg>
          {/* lifted "now" marker */}
          <div
            className="absolute left-1/2 top-[48%] h-16 w-px bg-gradient-to-b from-lime to-transparent"
            style={{ transform: "translateZ(40px) rotateX(-90deg)", transformOrigin: "bottom" }}
          />
        </div>
      </div>
    </Tilt>
  );
}

/* 3 — community network */
function CommunityArt() {
  const nodes = Array.from({ length: 9 }).map((_, i) => {
    const a = (i / 9) * Math.PI * 2;
    const r = i % 2 ? 78 : 118;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r, h: 22 + ((i * 17) % 40) };
  });
  return (
    <Tilt className="mx-auto h-[22rem] w-full max-w-md">
      <div className="relative h-full w-full [transform-style:preserve-3d]">
        <div
          className="absolute left-1/2 top-1/2 h-0 w-0 [transform-style:preserve-3d]"
          style={{ transform: "rotateX(64deg)" }}
        >
          {[70, 120, 170].map((r, i) => (
            <span
              key={r}
              className="tp-ripple absolute rounded-full border border-eco/40"
              style={{
                width: r * 2,
                height: r * 2,
                left: -r,
                top: -r,
                animationDelay: `${i * 0.8}s`,
              }}
            />
          ))}
          {nodes.map((n, i) => (
            <div
              key={i}
              className="absolute [transform-style:preserve-3d]"
              style={{ transform: `translate3d(${n.x}px, ${n.y}px, 0)` }}
            >
              <span
                className="absolute left-0 top-0 w-px origin-bottom bg-gradient-to-t from-eco/60 to-transparent"
                style={{ height: n.h, transform: "rotateX(-90deg)", transformOrigin: "top" }}
              />
              <span
                className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime"
                style={{
                  transform: `translateZ(${n.h}px)`,
                  boxShadow: "0 0 14px var(--lime)",
                }}
              />
            </div>
          ))}
          <span
            className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground bg-ink"
            style={{ transform: "translateZ(70px)", boxShadow: "0 0 30px var(--eco)" }}
          />
        </div>
      </div>
    </Tilt>
  );
}

const FEATURES = [
  {
    n: "01",
    title: "Environmental Monitoring",
    body: "One calm view of air quality, cleanliness and noise across every place you watch. Built to ingest station and satellite feeds from your backend.",
    points: [
      "AQI, PM2.5 and composite scores",
      "Per-location trends and health scores",
      "Typed API layer, swappable per endpoint",
    ],
    Art: MonitoringArt,
  },
  {
    n: "02",
    title: "Predictive Intelligence",
    body: "Forecast horizons, risk levels and confidence bands, drawn from whatever model your backend serves.",
    points: [
      "24h and 72h horizons",
      "Confidence intervals, history vs forecast",
      "Peak risk level and 24h outlook",
    ],
    Art: PredictiveArt,
  },
  {
    n: "03",
    title: "Community Environmental Action",
    body: "Citizens report, neighbours verify, volunteers clean up. Every report becomes a data point that sharpens the picture on the ground.",
    points: [
      "Geo-tagged citizen reports",
      "Verification and resolution states",
      "Cleanup events with volunteer counts",
    ],
    Art: CommunityArt,
  },
];

export function Intelligence() {
  return (
    <section id="intelligence" aria-labelledby="intel-title" className="relative py-32">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-ink/70 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-5 md:px-10">
        <Reveal className="max-w-3xl">
          <SectionLabel index="03">Environmental Intelligence</SectionLabel>
          <h2 id="intel-title" className="mt-6 text-[clamp(2.6rem,6vw,5.5rem)] leading-[0.96]">
            Raw signal in.
            <br />
            <span className="text-gradient-eco">Intelligence out.</span>
          </h2>
        </Reveal>

        <div className="mt-40 space-y-32 md:space-y-44">
          {FEATURES.map(({ n, title, body, points, Art }, i) => (
            <div key={n} className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-20">
              <Reveal className={cn(i % 2 === 1 && "md:order-2")}>
                <Art />
              </Reveal>
              <Reveal delay={0.1} className={cn(i % 2 === 1 && "md:order-1")}>
                <div className="font-display text-7xl leading-none text-foreground/15">{n}</div>
                <h3 className="font-display mt-5 text-[clamp(2rem,3.4vw,3.2rem)] leading-[1.02]">
                  {title}
                </h3>
                <p className="mt-5 max-w-md text-[16px] leading-relaxed text-foreground/70">
                  {body}
                </p>
                <ul className="mt-7 space-y-3 border-t border-foreground/10 pt-6">
                  {points.map((p) => (
                    <li key={p} className="flex items-center gap-3 text-sm text-foreground/85">
                      <span className="h-px w-5 bg-lime" aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
