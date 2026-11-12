import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-env";
import { cn } from "@/lib/utils";
import { scrollToSection } from "@/components/scene/use-story-inputs";

/** Number that counts up the first time it scrolls into view. Renders the final value without JS. */
export function Counter({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const reduced = useReducedMotion();
  const mv = useMotionValue(value);
  const text = useTransform(
    mv,
    (n) =>
      `${prefix}${n.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`,
  );

  // Start from zero on the client (after hydration) unless motion is reduced.
  useEffect(() => {
    if (!reduced && !inView) mv.set(0);
    if (reduced) mv.set(value);
  }, [reduced, inView, value, mv]);

  useEffect(() => {
    if (!inView || reduced) return;
    const c = animate(mv, value, { duration: 1.8, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [inView, reduced, value, mv]);

  return (
    <motion.span ref={ref} className={cn("tabular-nums", className)}>
      {text}
    </motion.span>
  );
}

/** Fade + rise on enter. Disabled under reduced motion. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SectionLabel({ index, children }: { index: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="eyebrow text-lime">{index}</span>
      <span className="h-px w-10 bg-foreground/25" />
      <span className="eyebrow">{children}</span>
    </div>
  );
}

const BTN =
  "group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full px-6 py-3.5 text-sm font-medium tracking-tight transition-[transform,background-color,border-color,box-shadow] duration-300 active:scale-[0.98]";
const PRIMARY =
  "bg-lime text-accent-foreground shadow-[0_0_0_0_transparent] hover:shadow-[0_10px_50px_-10px_color-mix(in_oklab,var(--lime)_70%,transparent)] hover:-translate-y-0.5";
const GHOST =
  "border border-foreground/20 bg-foreground/[0.03] text-foreground backdrop-blur hover:border-foreground/40 hover:bg-foreground/[0.08]";

export function CtaScroll({
  to,
  variant = "primary",
  children,
}: {
  to: string;
  variant?: "primary" | "ghost";
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  return (
    <a
      href={`#${to}`}
      onClick={(e) => {
        e.preventDefault();
        scrollToSection(to, reduced);
      }}
      className={cn(BTN, variant === "primary" ? PRIMARY : GHOST)}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </a>
  );
}

export function CtaLink({
  to,
  variant = "primary",
  children,
}: {
  to: "/dashboard" | "/map" | "/insights" | "/reports" | "/notifications" | "/profile";
  variant?: "primary" | "ghost";
  children: ReactNode;
}) {
  return (
    <Link to={to} className={cn(BTN, variant === "primary" ? PRIMARY : GHOST)}>
      {children}
      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}

/** Thin horizontal meter used for ranked data. */
export function Meter({ value, max, color }: { value: number; max: number; color: string }) {
  const reduced = useReducedMotion();
  return (
    <div className="h-[3px] w-full overflow-hidden rounded-full bg-foreground/10">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={reduced ? false : { width: 0 }}
        whileInView={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
