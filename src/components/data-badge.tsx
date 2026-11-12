import { useSyncExternalStore } from "react";
import { FlaskConical, Radio, Cpu } from "lucide-react";
import { SOURCE_META, getSource, subscribeSources, type DataSource } from "@/lib/provenance";
import { cn } from "@/lib/utils";

const STYLE: Record<DataSource, string> = {
  live: "border-eco/40 bg-eco/10 text-eco",
  demo: "border-demo/40 bg-demo/10 text-demo",
  model: "border-model/40 bg-model/10 text-model",
};
const ICON = { live: Radio, demo: FlaskConical, model: Cpu } as const;

/** Reads the provenance of an endpoint recorded by the api layer. */
export function useDataSource(key: string): DataSource {
  return useSyncExternalStore(
    subscribeSources,
    () => getSource(key),
    () => "demo" as DataSource,
  );
}

export function DataBadge({
  source,
  label,
  className,
}: {
  source: DataSource;
  label?: string;
  className?: string;
}) {
  // Bundled sample data carries no badge; only live-API and ML-model sources are labelled.
  if (source === "demo") return null;
  const Icon = ICON[source];
  return (
    <span
      title={SOURCE_META[source].hint}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-mono text-[10px] uppercase leading-none tracking-[0.14em]",
        STYLE[source],
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label ?? SOURCE_META[source].label}
    </span>
  );
}

/** Convenience: badge that follows an endpoint's recorded provenance. */
export function EndpointBadge({ endpoint, className }: { endpoint: string; className?: string }) {
  const src = useDataSource(endpoint);
  return <DataBadge source={src} className={className} />;
}
