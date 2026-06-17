import { motion, useScroll, useTransform, useReducedMotion, MotionValue } from "framer-motion";
import { useRef, useMemo } from "react";
import {
  PenTool, FileText, GraduationCap, Wallet, Receipt, TrendingUp,
  Heart, KanbanSquare, Images, GitBranch, Hourglass, Lock,
  CheckSquare, BookMarked, Zap, Target, Users, Trophy, PieChart,
} from "lucide-react";
import { ChronyxOrbitalLogo } from "@/components/brand/ChronyxOrbitalLogo";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Apple Vision–style lobby. The camera flies forward through a dark
 * "lobby"; glass module panels float in from depth and dock around a
 * central Chronyx orbital nucleus.
 *
 * Only modules that exist in the dashboard sidebar are shown.
 * On mobile and prefers-reduced-motion we fall back to a static,
 * accessible grid for smoothness + battery.
 */

interface Module {
  label: string;
  desc: string;
  Icon: typeof PenTool;
  hue: string;
  row: number;
  col: -1 | 1;
}

// Sourced from AppSidebar.tsx — keep in sync.
const MODULES: Module[] = [
  { label: "Todos",           desc: "Daily plan & timeline.",         Icon: CheckSquare,    hue: "text-teal-300",    row: 0, col: -1 },
  { label: "Noteflow",        desc: "AI notes, voice, OCR.",          Icon: PenTool,        hue: "text-violet-300",  row: 0, col:  1 },
  { label: "Study",           desc: "Syllabus, PYQs, NOVA AI.",       Icon: GraduationCap,  hue: "text-emerald-300", row: 1, col: -1 },
  { label: "Library",         desc: "Books, PDFs, readers.",          Icon: BookMarked,     hue: "text-amber-300",   row: 1, col:  1 },
  { label: "FinanceFlow",     desc: "Auto-imported transactions.",    Icon: Zap,            hue: "text-yellow-300",  row: 2, col: -1 },
  { label: "Expenses",        desc: "Budgets & categories.",          Icon: Receipt,        hue: "text-rose-300",    row: 2, col:  1 },
  { label: "Income",          desc: "Salary & passive income.",       Icon: TrendingUp,     hue: "text-green-300",   row: 3, col: -1 },
  { label: "Reports & Budget",desc: "Spend insights & forecasts.",    Icon: PieChart,       hue: "text-sky-300",     row: 3, col:  1 },
  { label: "Loans & EMI",     desc: "Amortization & reminders.",      Icon: Wallet,         hue: "text-orange-300",  row: 4, col: -1 },
  { label: "Insurance",       desc: "Policies & claims.",             Icon: Heart,          hue: "text-pink-300",    row: 4, col:  1 },
  { label: "TAXYN",           desc: "Indian tax engine.",             Icon: FileText,       hue: "text-indigo-300",  row: 5, col: -1 },
  { label: "Documents",       desc: "Personal docs vault.",           Icon: FileText,       hue: "text-cyan-300",    row: 5, col:  1 },
  { label: "Task Management", desc: "Jira-style boards.",             Icon: KanbanSquare,   hue: "text-blue-300",    row: 6, col: -1 },
  { label: "Memory",          desc: "Photos & collections.",          Icon: Images,         hue: "text-fuchsia-300", row: 6, col:  1 },
  { label: "Family Tree",     desc: "Generations & docs.",            Icon: GitBranch,      hue: "text-lime-300",    row: 7, col: -1 },
  { label: "Social",          desc: "15+ platforms unified.",         Icon: Users,          hue: "text-purple-300",  row: 7, col:  1 },
  { label: "Lifespan",        desc: "Years left, lived well.",        Icon: Hourglass,      hue: "text-stone-300",   row: 8, col: -1 },
  { label: "Resolutions",     desc: "Yearly intent, tracked.",        Icon: Target,         hue: "text-red-300",     row: 8, col:  1 },
  { label: "Achievements",    desc: "Streaks & milestones.",          Icon: Trophy,         hue: "text-yellow-200",  row: 9, col: -1 },
  { label: "Vault",           desc: "Passwords & secrets.",           Icon: Lock,           hue: "text-slate-300",   row: 9, col:  1 },
];

const TOTAL_ROWS = 10;

