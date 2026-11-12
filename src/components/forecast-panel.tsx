import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Cpu } from "lucide-react";
import { api } from "@/lib/api";
import { riskFor } from "@/lib/forecast";
import { aqiToPm25 } from "@/lib/mock-data";
import { DataBadge } from "@/components/data-badge";
import { cn } from "@/lib/utils";

const tip = {
  background: "var(--popover)",
  border: "1px solid color-mix(in oklab, var(--foreground) 12%, transparent)",
  borderRadius: 10,
  fontSize: 12,
  color: "var(--foreground)",
};

/** Forecast explorer shared by the landing page and the app. Always shows data provenance. */
export function ForecastPanel() {
  const hot = useQuery({ queryKey: ["hotspots"], queryFn: api.hotspots });
  const list = hot.data ?? [];
  const [locId, setLocId] = useState("1");
  const [horizon, setHorizon] = useState<24 | 72>(72);
  const loc = list.find((h) => h.id === locId) ?? list[0];

  const fc = useQuery({
    queryKey: ["forecast", loc?.id, horizon],
    queryFn: () => api.forecast(loc!, horizon),
    enabled: !!loc,
  });
  const f = fc.data;

  const data = useMemo(
    () =>
      (f?.points ?? [])
        .filter((p) => p.t >= -24 || horizon === 72)
        .map((p) => ({
          t: p.t,
          observed: p.observed,
          predicted: p.predicted,
          band: p.lo != null && p.hi != null ? [p.lo, p.hi] : undefined,
        })),
    [f, horizon],
  );

  const stats = useMemo(() => {
    const fut = (f?.points ?? []).filter((p) => p.predicted != null && p.t > 0);
    if (!fut.length) return null;
    const peak = fut.reduce((a, b) => (b.predicted! > a.predicted! ? b : a));
    const h24 = fut.filter((p) => p.t <= 24);
    const avg24 = h24.reduce((a, p) => a + p.predicted!, 0) / (h24.length || 1);
    return { peak, avg24, risk: riskFor(peak.predicted!), now: loc ? aqiToPm25(loc.aqi) : 0 };
  }, [f, loc]);

  const isModel = f?.source === "model";
  // Bundled curves are illustrative, not factual predictions; wording reflects that.
  const unavailable = loc ? fc.isError : hot.isError || (hot.isSuccess && !list.length);
  const predLabel = isModel ? "Predicted" : "Illustrative projection";

  return (
    <div>
      {isModel && (
        <div>
          <div
            role="note"
            className="mt-8 flex items-start gap-3 rounded-xl border border-model/40 bg-model/10 px-4 py-3.5 text-sm"
          >
            <Cpu className="mt-0.5 h-4 w-4 shrink-0 text-model" aria-hidden />
            <p className="leading-snug text-foreground/90">
              <strong className="font-medium">ML prediction</strong> from{" "}
              <span className="font-mono text-[13px]">{f?.modelName ?? "the connected model"}</span>
              .
            </p>
          </div>
        </div>
      )}

      <div>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Location">
            {list.slice(0, 8).map((h) => (
              <button
                key={h.id}
                role="radio"
                aria-checked={locId === h.id}
                onClick={() => setLocId(h.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                  locId === h.id
                    ? "border-foreground/50 bg-foreground/10"
                    : "border-foreground/12 text-foreground/70 hover:border-foreground/30",
                )}
              >
                {h.name}
              </button>
            ))}
          </div>
          <div
            className="inline-flex rounded-full border border-foreground/15 p-1"
            role="radiogroup"
            aria-label="Horizon"
          >
            {([24, 72] as const).map((h) => (
              <button
                key={h}
                role="radio"
                aria-checked={horizon === h}
                onClick={() => setHorizon(h)}
                className={cn(
                  "rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
                  horizon === h
                    ? "bg-foreground text-ink"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="mt-8 rounded-2xl border border-foreground/10 bg-ink/70 p-4 md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="eyebrow">
                PM2.5 · <span className="normal-case">µg/m³</span> · {loc?.name ?? "—"}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="h-0.5 w-5 bg-foreground" /> Historical
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-0 w-5 border-t-2 border-dashed border-lime" /> {predLabel}
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-3 w-5 rounded-sm bg-lime/25" />{" "}
                  {isModel
                    ? `${Math.round((f?.confidenceLevel ?? 0.8) * 100)}% interval`
                    : "Illustrative range"}
                </span>
              </div>
            </div>
            <DataBadge source={isModel ? "model" : "demo"} />
          </div>
          <div
            className="h-[300px] md:h-[360px]"
            role="img"
            aria-label={`Forecast chart for ${loc?.name ?? "location"}, ${horizon} hours. ${isModel ? "ML prediction." : "Illustrative projection."}`}
          >
            {unavailable ? (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                Forecast unavailable
              </div>
            ) : (
              <ResponsiveContainer>
                <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                  <CartesianGrid
                    stroke="color-mix(in oklab, var(--foreground) 7%, transparent)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="t"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(t: number) => (t === 0 ? "Now" : `${t > 0 ? "+" : ""}${t}h`)}
                    stroke="color-mix(in oklab, var(--foreground) 40%, transparent)"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="color-mix(in oklab, var(--foreground) 40%, transparent)"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    width={44}
                  />
                  <Tooltip
                    contentStyle={tip}
                    labelFormatter={(t) =>
                      Number(t) === 0 ? "Now" : `${Number(t) > 0 ? "+" : ""}${t}h`
                    }
                    formatter={(v, name) => [
                      Array.isArray(v) ? `${v[0]}–${v[1]}` : String(v),
                      name === "band" ? "Interval" : name === "observed" ? "Historical" : predLabel,
                    ]}
                  />
                  <ReferenceLine
                    x={0}
                    stroke="color-mix(in oklab, var(--foreground) 35%, transparent)"
                    strokeDasharray="2 4"
                  />
                  <Area
                    dataKey="band"
                    stroke="none"
                    fill="var(--lime)"
                    fillOpacity={0.18}
                    isAnimationActive={false}
                  />
                  <Line
                    dataKey="observed"
                    stroke="var(--foreground)"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    connectNulls={false}
                  />
                  <Line
                    dataKey="predicted"
                    stroke="var(--lime)"
                    strokeWidth={2.2}
                    strokeDasharray="6 6"
                    dot={false}
                    isAnimationActive={false}
                    connectNulls={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-8 md:grid-cols-4">
          <div className="border-t border-foreground/15 pt-4">
            <div className="eyebrow">Peak · next {horizon}h</div>
            <div className="font-display mt-3 text-5xl leading-none tabular-nums">
              {stats ? stats.peak.predicted!.toFixed(1) : "—"}
            </div>
            <div className="mt-2 text-[13px] text-muted-foreground">
              {stats ? `at +${stats.peak.t}h` : ""}
            </div>
          </div>
          <div className="border-t border-foreground/15 pt-4">
            <div className="eyebrow">Risk level</div>
            <div
              className="font-display mt-3 text-5xl leading-none"
              style={{ color: stats?.risk.color }}
            >
              {stats?.risk.level ?? "—"}
            </div>
            <div className="mt-2 text-[13px] text-muted-foreground">
              {isModel ? "From peak PM2.5" : "From illustrative peak"}
            </div>
          </div>
          <div className="border-t border-foreground/15 pt-4">
            <div className="eyebrow">24h average</div>
            <div className="font-display mt-3 text-5xl leading-none tabular-nums">
              {stats ? stats.avg24.toFixed(1) : "—"}
            </div>
            <div className="mt-2 text-[13px] text-muted-foreground">
              vs {stats?.now.toFixed(1)} now
            </div>
          </div>
          <div className="border-t border-foreground/15 pt-4">
            <div className="eyebrow">Interval at peak</div>
            <div className="font-display mt-3 text-5xl leading-none tabular-nums">
              {stats
                ? `±${(
                    ((f!.points.find((p) => p.t === stats.peak.t)?.hi ?? 0) -
                      (f!.points.find((p) => p.t === stats.peak.t)?.lo ?? 0)) /
                    2
                  ).toFixed(1)}`
                : "—"}
            </div>
            <div className="mt-2 text-[13px] text-muted-foreground">
              {isModel
                ? `${Math.round((f?.confidenceLevel ?? 0.8) * 100)}% confidence`
                : "Illustrative"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
