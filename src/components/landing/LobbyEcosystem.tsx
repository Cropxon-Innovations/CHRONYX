import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import {
  PenTool, FileText, GraduationCap, Wallet, Receipt, TrendingUp,
  Heart, KanbanSquare, Images, GitBranch, Hourglass, Lock,
  CheckSquare, BookMarked, Zap, Target,
} from "lucide-react";
import { ChronyxOrbitalLogo } from "@/components/brand/ChronyxOrbitalLogo";

/**
 * Apple Vision–style lobby. As the user scrolls, the camera flies forward
 * through dark space; glass module panels float in from depth, rotate gently,
 * and dock around a central Chronyx orbital nucleus. Only modules present in
 * the dashboard sidebar are shown.
 */

interface Module {
  label: string;
  desc: string;
  Icon: typeof PenTool;
  hue: string; // tailwind text-color class for icon tint
  z: number;   // depth row (controls when it docks)
  col: number; // -2..2 lateral position
}

const MODULES: Module[] = [
  { label: "Noteflow",        desc: "AI notes, voice, OCR.",          Icon: PenTool,        hue: "text-violet-300",  z: 0,  col: -2 },
  { label: "Chronyx Docs",    desc: "Personal docs vault.",           Icon: FileText,       hue: "text-sky-300",     z: 0,  col: 2  },
  { label: "Study",           desc: "Syllabus, PYQs, NOVA AI.",       Icon: GraduationCap,  hue: "text-emerald-300", z: 1,  col: -2 },
  { label: "Library",         desc: "Books, PDFs, readers.",          Icon: BookMarked,     hue: "text-amber-300",   z: 1,  col: 2  },
  { label: "FinanceFlow",     desc: "Auto-imported transactions.",    Icon: Zap,            hue: "text-yellow-300",  z: 2,  col: -2 },
  { label: "Expenses",        desc: "Budgets & categories.",          Icon: Receipt,        hue: "text-rose-300",    z: 2,  col: 2  },
  { label: "Income",          desc: "Salary & passive income.",       Icon: TrendingUp,     hue: "text-green-300",   z: 3,  col: -2 },
  { label: "Loans & EMI",     desc: "Amortization & reminders.",      Icon: Wallet,         hue: "text-orange-300",  z: 3,  col: 2  },
  { label: "Insurance",       desc: "Policies & claims.",             Icon: Heart,          hue: "text-pink-300",    z: 4,  col: -2 },
  { label: "TAXYN",           desc: "Indian tax engine.",             Icon: FileText,       hue: "text-indigo-300",  z: 4,  col: 2  },
  { label: "Task Management", desc: "Jira-style boards.",             Icon: KanbanSquare,   hue: "text-cyan-300",    z: 5,  col: -2 },
  { label: "Todos",           desc: "Daily plan & timeline.",         Icon: CheckSquare,    hue: "text-teal-300",    z: 5,  col: 2  },
  { label: "Memory",          desc: "Photos & collections.",          Icon: Images,         hue: "text-fuchsia-300", z: 6,  col: -2 },
  { label: "Family Tree",     desc: "Generations & docs.",            Icon: GitBranch,      hue: "text-lime-300",    z: 6,  col: 2  },
  { label: "Lifespan",        desc: "Years left, lived well.",        Icon: Hourglass,      hue: "text-stone-300",   z: 7,  col: -2 },
  { label: "Resolutions",     desc: "Yearly intent, tracked.",        Icon: Target,         hue: "text-red-300",     z: 7,  col: 2  },
  { label: "Vault",           desc: "Passwords & secrets.",           Icon: Lock,           hue: "text-slate-300",   z: 8,  col: 0  },
];