const Panel = ({ mod, progress }: { mod: Module; progress: MotionValue<number> }) => {
  // Each row docks across its own scroll slice.
  const start = mod.row / TOTAL_ROWS;
  const end = (mod.row + 1.4) / TOTAL_ROWS;

  // Use only transform/opacity (compositor-friendly). No CSS blur.
  const z = useTransform(progress, [Math.max(0, start - 0.04), start, end], [-900, -180, 0]);
  const opacity = useTransform(
    progress,
    [Math.max(0, start - 0.06), start, end, Math.min(1, end + 0.18)],
    [0, 1, 1, 0.35]
  );
  const x = `${mod.col * 22}%`;

  const Icon = mod.Icon;
  return (
    <motion.div
      style={{ translateZ: z, opacity, x }}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 will-change-transform"
    >
      <div className="w-[260px] sm:w-[300px] rounded-2xl border border-white/15 bg-white/[0.07] backdrop-blur-xl p-5 shadow-[0_20px_80px_-20px_rgba(80,120,255,0.45)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
            <Icon className={`w-5 h-5 ${mod.hue}`} aria-hidden />
          </div>
          <div>
            <div className="text-white font-medium tracking-tight">{mod.label}</div>
            <div className="text-white/60 text-xs">{mod.desc}</div>
          </div>
        </div>
        <div className="mt-4 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-white/60 to-white/20" />
        </div>
      </div>
    </motion.div>
  );
};

const StaticGrid = () => (
  <section className="bg-[#05060a] py-24 px-6" aria-label="Chronyx ecosystem">
    <div className="max-w-6xl mx-auto text-center mb-14">
      <p className="text-xs uppercase tracking-[0.4em] text-white/50 mb-3">The lobby</p>
      <h2 className="text-3xl md:text-5xl font-light text-white tracking-tight">
        One quiet lobby. <span className="text-white/60">Every module of your life.</span>
      </h2>
    </div>
    <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {MODULES.map((m) => (
        <div key={m.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <m.Icon className={`w-5 h-5 ${m.hue} mb-3`} aria-hidden />
          <div className="text-white font-medium">{m.label}</div>
          <div className="text-white/60 text-xs">{m.desc}</div>
        </div>
      ))}
    </div>
  </section>
);

export const LobbyEcosystem = () => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const titleOpacity = useTransform(scrollYProgress, [0, 0.04, 0.12], [1, 1, 0]);
  const subOpacity   = useTransform(scrollYProgress, [0.85, 0.95], [0, 1]);
  const coreScale    = useTransform(scrollYProgress, [0, 0.5, 1], [0.65, 1, 1.15]);
  const coreOpacity  = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0.4, 0.95, 0.95, 1]);

  // Mobile / reduced motion: skip the heavy 3D scene.
  if (reduce || isMobile) return <StaticGrid />;

  // ~60vh per row of modules, capped — keeps scroll feel snappy.
  const height = useMemo(() => `${Math.min(TOTAL_ROWS * 55, 600)}vh`, []);

  return (
    <section
      ref={ref}
      aria-label="Chronyx ecosystem lobby"
      className="relative bg-[#05060a]"
      style={{ height }}
    >
      {/* Sticky stage — always dark so it reads on both themes */}
      <div className="sticky top-0 h-screen overflow-hidden text-white">
        {/* Ambient lobby light */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.20)_0%,_transparent_55%),radial-gradient(ellipse_at_70%_30%,_rgba(56,189,248,0.14)_0%,_transparent_50%),radial-gradient(ellipse_at_30%_70%,_rgba(244,114,182,0.12)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,_rgba(0,0,0,0.6),_transparent_30%,_transparent_70%,_rgba(0,0,0,0.9))]" />

        {/* Floor grid */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 opacity-40 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(99,102,241,0.10) 100%), repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 80px), repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 80px)",
            transform: "perspective(800px) rotateX(70deg)",
            transformOrigin: "bottom",
          }}
          aria-hidden
        />

        {/* Intro title */}
        <motion.div
          style={{ opacity: titleOpacity }}
          className="absolute inset-x-0 top-[12%] z-20 text-center px-6"
        >
          <p className="text-xs uppercase tracking-[0.4em] text-white/50 mb-3">Welcome to the lobby</p>
          <h2 className="text-4xl md:text-6xl font-light tracking-tight">Step inside Chronyx.</h2>
          <p className="mt-4 text-white/60 text-sm md:text-base">
            Scroll. Every module of your life docks around you.
          </p>
        </motion.div>

        {/* 3D stage */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ perspective: "1400px", perspectiveOrigin: "50% 50%" }}
        >
          <div className="relative w-full h-full" style={{ transformStyle: "preserve-3d" }}>
            <motion.div
              style={{ scale: coreScale, opacity: coreOpacity }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 md:w-56 md:h-56 text-white"
            >
              <ChronyxOrbitalLogo className="w-full h-full" animated glow title="Chronyx core" />
            </motion.div>

            {MODULES.map((m) => (
              <Panel key={m.label} mod={m} progress={scrollYProgress} />
            ))}
          </div>
        </div>

        {/* Exit caption */}
        <motion.div
          style={{ opacity: subOpacity }}
          className="absolute inset-x-0 bottom-[10%] z-20 text-center px-6"
        >
          <p className="text-lg md:text-2xl font-light tracking-tight text-white/85">
            Your life, organised — without the noise.
          </p>
          <p className="text-white/50 text-xs mt-2 uppercase tracking-[0.3em]">Keep scrolling</p>
        </motion.div>
      </div>
    </section>
  );
};

export default LobbyEcosystem;
