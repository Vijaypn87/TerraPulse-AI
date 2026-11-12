import { useSyncExternalStore } from "react";
import { getFailedCount, subscribeSources } from "@/lib/provenance";

/** Shown only when a configured backend fails to respond. Renders nothing otherwise. */
export function DataUnavailableNotice({ className = "" }: { className?: string }) {
  const failed = useSyncExternalStore(subscribeSources, getFailedCount, () => 0);
  if (!failed) return null;
  return (
    <div
      role="status"
      className={`rounded-xl border border-aqi-poor/40 bg-aqi-poor/10 px-4 py-3 text-sm text-foreground/90 ${className}`}
    >
      Data service unavailable. Some information can't be loaded right now. Please try again
      shortly.
    </div>
  );
}
