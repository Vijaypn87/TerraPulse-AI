import { ForecastPanel } from "@/components/forecast-panel";
import { Reveal, SectionLabel } from "./primitives";

export function Predictions() {
  return (
    <section
      id="predictions"
      aria-labelledby="pred-title"
      className="relative flex min-h-[110svh] items-center py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,var(--ink)_0%,color-mix(in_oklab,var(--ink)_80%,transparent)_55%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,#000_14%,#000_86%,transparent)] [mask-image:linear-gradient(to_bottom,transparent,#000_14%,#000_86%,transparent)]" />
      <div className="relative mx-auto w-full max-w-7xl px-5 md:px-10">
        <div className="grid grid-cols-12 gap-x-0 md:gap-x-10">
          <div className="col-span-12 min-w-0 md:col-span-9">
            <Reveal>
              <SectionLabel index="04">Predictive Intelligence</SectionLabel>
              <h2 id="pred-title" className="mt-6 text-[clamp(2.4rem,5vw,4.75rem)] leading-[0.98]">
                See the air before it arrives.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <ForecastPanel />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
