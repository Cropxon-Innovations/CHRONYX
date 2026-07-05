import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import JSZip from "jszip";
import { Download, Package, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";


/**
 * Internal icon preview gallery — visualises the Chronyx 3D orbital
 * icon set across light/dark surfaces and the home-screen treatments
 * used by iOS, Android, and desktop browsers. Not linked from the
 * main nav; open at /icon-preview to QA after icon updates.
 */

const ICONS = [
  { label: "favicon-32 (browser tab)", src: "/favicon-32.png",         file: "favicon-32.png",         size: 32  },
  { label: "favicon.ico (legacy)",     src: "/favicon.ico",            file: "favicon.ico",            size: 32  },
  { label: "PWA 192",                  src: "/icons/icon-192.png",     file: "icon-192.png",           size: 96  },
  { label: "PWA 512",                  src: "/icons/icon-512.png",     file: "icon-512.png",           size: 128 },
  { label: "Apple touch (180)",        src: "/apple-touch-icon.png",   file: "apple-touch-icon.png",   size: 120 },
  { label: "SVG mark",                 src: "/chronyx-logo.svg",       file: "chronyx-logo.svg",       size: 96  },
];

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const Surface = ({
  bg, label, children,
}: { bg: string; label: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border overflow-hidden">
    <div className="px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground border-b border-border bg-card">
      {label}
    </div>
    <div className={`p-8 ${bg} grid grid-cols-3 sm:grid-cols-6 gap-6 items-end`}>
      {children}
    </div>
  </div>
);

const Tile = ({
  label, src, size, file,
}: { label: string; src: string; size: number; file: string }) => (
  <figure className="flex flex-col items-center text-center gap-2">
    <img src={src} alt={label} width={size} height={size} style={{ width: size, height: size }} className="rounded-xl shadow-lg" />
    <figcaption className="text-[10px] text-muted-foreground leading-tight max-w-[110px]">{label}</figcaption>
    <a
      href={src}
      download={file}
      className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
    >
      <Download className="h-3 w-3" /> download
    </a>
  </figure>
);

const PlatformMock = ({
  title, bg, frame,
}: { title: string; bg: string; frame: React.ReactNode }) => (
  <div className="rounded-2xl border border-border overflow-hidden">
    <div className="px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground border-b border-border bg-card">
      {title}
    </div>
    <div className={`p-10 ${bg} flex items-center justify-center`}>{frame}</div>
  </div>
);

type HealthStatus = "pending" | "ok" | "fail";
interface HealthRow {
  source: string;
  url: string;
  status: HealthStatus;
  detail?: string;
  contentType?: string;
  bytes?: number;
}

const IconPreview = () => {
  const [zipping, setZipping] = useState(false);
  const [health, setHealth] = useState<HealthRow[]>([]);
  const [checking, setChecking] = useState(false);

  const runHealthCheck = async () => {
    setChecking(true);
    try {
      // Discover icons from live <link> tags + manifest
      const linkHrefs = Array.from(
        document.querySelectorAll<HTMLLinkElement>(
          'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], link[rel="mask-icon"]'
        )
      ).map((l) => ({ source: `<link rel="${l.rel}">`, url: new URL(l.href, location.origin).pathname }));

      const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      const manifestUrl = manifestLink ? new URL(manifestLink.href, location.origin).pathname : "/manifest.json";

      const manifestRows: { source: string; url: string }[] = [
        { source: "manifest link", url: manifestUrl },
      ];
      try {
        const mres = await fetch(manifestUrl, { cache: "no-store" });
        if (mres.ok) {
          const mjson = await mres.json();
          for (const icon of mjson.icons ?? []) {
            manifestRows.push({
              source: `manifest.icons[${icon.sizes ?? "?"}]`,
              url: new URL(icon.src, location.origin).pathname,
            });
          }
        }
      } catch {
        /* handled below */
      }

      const all = [...linkHrefs, ...manifestRows];
      const seen = new Set<string>();
      const unique = all.filter((r) => (seen.has(r.url) ? false : seen.add(r.url)));

      const rows: HealthRow[] = unique.map((r) => ({ ...r, status: "pending" as HealthStatus }));
      setHealth(rows);

      const results = await Promise.all(
        rows.map(async (row): Promise<HealthRow> => {
          try {
            const res = await fetch(row.url, { cache: "no-store" });
            if (!res.ok) return { ...row, status: "fail", detail: `HTTP ${res.status}` };
            const blob = await res.blob();
            return {
              ...row,
              status: "ok",
              contentType: blob.type || res.headers.get("content-type") || "",
              bytes: blob.size,
            };
          } catch (e) {
            return { ...row, status: "fail", detail: e instanceof Error ? e.message : "network error" };
          }
        })
      );
      setHealth(results);
      const failed = results.filter((r) => r.status === "fail").length;
      if (failed === 0) toast.success(`All ${results.length} icons resolve correctly`);
      else toast.error(`${failed} of ${results.length} icons failed to load`);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    void runHealthCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportZip = async () => {
    try {
      setZipping(true);
      const zip = new JSZip();
      const folder = zip.folder("chronyx-icons")!;
      await Promise.all(
        ICONS.map(async (i) => {
          const res = await fetch(i.src, { cache: "no-store" });
          if (!res.ok) throw new Error(`Failed to fetch ${i.file}`);
          folder.file(i.file, await res.blob());
        })
      );
      folder.file(
        "README.txt",
        [
          "Chronyx icon set",
          `Generated: ${new Date().toISOString()}`,
          "",
          ...ICONS.map((i) => `- ${i.file}  (${i.label})`),
        ].join("\n")
      );
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `chronyx-icons-${new Date().toISOString().slice(0, 10)}.zip`);
      toast.success("Icon set exported");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setZipping(false);
    }
  };


  return (
    <main className="min-h-screen bg-background text-foreground py-12 px-6">
      <Helmet>
        <title>Chronyx · Icon Preview</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Internal</p>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight mt-2">Icon Preview Gallery</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              QA the Chronyx 3D orbital mark across favicons, PWA icons, and home-screen treatments
              for iOS, Android, and desktop. Download individual assets or grab the full set as a ZIP.
            </p>
          </div>
          <Button onClick={exportZip} disabled={zipping} className="gap-2">
            <Package className="h-4 w-4" />
            {zipping ? "Packaging…" : "Export ZIP"}
          </Button>
        </header>

        {/* Manifest & favicon health check */}
        <section className="rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-border bg-card">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Runtime check</p>
              <h2 className="text-sm font-medium text-foreground mt-0.5">Manifest & favicon resolution</h2>
            </div>
            <Button size="sm" variant="outline" onClick={runHealthCheck} disabled={checking} className="gap-2">
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Re-check
            </Button>
          </div>
          <div className="divide-y divide-border">
            {health.length === 0 && (
              <p className="px-4 py-6 text-sm text-muted-foreground">Discovering icons…</p>
            )}
            {health.map((r) => (
              <div key={r.url} className="px-4 py-3 grid grid-cols-[auto_1fr_auto] items-center gap-4">
                <div className="flex items-center gap-3">
                  {r.status === "ok" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : r.status === "fail" ? (
                    <XCircle className="h-4 w-4 text-rose-500" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {/* Twin swatches so we can see the icon on both themes */}
                  <div className="flex items-center gap-1">
                    <div className="w-8 h-8 rounded bg-white flex items-center justify-center border border-border">
                      <img src={r.url} alt="" className="max-w-6 max-h-6" onError={(e) => (e.currentTarget.style.opacity = "0.15")} />
                    </div>
                    <div className="w-8 h-8 rounded bg-[#0b0f1a] flex items-center justify-center border border-border">
                      <img src={r.url} alt="" className="max-w-6 max-h-6" onError={(e) => (e.currentTarget.style.opacity = "0.15")} />
                    </div>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{r.source}</p>
                  <p className="text-sm font-mono truncate">{r.url}</p>
                </div>
                <div className="text-right text-[11px] text-muted-foreground">
                  {r.status === "ok" && (
                    <>
                      <div>{r.contentType || "—"}</div>
                      <div>{r.bytes != null ? `${(r.bytes / 1024).toFixed(1)} KB` : ""}</div>
                    </>
                  )}
                  {r.status === "fail" && <span className="text-rose-500">{r.detail}</span>}
                  {r.status === "pending" && <span>checking…</span>}
                </div>
              </div>
            ))}
          </div>
        </section>

        <Surface bg="bg-white" label="On light surface">

          {ICONS.map((i) => <Tile key={i.label} {...i} />)}
        </Surface>

        <Surface bg="bg-[#0b0f1a]" label="On dark surface">
          {ICONS.map((i) => <Tile key={i.label} {...i} />)}
        </Surface>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <PlatformMock
            title="iOS · Home Screen"
            bg="bg-gradient-to-br from-sky-400 via-indigo-500 to-fuchsia-600"
            frame={
              <div className="flex flex-col items-center gap-2">
                <img src="/apple-touch-icon.png" width={88} height={88} alt="iOS icon" className="rounded-[20px] shadow-2xl" />
                <span className="text-white text-xs drop-shadow">CHRONYX</span>
              </div>
            }
          />
          <PlatformMock
            title="Android · Launcher"
            bg="bg-[#1f1f1f]"
            frame={
              <div className="flex flex-col items-center gap-2">
                <div className="w-[88px] h-[88px] rounded-full overflow-hidden shadow-2xl bg-black flex items-center justify-center">
                  <img src="/icons/icon-192.png" width={88} height={88} alt="Android icon" />
                </div>
                <span className="text-white text-xs">CHRONYX</span>
              </div>
            }
          />
          <PlatformMock
            title="Desktop · Browser tab"
            bg="bg-[#e5e7eb]"
            frame={
              <div className="w-full max-w-[280px] rounded-t-lg overflow-hidden border border-border bg-card">
                <div className="flex items-center gap-2 px-3 py-2 bg-muted">
                  <img src="/favicon-32.png" width={16} height={16} alt="tab favicon" />
                  <span className="text-xs text-foreground truncate">CHRONYX — A quiet space for your life</span>
                </div>
                <div className="h-16 bg-background" />
              </div>
            }
          />
        </div>

        <footer className="text-xs text-muted-foreground pt-4 border-t border-border">
          Sources: <code>/favicon.ico</code>, <code>/favicon-32.png</code>, <code>/apple-touch-icon.png</code>,{" "}
          <code>/icons/icon-192.png</code>, <code>/icons/icon-512.png</code>, <code>/chronyx-logo.svg</code>.
        </footer>
      </div>
    </main>
  );
};

export default IconPreview;