const Panel = ({ mod, progress }: { mod: Module; progress: any }) => {
  // Each module has its own slice of scroll progress based on its z-depth row
  const totalRows = 9;
  const start = mod.z / totalRows;
  const end = (mod.z + 1.5) / totalRows;

  const z = useTransform(progress, [Math.max(0, start - 0.05), start, end], [-1200, -200, 0]);
  const opacity = useTransform(progress, [Math.max(0, start - 0.08), start, end, Math.min(1, end + 0.15)], [0, 1, 1, 0.4]);
  const blur = useTransform(progress, [Math.max(0, start - 0.05), start], [8, 0]);
  const rotateY = useTransform(progress, [start, end], [mod.col * -6, 0]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);
  const x = `${mod.col * 22}%`;

  const Icon = mod.Icon;
  return (
    <motion.div
      style={{
        translateZ: z,
        rotateY,
        opacity,
        filter,
        x,
      }}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 will-change-transform"
    >
      <div className="w-[260px] sm:w-[300px] rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-xl p-5 shadow-[0_20px_80px_-20px_rgba(80,120,255,0.35)]">
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
          <div className={`h-full w-2/3 rounded-full bg-gradient-to-r from-white/60 to-white/20`} />
        </div>
      </div>
    </motion.div>
  );
};

export const LobbyEcosystem = () => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Headline opacity stages
  const titleOpacity = useTransform(scrollYProgress, [0, 0.04, 0.12], [1, 1, 0]);
  const subOpacity   = useTransform(scrollYProgress, [0.85, 0.95], [0, 1]);
  const coreScale    = useTransform(scrollYProgress, [0, 0.5, 1], [0.6, 1, 1.15]);
  const coreOpacity  = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0.3, 0.9, 0.9, 1]);

  if (reduce) {
    // Static accessible fallback grid
    return (
      <section className="bg-[#05060a] py-24 px-6" aria-label="Chronyx ecosystem">
        <h2 className="text-center text-3xl md:text-5xl font-light text-white tracking-tight mb-12">
          One quiet lobby. <span className="text-white/60">Every module of your life.</span>
        </h2>
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
  }

  return (
    <section
      ref={ref}
      aria-label="Chronyx ecosystem lobby"
      className="relative bg-[#05060a]"
      style={{ height: "560vh" }}
    >
      {/* Sticky stage */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Ambient lobby light */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.18)_0%,_transparent_55%),radial-gradient(ellipse_at_70%_30%,_rgba(56,189,248,0.12)_0%,_transparent_50%),radial-gradient(ellipse_at_30%_70%,_rgba(244,114,182,0.10)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,_rgba(0,0,0,0.6),_transparent_30%,_transparent_70%,_rgba(0,0,0,0.85))]" />
        {/* Floor grid */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 opacity-40"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(99,102,241,0.08) 100%), repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 80px), repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 80px)",
            transform: "perspective(800px) rotateX(70deg)",
            transformOrigin: "bottom",
          }}
          aria-hidden
        />

        {/* Title intro */}
        <motion.div
          style={{ opacity: titleOpacity }}
          className="absolute inset-x-0 top-[14%] z-20 text-center px-6"
        >
          <p className="text-xs uppercase tracking-[0.4em] text-white/50 mb-3">Welcome to the lobby</p>
          <h2 className="text-4xl md:text-6xl font-light text-white tracking-tight">
            Step inside Chronyx.
          </h2>
          <p className="mt-4 text-white/60 text-sm md:text-base">Scroll. Every module of your life docks around you.</p>
        </motion.div>

        {/* 3D stage */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ perspective: "1400px", perspectiveOrigin: "50% 50%" }}
        >
          <div className="relative w-full h-full" style={{ transformStyle: "preserve-3d" }}>
            {/* Central nucleus */}
            <motion.div
              style={{ scale: coreScale, opacity: coreOpacity }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 md:w-56 md:h-56 text-white"
            >
              <ChronyxOrbitalLogo className="w-full h-full" animated glow title="Chronyx core" />
            </motion.div>

            {/* Module panels */}
            {MODULES.map((m) => (
              <Panel key={m.label} mod={m} progress={scrollYProgress} />
            ))}
          </div>
        </div>

        {/* Exit caption */}
        <motion.div
          style={{ opacity: subOpacity }}
          className="absolute inset-x-0 bottom-[12%] z-20 text-center px-6"
        >
          <p className="text-white/80 text-lg md:text-2xl font-light tracking-tight">
            Your life, organised — without the noise.
          </p>
          <p className="text-white/50 text-xs mt-2 uppercase tracking-[0.3em]">Keep scrolling</p>
        </motion.div>
      </div>
    </section>
  );
};

export default LobbyEcosystem;
