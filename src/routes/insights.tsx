import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Area, AreaChart, Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";
import { AppShell } from "@/components/app-shell";
import { ForecastPanel } from "@/components/forecast-panel";
import { api, IS_DEMO_MODE } from "@/lib/api";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Predictions — TerraPulse AI" },
      {
        name: "description",
        content: "Pollution forecasts with confidence intervals, clearly labelled by data source.",
      },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const q = useQuery({ queryKey: ["insights"], queryFn: api.insights });
  const insights = q.data ?? [];

  return (
    <AppShell title="Predictions" subtitle="Pollution forecasts and environmental risk">
      <ForecastPanel />

      <div className="mt-20">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-t border-foreground/15 pt-5">
          <div>
            <div className="eyebrow">Insights</div>
            <h2 className="mt-3 text-3xl leading-none">Environmental insights</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
          {insights.map((it, idx) => {
            const gradId = `ins-grad-${idx}`;
            const useLine = idx % 2 === 1;
            return (
              <motion.article
                key={it.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="border-t border-foreground/15 pt-4"
              >
                <div className="flex items-center justify-between">
                  <span className="eyebrow">{it.kind}</span>
                  {!IS_DEMO_MODE && (
                    <span className="eyebrow">Confidence · {Math.round(it.confidence * 100)}%</span>
                  )}
                </div>
                <h3 className="mt-4 text-2xl leading-tight">{it.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.summary}</p>

                <div className="mt-4 h-28" role="img" aria-label={`Trend series for ${it.title}`}>
                  <ResponsiveContainer>
                    {useLine ? (
                      <LineChart data={it.series}>
                        <Tooltip contentStyle={tipStyle} />
                        <Line
                          isAnimationActive={false}
                          type="monotone"
                          dataKey="y"
                          stroke="var(--lime)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    ) : (
                      <AreaChart data={it.series}>
                        <defs>
                          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--eco)" stopOpacity={0.45} />
                            <stop offset="100%" stopColor="var(--eco)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Tooltip contentStyle={tipStyle} />
                        <Area
                          isAnimationActive={false}
                          type="monotone"
                          dataKey="y"
                          stroke="var(--eco)"
                          fill={`url(#${gradId})`}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

const tipStyle = {
  background: "var(--popover)",
  border: "1px solid color-mix(in oklab, var(--foreground) 12%, transparent)",
  borderRadius: 10,
  fontSize: 12,
  color: "var(--foreground)",
};
