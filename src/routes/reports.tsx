import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import {
  Upload,
  MapPin,
  Image as ImageIcon,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Report pollution — TerraPulse AI" },
      { name: "description", content: "Submit environmental reports with photos and GPS." },
    ],
  }),
  component: ReportsPage,
});

const TYPES = ["Litter", "Smoke", "Water", "Noise", "Other"] as const;
const SEVERITY = ["Low", "Medium", "High"] as const;

function ReportsPage() {
  const reports = useQuery({ queryKey: ["reports"], queryFn: api.reports });

  const [type, setType] = useState<(typeof TYPES)[number]>("Litter");
  const [severity, setSeverity] = useState<(typeof SEVERITY)[number]>("Medium");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState<{ url: string; name: string }[]>([]);

  const onDrop = useCallback((files: File[]) => {
    const next = files.slice(0, 6).map((f) => ({
      url: URL.createObjectURL(f),
      name: f.name,
    }));
    setImages((prev) => [...prev, ...next].slice(0, 6));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 6,
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // TODO(backend): POST ${VITE_API_BASE_URL}/reports once the FastAPI service exists.
    toast.info("Report not sent", {
      description: "Report submission isn't available yet.",
    });
    setDescription("");
    setImages([]);
  }

  return (
    <AppShell title="Citizen Report" subtitle="Help improve your community">
      <Toaster theme="light" position="top-right" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form onSubmit={submit} className="glass rounded-2xl p-6 lg:col-span-2">
          <h2 className="font-display text-xl font-semibold">Submit a report</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Photos, GPS and a short description make a report easier to verify.
          </p>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
              isDragActive
                ? "border-eco bg-eco/5"
                : "border-foreground/15 bg-foreground/[0.03] hover:bg-foreground/[0.06]"
            }`}
          >
            <input {...getInputProps()} />
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-foreground/[0.05]">
              <Upload className="h-5 w-5" />
            </div>
            <div className="mt-3 text-sm">
              {isDragActive ? "Drop photos here" : "Drag photos here, or click to select"}
            </div>
            <div className="text-xs text-muted-foreground">Up to 6 · JPG / PNG · 10 MB each</div>
          </div>

          {/* Previews */}
          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3 md:grid-cols-6">
              {images.map((img, i) => (
                <motion.div
                  key={img.url}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-foreground/15"
                >
                  <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Type */}
          <div className="mt-5">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Pollution type
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setType(t)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    type === t
                      ? "border-eco/50 bg-eco/15 text-eco"
                      : "border-foreground/15 bg-foreground/[0.04] text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div className="mt-5">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Severity
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {SEVERITY.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={`rounded-xl border py-2 text-sm transition-colors ${
                    severity === s
                      ? "border-eco/50 bg-eco/15 text-eco"
                      : "border-foreground/15 bg-foreground/[0.04] text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="mt-5">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Location
            </label>
            <div className="mt-2 flex gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-foreground/15 bg-ink/50 px-3 py-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Address or coordinates"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.geolocation?.getCurrentPosition((p) =>
                    setLocation(
                      `${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`,
                    ),
                  );
                }}
                className="rounded-xl border border-foreground/15 bg-foreground/[0.04] px-3 text-sm hover:bg-foreground/[0.08]"
              >
                Use GPS
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="mt-5">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="What did you observe?"
              className="mt-2 w-full rounded-xl border border-foreground/15 bg-ink/50 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <button
            type="submit"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-lime text-accent-foreground px-5 py-2.5 text-sm font-medium shadow-lg shadow-eco/20"
          >
            Submit report
          </button>
        </form>

        {/* Recent reports */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-display text-lg font-semibold">Recent reports</h3>
          <ReportsSearchList data={reports.data ?? []} />
        </div>
      </div>
    </AppShell>
  );
}

function ReportsSearchList({ data }: { data: import("@/lib/mock-data").Report[] }) {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const filtered = term
    ? data.filter((r) =>
        [r.type, r.severity, r.status, r.location, r.description]
          .join(" ")
          .toLowerCase()
          .includes(term),
      )
    : data;

  return (
    <>
      <div className="mt-3 flex items-center gap-2 rounded-2xl border border-foreground/15 bg-ink/50 px-3 py-2 focus-within:border-eco/40">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search reports by type, location, status…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>
      <div className="mt-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-foreground/15 bg-foreground/[0.03] p-4 text-center text-xs text-muted-foreground">
            No reports match “{q}”.
          </div>
        ) : (
          filtered.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-foreground/15 bg-foreground/[0.03] p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{r.type}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                      r.severity === "High"
                        ? "bg-aqi-bad/20 text-aqi-bad"
                        : r.severity === "Medium"
                          ? "bg-aqi-poor/20 text-aqi-poor"
                          : "bg-aqi-good/20 text-aqi-good"
                    }`}
                  >
                    {r.severity}
                  </span>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{r.description}</div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {r.location}
                </span>
                <span>{r.date}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; cls: string }> = {
    Pending: { icon: <Clock className="h-3 w-3" />, cls: "text-aqi-mod bg-aqi-mod/10" },
    Verified: { icon: <AlertTriangle className="h-3 w-3" />, cls: "text-accent bg-accent/10" },
    Resolved: { icon: <CheckCircle2 className="h-3 w-3" />, cls: "text-eco bg-eco/10" },
    Rejected: {
      icon: <X className="h-3 w-3" />,
      cls: "text-muted-foreground bg-foreground/[0.05]",
    },
  };
  const m = map[status] ?? map.Pending;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${m.cls}`}
    >
      {m.icon} {status}
    </span>
  );
}
