import { motion, useReducedMotion } from "framer-motion";
import { useRef, useState, MouseEvent } from "react";
import {
  PenTool, FileText, GraduationCap, Wallet, Receipt, TrendingUp,
  Heart, KanbanSquare, Images, GitBranch, Hourglass, Lock,
  CheckSquare, BookMarked, Zap, Target, Users, Trophy, PieChart, LineChart,
} from "lucide-react";
import { ChronyxOrbitalLogo } from "@/components/brand/ChronyxOrbitalLogo";

/**
 * Lobby Ecosystem — a 3D card gallery of every module that lives in the
 * /app sidebar. Each card has a mouse-following tilt (three.js / Apple
 * Vision feel) and a soft glow that follows the cursor. Uses semantic
 * design tokens so it reads cleanly in both light and dark themes.
 *
 * Module list must match AppSidebar.tsx — meta routes (Dashboard,
 * Security Dashboard, Privacy Center) are intentionally excluded.
 */

interface Module {
  label: string;
  desc: string;
  Icon: typeof PenTool;
  hue: string;
  group: string;
}

const MODULES: Module[] = [
  // Productivity
  { label: "Todos",            desc: "Daily plan & timeline.",        Icon: CheckSquare,   hue: "from-teal-400/30 to-teal-500/5",       group: "Productivity" },
  { label: "Noteflow",         desc: "AI notes, voice, OCR.",         Icon: PenTool,       hue: "from-violet-400/30 to-violet-500/5",   group: "Productivity" },
  { label: "Study",            desc: "Syllabus, PYQs, NOVA AI.",      Icon: GraduationCap, hue: "from-emerald-400/30 to-emerald-500/5", group: "Productivity" },
  { label: "Library",          desc: "Books, PDFs, readers.",         Icon: BookMarked,    hue: "from-amber-400/30 to-amber-500/5",     group: "Productivity" },
  { label: "Achievements",     desc: "Streaks & milestones.",         Icon: Trophy,        hue: "from-yellow-300/30 to-yellow-500/5",   group: "Productivity" },
  { label: "Resolutions",      desc: "Yearly intent, tracked.",       Icon: Target,        hue: "from-red-400/30 to-red-500/5",         group: "Productivity" },
  // Finance
  { label: "FinanceFlow",      desc: "Auto-imported transactions.",   Icon: Zap,           hue: "from-yellow-400/30 to-orange-500/5",   group: "Finance" },
  { label: "Expenses",         desc: "Budgets & categories.",         Icon: Receipt,       hue: "from-rose-400/30 to-rose-500/5",       group: "Finance" },
  { label: "Income",           desc: "Salary & passive income.",      Icon: TrendingUp,    hue: "from-green-400/30 to-green-500/5",     group: "Finance" },
  { label: "Reports & Budget", desc: "Spend insights & forecasts.",   Icon: PieChart,      hue: "from-sky-400/30 to-sky-500/5",         group: "Finance" },
  { label: "Loans & EMI",      desc: "Amortization & reminders.",     Icon: Wallet,        hue: "from-orange-400/30 to-orange-500/5",   group: "Finance" },
  { label: "Insurance",        desc: "Policies & claims.",            Icon: Heart,         hue: "from-pink-400/30 to-pink-500/5",       group: "Finance" },
  { label: "TAXYN",            desc: "Indian tax engine.",            Icon: FileText,      hue: "from-indigo-400/30 to-indigo-500/5",   group: "Finance" },
  // Life
  { label: "Memory",           desc: "Photos & collections.",         Icon: Images,        hue: "from-fuchsia-400/30 to-fuchsia-500/5", group: "Life" },
  { label: "Documents",        desc: "Personal docs vault.",          Icon: FileText,      hue: "from-cyan-400/30 to-cyan-500/5",       group: "Life" },
  { label: "Family Tree",      desc: "Generations & docs.",           Icon: GitBranch,     hue: "from-lime-400/30 to-lime-500/5",       group: "Life" },
  { label: "Social",           desc: "15+ platforms unified.",        Icon: Users,         hue: "from-purple-400/30 to-purple-500/5",   group: "Life" },
  { label: "Lifespan",         desc: "Years left, lived well.",       Icon: Hourglass,     hue: "from-stone-400/30 to-stone-500/5",     group: "Life" },
  // Work + Security
  { label: "Task Management",  desc: "Jira-style boards.",            Icon: KanbanSquare,  hue: "from-blue-400/30 to-blue-500/5",       group: "Work" },
  { label: "Vault",            desc: "Passwords & secrets.",          Icon: Lock,          hue: "from-slate-400/30 to-slate-500/5",     group: "Security" },
];

