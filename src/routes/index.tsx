import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { useReducedMotion } from "@/hooks/use-env";
import { EarthCanvas } from "@/components/scene/earth-canvas";
import { useStoryInputs } from "@/components/scene/use-story-inputs";
import { DataUnavailableNotice } from "@/components/data-unavailable";
import { LandingNav } from "@/components/landing/landing-nav";
import { Hero } from "@/components/landing/hero";
import { PlanetaryPulse } from "@/components/landing/planetary-pulse";
import { LiveEarth } from "@/components/landing/live-earth";
import { Intelligence } from "@/components/landing/intelligence";
import { Predictions } from "@/components/landing/predictions";
import { Hotspots } from "@/components/landing/hotspots";
import { Community } from "@/components/landing/community";
import { Finale } from "@/components/landing/finale";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TerraPulse AI — Intelligence for a Living Planet" },
      {
        name: "description",
        content:
          "TerraPulse AI is an environmental intelligence platform: live Earth visualisation, air-quality monitoring, forecasting and community action.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const reduced = useReducedMotion();
  const active = useStoryInputs(reduced);
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const hot = useQuery({ queryKey: ["hotspots"], queryFn: api.hotspots });

  return (
    <div ref={setRoot} className="relative isolate overflow-x-clip bg-ink text-foreground">
      <a
        href="#pulse"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-lime focus:px-4 focus:py-2 focus:text-accent-foreground"
      >
        Skip to content
      </a>

      {/* One persistent WebGL scene, driven by scroll. */}
      {hot.data && <EarthCanvas hotspots={hot.data} eventSource={root} />}

      <LandingNav active={active} />
      <DataUnavailableNotice className="fixed left-1/2 top-20 z-[60] w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 backdrop-blur-xl" />

      <main className="relative z-10">
        <Hero />
        <PlanetaryPulse />
        <LiveEarth />
        <Intelligence />
        <Predictions />
        <Hotspots />
        <Community />
        <Finale />
      </main>

      <div aria-hidden className="grain-overlay pointer-events-none fixed inset-0 z-[55]" />
    </div>
  );
}
