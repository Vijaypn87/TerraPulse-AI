import { Link } from "@tanstack/react-router";
import { Reveal, CtaLink } from "./primitives";
import { Logo } from "@/components/logo";
import { scrollToTop } from "@/components/scene/use-story-inputs";
import { IS_DEMO_MODE } from "@/lib/api";
import { useReducedMotion } from "@/hooks/use-env";

export function Finale() {
  const reduced = useReducedMotion();
  return (
    <>
      <section
        id="finale"
        aria-labelledby="finale-title"
        className="relative flex min-h-[125svh] flex-col items-center pt-[22svh] text-center"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-5">
          <Reveal>
            <div className="eyebrow mb-8">TerraPulse AI · Intelligence for a Living Planet</div>
            <h2 id="finale-title" className="text-[clamp(2.6rem,6.2vw,6.4rem)] leading-[0.96]">
              The Future of Our Planet Starts With{" "}
              <span className="text-gradient-eco">Understanding It.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-12 flex justify-center">
              <CtaLink to="/dashboard">Explore TerraPulse AI</CtaLink>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="relative border-t border-foreground/10 bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 py-14 md:grid-cols-[1.3fr_1fr_1fr] md:px-10">
          <div>
            <Logo
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                scrollToTop(reduced);
              }}
            />
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              Intelligence for a Living Planet.
            </p>
          </div>
          <nav aria-label="App">
            <div className="eyebrow mb-4">App</div>
            <ul className="space-y-2.5 text-sm text-foreground/80">
              {(
                [
                  ["/dashboard", "Dashboard"],
                  ["/map", "Live map"],
                  ["/insights", "Predictions"],
                ] as const
              ).map(([to, l]) => (
                <li key={to}>
                  <Link to={to} className="transition-colors hover:text-lime">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Community">
            <div className="eyebrow mb-4">Community</div>
            <ul className="space-y-2.5 text-sm text-foreground/80">
              {(
                [
                  ["/reports", "Reports"],
                  ["/notifications", "Alerts"],
                  ["/profile", "Profile"],
                ] as const
              ).map(([to, l]) => (
                <li key={to}>
                  <Link to={to} className="transition-colors hover:text-lime">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="mx-auto max-w-7xl px-5 pb-8 text-[12px] text-muted-foreground md:px-10">
          <p>© {new Date().getFullYear()} TerraPulse AI</p>
          {IS_DEMO_MODE && (
            <p className="mt-2 max-w-2xl text-[11px] leading-relaxed opacity-80">
              Environmental measurements and predictions shown here are illustrative until live data
              integration is implemented.
            </p>
          )}
        </div>
      </footer>
    </>
  );
}
