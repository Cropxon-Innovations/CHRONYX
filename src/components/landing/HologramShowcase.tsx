import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Sparkles, Calculator, Wallet, CheckSquare, Library, Shield,
  Bot, FileText, PenTool, Heart, Hourglass, Gift, Users, Lock,
} from "lucide-react";

// Same geometric mark as the header
const ChronyxMark = ({ className = "w-full h-full" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="256" cy="256" r="248" fill="currentColor" />
    <circle cx="256" cy="256" r="200" fill="none" stroke="hsl(var(--background))" strokeWidth="32" />
    <circle cx="256" cy="256" r="168" fill="currentColor" />
    <path
      d="M256 128 L256 216 L168 216 L168 256 L216 256 L216 344 L256 344 L256 296 L344 296 L344 256 L296 256 L296 168 L256 168 L256 128Z"
      fill="hsl(var(--background))"
    />
    <rect x="168" y="168" width="40" height="48" fill="hsl(var(--background))" />
    <rect x="304" y="296" width="40" height="48" fill="hsl(var(--background))" />
    <rect x="296" y="168" width="48" height="40" fill="hsl(var(--background))" />
    <rect x="168" y="304" width="48" height="40" fill="hsl(var(--background))" />
  </svg>
);

const orbits = [
  // radius (px), duration (s), tilt (deg)
  { r: 150, d: 26, tilt: 68 },
  { r: 210, d: 38, tilt: 72 },
  { r: 280, d: 52, tilt: 76 },
];

const modules = [
  { icon: Sparkles,    label: "NoteFlow",   color: "fuchsia" },
  { icon: Calculator,  label: "TAXYN",      color: "violet" },
  { icon: Wallet,      label: "Finance",    color: "amber" },
  { icon: CheckSquare, label: "Tasks",      color: "emerald" },
  { icon: Library,     label: "Library",    color: "cyan" },
  { icon: Bot,         label: "NOVA AI",    color: "purple" },
  { icon: PenTool,     label: "Notes",      color: "indigo" },
  { icon: FileText,    label: "Docs",       color: "slate" },
  { icon: Heart,       label: "Insurance",  color: "rose" },
  { icon: Hourglass,   label: "Lifespan",   color: "sky" },
  { icon: Gift,        label: "Rewards",    color: "yellow" },
  { icon: Users,       label: "Family",     color: "teal" },
  { icon: Lock,        label: "Vault",      color: "zinc" },
  { icon: Shield,      label: "Private",    color: "green" },
];

const colorClasses: Record<string, string> = {
  fuchsia: "from-fuchsia-500/30 to-fuchsia-500/5 border-fuchsia-500/40 text-fuchsia-500",
  violet:  "from-violet-500/30 to-violet-500/5 border-violet-500/40 text-violet-500",
  amber:   "from-amber-500/30 to-amber-500/5 border-amber-500/40 text-amber-500",
  emerald: "from-emerald-500/30 to-emerald-500/5 border-emerald-500/40 text-emerald-500",
  cyan:    "from-cyan-500/30 to-cyan-500/5 border-cyan-500/40 text-cyan-500",
  purple:  "from-purple-500/30 to-purple-500/5 border-purple-500/40 text-purple-500",
  indigo:  "from-indigo-500/30 to-indigo-500/5 border-indigo-500/40 text-indigo-500",
  slate:   "from-slate-500/30 to-slate-500/5 border-slate-500/40 text-slate-400",
  rose:    "from-rose-500/30 to-rose-500/5 border-rose-500/40 text-rose-500",
  sky:     "from-sky-500/30 to-sky-500/5 border-sky-500/40 text-sky-500",
  yellow:  "from-yellow-500/30 to-yellow-500/5 border-yellow-500/40 text-yellow-500",
  teal:    "from-teal-500/30 to-teal-500/5 border-teal-500/40 text-teal-500",
  zinc:    "from-zinc-500/30 to-zinc-500/5 border-zinc-500/40 text-zinc-400",
  green:   "from-green-500/30 to-green-500/5 border-green-500/40 text-green-500",
};

// Distribute modules across 3 orbits
const buckets = [
  modules.slice(0, 4),
  modules.slice(4, 9),
  modules.slice(9),
];

const HologramShowcase = memo(() => {
  const reduce = useReducedMotion();

  return (
    <section
      aria-label="Chronyx ecosystem hologram"
      className="relative w-full overflow-hidden border-t border-border/10 bg-gradient-to-b from-transparent via-background to-muted/10 py-20 sm:py-28"
    >
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,hsl(var(--chronyx-brand)/0.18)_0%,transparent_70%)] blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 text-center">
        <p className="mb-3 text-[10px] tracking-[0.4em] text-muted-foreground/70 uppercase">
          The Chronyx Universe
        </p>
        <h2
          className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight"
          style={{ color: "hsl(var(--chronyx-brand))" }}
        >
          One quiet core. Every part of your life around it.
        </h2>
        <p className="mt-4 text-sm sm:text-base text-muted-foreground font-light max-w-xl mx-auto">
          A living hologram of the modules orbiting your private dashboard — finance, study,
          tasks, memories and AI, all in continuous motion.
        </p>

        {/* Stage */}
        <div
          className="relative mx-auto mt-14 sm:mt-20 flex items-center justify-center"
          style={{ width: "min(640px, 92vw)", height: "min(640px, 92vw)", perspective: "1200px" }}
        >
          {/* Tilted orbit rings */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ transformStyle: "preserve-3d", transform: "rotateX(60deg)" }}
            aria-hidden
          >
            {orbits.map((o, i) => (
              <div
                key={i}
                className="absolute rounded-full border border-dashed"
                style={{
                  width: o.r * 2,
                  height: o.r * 2,
                  borderColor: "hsl(var(--chronyx-brand) / 0.22)",
                }}
              />
            ))}
          </div>

          {/* Center logo — gentle 3D float */}
          <motion.div
            className="relative z-20"
            style={{ color: "hsl(var(--chronyx-brand))", transformStyle: "preserve-3d" }}
            animate={reduce ? undefined : { rotateY: [0, 360] }}
            transition={reduce ? undefined : { duration: 22, repeat: Infinity, ease: "linear" }}
          >
            <div className="relative h-36 w-36 sm:h-48 sm:w-48">
              {/* halo */}
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,hsl(var(--chronyx-brand)/0.35)_0%,transparent_65%)] blur-2xl" />
              <ChronyxMark className="relative h-full w-full drop-shadow-[0_0_30px_hsl(var(--chronyx-brand)/0.45)]" />
            </div>
          </motion.div>

          {/* Orbiting chips */}
          {orbits.map((o, oi) => (
            <motion.div
              key={oi}
              className="absolute inset-0"
              style={{ transformStyle: "preserve-3d", transform: `rotateX(${o.tilt}deg)` }}
              animate={reduce ? undefined : { rotateZ: oi % 2 === 0 ? [0, 360] : [360, 0] }}
              transition={
                reduce ? undefined : { duration: o.d, repeat: Infinity, ease: "linear" }
              }
            >
              {buckets[oi].map((m, mi) => {
                const angle = (360 / buckets[oi].length) * mi;
                const Icon = m.icon;
                return (
                  <div
                    key={m.label}
                    className="absolute left-1/2 top-1/2"
                    style={{
                      transform: `rotate(${angle}deg) translateX(${o.r}px) rotate(-${angle}deg)`,
                    }}
                  >
                    {/* counter-rotate to keep chip upright */}
                    <motion.div
                      animate={reduce ? undefined : { rotateZ: oi % 2 === 0 ? [0, -360] : [0, 360] }}
                      transition={
                        reduce ? undefined : { duration: o.d, repeat: Infinity, ease: "linear" }
                      }
                      style={{ transform: `rotateX(-${o.tilt}deg)` }}
                    >
                      <div
                        className={`flex items-center gap-1.5 rounded-full border bg-gradient-to-b backdrop-blur-md px-3 py-1.5 text-[11px] font-medium shadow-lg shadow-black/5 ${colorClasses[m.color]}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="text-foreground/85">{m.label}</span>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </motion.div>
          ))}
        </div>

        <p className="mt-10 text-xs tracking-[0.25em] uppercase text-muted-foreground/60">
          14 modules · one private space
        </p>
      </div>
    </section>
  );
});

HologramShowcase.displayName = "HologramShowcase";
export default HologramShowcase;
