import { Helmet } from "react-helmet-async";

/**
 * Internal icon preview gallery — visualises the Chronyx 3D orbital
 * icon set across light/dark surfaces and the home-screen treatments
 * used by iOS, Android, and desktop browsers. Not linked from the
 * main nav; open at /icon-preview to QA after icon updates.
 */

const ICONS = [
  { label: "favicon-32 (browser tab)", src: "/favicon-32.png", size: 32 },
  { label: "favicon.ico (legacy)",     src: "/favicon.ico",    size: 32 },
  { label: "PWA 192",                  src: "/icons/icon-192.png", size: 96 },
  { label: "PWA 512",                  src: "/icons/icon-512.png", size: 128 },
  { label: "Apple touch (180)",        src: "/apple-touch-icon.png", size: 120 },
  { label: "SVG mark",                 src: "/chronyx-logo.svg", size: 96 },
];

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

const Tile = ({ label, src, size }: { label: string; src: string; size: number }) => (
  <figure className="flex flex-col items-center text-center gap-2">
    <img src={src} alt={label} width={size} height={size} style={{ width: size, height: size }} className="rounded-xl shadow-lg" />
    <figcaption className="text-[10px] text-muted-foreground leading-tight max-w-[110px]">{label}</figcaption>
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

const IconPreview = () => {
  return (
    <main className="min-h-screen bg-background text-foreground py-12 px-6">
      <Helmet>
        <title>Chronyx · Icon Preview</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="max-w-5xl mx-auto space-y-8">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Internal</p>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight mt-2">Icon Preview Gallery</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            QA the Chronyx 3D orbital mark across favicons, PWA icons, and home-screen treatments
            for iOS, Android, and desktop. Open this page in light and dark themes to confirm contrast.
          </p>
        </header>

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
