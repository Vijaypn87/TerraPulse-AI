import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useReducedMotion } from "@/hooks/use-env";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { scrollToSection, scrollToTop } from "@/components/scene/use-story-inputs";
import type { SectionId } from "@/components/scene/poses";

const LINKS: { id: SectionId; label: string; matches: SectionId[] }[] = [
  { id: "overview", label: "Overview", matches: ["overview", "pulse"] },
  { id: "live-earth", label: "Live Earth", matches: ["live-earth"] },
  { id: "intelligence", label: "Intelligence", matches: ["intelligence"] },
  { id: "predictions", label: "Predictions", matches: ["predictions", "hotspots"] },
  { id: "community", label: "Community", matches: ["community", "finale"] },
];

export function LandingNav({ active }: { active: SectionId }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 48);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    // let the mobile sheet unlock body scroll before scrolling
    setTimeout(() => scrollToSection(id, reduced), open ? 60 : 0);
  };

  const goTop = () => {
    setOpen(false);
    setTimeout(() => scrollToTop(reduced), open ? 60 : 0);
  };

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 md:pt-5">
        <motion.div
          initial={reduced ? false : { y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-full border px-4 py-2 transition-[background-color,border-color,backdrop-filter,box-shadow] duration-500 md:px-5",
            scrolled
              ? "border-foreground/10 bg-ink/60 shadow-[0_20px_60px_-20px_rgb(0_0_0/0.8)] backdrop-blur-2xl backdrop-saturate-150"
              : "border-transparent bg-transparent",
          )}
        >
          <Logo
            onClick={(e) => {
              // keep new-tab / modified clicks native; plain click scrolls the landing page to the hero
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              goTop();
            }}
          />
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => {
              const on = l.matches.includes(active);
              return (
                <a
                  key={l.id}
                  href={`#${l.id}`}
                  aria-current={on ? "true" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    go(l.id);
                  }}
                  className={cn(
                    "relative rounded-full px-3.5 py-2 text-[13px] transition-colors duration-300",
                    on ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {on && (
                    <motion.span
                      layoutId="landing-nav-pill"
                      className="absolute inset-0 rounded-full bg-foreground/[0.08] ring-1 ring-foreground/10"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">{l.label}</span>
                  {on && (
                    <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-lime" />
                  )}
                </a>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/dashboard"
              className="group hidden items-center gap-1.5 rounded-full bg-lime px-4 py-2 text-[13px] font-medium text-accent-foreground transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-8px_color-mix(in_oklab,var(--lime)_70%,transparent)] active:scale-[0.97] md:inline-flex"
            >
              Dashboard
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((o) => !o)}
              className="grid h-9 w-9 place-items-center rounded-full border border-foreground/15 md:hidden"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </motion.div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 flex flex-col justify-center bg-ink/95 px-8 backdrop-blur-2xl md:hidden"
          >
            <nav aria-label="Mobile" className="flex flex-col gap-1">
              {LINKS.map((l, i) => (
                <motion.a
                  key={l.id}
                  href={`#${l.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    go(l.id);
                  }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * i + 0.1 }}
                  className="font-display border-b border-foreground/10 py-4 text-4xl"
                >
                  {l.label}
                </motion.a>
              ))}
            </nav>
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-lime px-6 py-3 text-sm font-medium text-accent-foreground"
            >
              Dashboard <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