/** A tilted glass card that follows the cursor (three.js-style). */
const TiltCard = ({ mod, reduce }: { mod: Module; reduce: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, mx: 50, my: 50, lift: 0 });

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setTilt({
      ry: (px - 0.5) * 14,
      rx: -(py - 0.5) * 14,
      mx: px * 100,
      my: py * 100,
      lift: 14,
    });
  };
  const onLeave = () => setTilt({ rx: 0, ry: 0, mx: 50, my: 50, lift: 0 });

  const Icon = mod.Icon;
  return (
    <div style={{ perspective: 1000 }} className="h-full">
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        animate={{
          rotateX: tilt.rx,
          rotateY: tilt.ry,
          translateZ: tilt.lift,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 18, mass: 0.6 }}
        style={{ transformStyle: "preserve-3d" }}
        className="group relative h-full rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-6 shadow-[0_10px_40px_-20px_hsl(var(--primary)/0.35)] hover:shadow-[0_30px_80px_-20px_hsl(var(--primary)/0.55)] transition-shadow will-change-transform"
      >
        {/* Cursor-follow glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: `radial-gradient(380px circle at ${tilt.mx}% ${tilt.my}%, hsl(var(--primary) / 0.18), transparent 45%)`,
          }}
        />
        {/* Color halo per module */}
        <div className={`pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br ${mod.hue} opacity-60 mix-blend-overlay`} />

        <div className="relative" style={{ transform: "translateZ(40px)" }}>
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl border border-border bg-background/60 flex items-center justify-center shadow-inner">
              <Icon className="w-5 h-5 text-foreground" aria-hidden />
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{mod.group}</span>
          </div>
          <div className="mt-5 text-foreground font-medium tracking-tight text-lg">{mod.label}</div>
          <p className="mt-1 text-sm text-muted-foreground">{mod.desc}</p>
          <div className="mt-5 h-1 rounded-full bg-muted overflow-hidden">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-primary to-primary/30" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const LobbyEcosystem = () => {
  const reduce = useReducedMotion() ?? false;

  return (
    <section
      aria-label="Chronyx ecosystem"
      className="relative bg-background py-24 sm:py-32 px-6 overflow-hidden"
    >
      {/* Ambient glow that works in both themes */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.18) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, hsl(var(--primary) / 0.10) 0%, transparent 50%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto">
        {/* Heading + central orbital mark */}
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-4">The Chronyx Ecosystem</p>
          <div className="mx-auto mb-6 w-24 h-24 sm:w-28 sm:h-28 text-foreground">
            <ChronyxOrbitalLogo className="w-full h-full" animated={!reduce} glow title="Chronyx core" />
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-foreground">
            One quiet lobby.
            <span className="block text-muted-foreground">Every module of your life.</span>
          </h2>
          <p className="mt-5 max-w-xl mx-auto text-muted-foreground">
            Twenty modules, one private system of record. Hover any card to feel it dock.
          </p>
        </div>

        {/* 3D card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {MODULES.map((m) => (
            <TiltCard key={m.label} mod={m} reduce={reduce} />
          ))}
        </div>

        {/* Footer line */}
        <div className="mt-16 text-center">
          <p className="text-foreground text-lg sm:text-xl font-light tracking-tight">
            Your life, organised — without the noise.
          </p>
          <p className="text-muted-foreground text-xs mt-2 uppercase tracking-[0.3em]">
            {MODULES.length} modules · 1 dashboard
          </p>
        </div>
      </div>
    </section>
  );
};

export default LobbyEcosystem;
