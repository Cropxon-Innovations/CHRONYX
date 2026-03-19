import { useRef } from "react";
import { motion, useScroll, useTransform, useInView, useMotionValueEvent } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  PenTool,
  CheckSquare,
  Wallet,
  Calculator,
  BookOpen,
  Gift,
  Shield,
  Share2,
  GraduationCap,
  Image,
  Bot,
  Folder,
  TreePine,
  ArrowUpRight,
  CalendarDays,
  BookOpenCheck,
  FileText,
  Sheet,
} from "lucide-react";
import { Link } from "react-router-dom";

import featureTasksImg from "@/assets/landing/feature-tasks.jpg";
import featureFinanceImg from "@/assets/landing/feature-finance.jpg";
import featureLibraryImg from "@/assets/landing/feature-library.jpg";
import featureNoteflowImg from "@/assets/landing/feature-noteflow.jpg";
import featureTaxImg from "@/assets/landing/feature-tax.jpg";
import featureRewardsImg from "@/assets/landing/feature-rewards.jpg";
import featureStudyImg from "@/assets/landing/feature-study.jpg";
import featureVaultImg from "@/assets/landing/feature-vault.jpg";
import featureCalendarImg from "@/assets/landing/feature-calendar.jpg";
import featureBookreaderImg from "@/assets/landing/feature-bookreader.jpg";
import featureDocsImg from "@/assets/landing/feature-docs.jpg";
import featureSheetsImg from "@/assets/landing/feature-sheets.jpg";

interface FeatureCardData {
  icon: typeof Sparkles;
  title: string;
  description: string;
  image: string;
  gradient: string;
  link: string;
  badge?: string;
  tags?: string[];
  accentColor: string;
}

const features: FeatureCardData[] = [
  {
    icon: Sparkles,
    title: "NoteFlow",
    description: "AI-powered note-taking that transforms your thoughts into stunning images, slides & videos. Rich text, canvas & handwriting in one creative engine.",
    image: featureNoteflowImg,
    gradient: "from-fuchsia-500/20 via-purple-500/10 to-indigo-500/20",
    link: "/app/noteflowlm",
    badge: "Flagship",
    tags: ["AI Powered", "Rich Text", "Canvas"],
    accentColor: "from-fuchsia-500 to-purple-600",
  },
  {
    icon: FileText,
    title: "CHRONYX Docs",
    description: "Beautiful word processing — no license needed. AI writing assistant, templates, real-time collaboration & export to PDF, DOCX, Markdown.",
    image: featureDocsImg,
    gradient: "from-blue-500/20 via-sky-500/10 to-cyan-500/20",
    link: "/app/notes",
    badge: "Free Forever",
    tags: ["No License", "AI Writing", "Export"],
    accentColor: "from-blue-500 to-cyan-500",
  },
  {
    icon: Sheet,
    title: "CHRONYX Sheets",
    description: "AI-powered spreadsheets with smart formulas, auto-generated charts & data visualization. Excel-grade power, completely free.",
    image: featureSheetsImg,
    gradient: "from-emerald-500/20 via-green-500/10 to-teal-500/20",
    link: "/app/sheets",
    badge: "AI Powered",
    tags: ["Smart Charts", "Free", "Auto Formulas"],
    accentColor: "from-emerald-500 to-teal-500",
  },
  {
    icon: CalendarDays,
    title: "Customizable Calendar",
    description: "Day, week & month views with reminders, event tracking & cross-device sync. Apple-level design polish for your schedule.",
    image: featureCalendarImg,
    gradient: "from-rose-500/20 via-pink-500/10 to-fuchsia-500/20",
    link: "/app/calendar",
    badge: "New",
    tags: ["Sync", "Reminders", "Views"],
    accentColor: "from-rose-500 to-pink-500",
  },
  {
    icon: BookOpenCheck,
    title: "Page Book Reader",
    description: "Apple Books-style reading with page-flip animations, Day/Sepia/Night themes, highlights, bookmarks & progress sync.",
    image: featureBookreaderImg,
    gradient: "from-amber-500/20 via-orange-500/10 to-yellow-500/20",
    link: "/app/library",
    badge: "Premium",
    tags: ["Page Flip", "Themes", "Highlights"],
    accentColor: "from-amber-500 to-orange-500",
  },
  {
    icon: BookOpen,
    title: "Digital Library",
    description: "Upload, read & share books. PDF, EPUB support with built-in reader and knowledge hub.",
    image: featureLibraryImg,
    gradient: "from-cyan-500/20 via-teal-500/10 to-emerald-500/20",
    link: "/app/library",
    badge: "Popular",
    tags: ["PDF", "EPUB", "Share"],
    accentColor: "from-cyan-500 to-teal-500",
  },
  {
    icon: CheckSquare,
    title: "Tasks & Productivity",
    description: "Smart task management with daily todos, priorities, streaks and productivity analytics.",
    image: featureTasksImg,
    gradient: "from-emerald-500/20 via-green-500/10 to-lime-500/20",
    link: "/app/todos",
    tags: ["Streaks", "Analytics", "Priorities"],
    accentColor: "from-green-500 to-emerald-500",
  },
  {
    icon: Wallet,
    title: "Finance Tracker",
    description: "Track expenses, income, budgets & savings. FinanceFlow AI auto-imports from Gmail.",
    image: featureFinanceImg,
    gradient: "from-amber-500/20 via-orange-500/10 to-yellow-500/20",
    link: "/app/expenses",
    badge: "New",
    tags: ["AI Import", "Budgets", "Analytics"],
    accentColor: "from-orange-500 to-amber-500",
  },
  {
    icon: Calculator,
    title: "Tax Calculator",
    description: "Indian income tax made simple. Old vs New regime, deductions, AI assistant & PDF reports.",
    image: featureTaxImg,
    gradient: "from-violet-500/20 via-purple-500/10 to-indigo-500/20",
    link: "/app/tax",
    tags: ["India", "Deductions", "PDF"],
    accentColor: "from-violet-500 to-indigo-500",
  },
  {
    icon: GraduationCap,
    title: "Study Planner",
    description: "Syllabus tracking, timetable builder, template gallery & exam countdown timers.",
    image: featureStudyImg,
    gradient: "from-blue-500/20 via-indigo-500/10 to-violet-500/20",
    link: "/app/study",
    tags: ["Timetable", "Exams", "Templates"],
    accentColor: "from-blue-500 to-indigo-500",
  },
  {
    icon: Gift,
    title: "Rewards Hub",
    description: "Earn points for every action. Share content, complete tasks & redeem for real cashback.",
    image: featureRewardsImg,
    gradient: "from-amber-500/20 via-yellow-500/10 to-orange-500/20",
    link: "/app/achievements",
    badge: "New",
    tags: ["Points", "Cashback", "Gamified"],
    accentColor: "from-yellow-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "Document Vault",
    description: "Encrypted storage for Aadhaar, PAN, Passport & all sensitive documents. Share securely.",
    image: featureVaultImg,
    gradient: "from-zinc-500/20 via-slate-500/10 to-gray-500/20",
    link: "/app/vault",
    tags: ["Encrypted", "Secure Share", "OCR"],
    accentColor: "from-slate-500 to-zinc-600",
  },
];

const secondaryFeatures = [
  { icon: PenTool, title: "Noteflow Editor", desc: "Apple-level rich text, canvas & handwriting", link: "/app/notes" },
  { icon: Image, title: "Memory Vault", desc: "Private photo & media storage with albums", link: "/app/memory" },
  { icon: Bot, title: "NOVA AI", desc: "Personal AI assistant across all modules", link: "/app/dashboard" },
  { icon: Share2, title: "Seamless Share", desc: "Share anything instantly, earn points", link: "/app/library" },
  { icon: TreePine, title: "Family Tree", desc: "Build your genealogy records visually", link: "/app/family-tree" },
  { icon: Folder, title: "Smart Notes", desc: "Organize thoughts with tags & folders", link: "/app/notes" },
];

/* ─── 3D Stacked Feature Card ─── */
const ScrollFeatureCard = ({ feature, index, total }: { feature: FeatureCardData; index: number; total: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-40px" });
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });

  // 3D parallax transforms
  const y = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [120, 0, 0, -60]);
  const scale = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0.85, 1, 1, 0.92]);
  const opacity = useTransform(scrollYProgress, [0, 0.12, 0.88, 1], [0, 1, 1, 0.3]);
  const rotateX = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [15, 0, 0, -8]);
  const rotateY = useTransform(scrollYProgress, [0, 0.5, 1], [index % 2 === 0 ? -5 : 5, 0, index % 2 === 0 ? 3 : -3]);
  const translateZ = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [-80, 0, 0, -40]);

  // Image parallax
  const imgY = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const imgScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.15, 1, 1.05]);

  const isEven = index % 2 === 0;
  const Icon = feature.icon;

  return (
    <motion.div
      ref={cardRef}
      style={{
        y,
        scale,
        opacity,
        rotateX,
        rotateY,
        z: translateZ,
        transformStyle: "preserve-3d",
        transformPerspective: 1200,
      }}
      className="relative will-change-transform"
    >
      {/* Stacked card shadow layers */}
      <div className="absolute -bottom-2 left-3 right-3 h-full rounded-3xl bg-card/20 border border-border/10 -z-10 blur-[1px]" />
      <div className="absolute -bottom-4 left-6 right-6 h-full rounded-3xl bg-card/10 border border-border/5 -z-20 blur-[2px]" />

      <div
        className={cn(
          "group relative grid md:grid-cols-2 gap-0 rounded-3xl border border-border/40 overflow-hidden",
          "bg-card/70 backdrop-blur-xl transition-all duration-700",
          "hover:shadow-2xl hover:border-border/60 hover:bg-card/90",
          "hover:-translate-y-1"
        )}
      >
        {/* Image side with 3D parallax */}
        <div className={cn("relative overflow-hidden h-64 md:h-[360px]", isEven ? "md:order-1" : "md:order-2")}>
          <motion.div style={{ y: imgY, scale: imgScale }} className="w-full h-full">
            <img
              src={feature.image}
              alt={`${feature.title} - CHRONYX feature`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </motion.div>

          {/* Gradient overlay */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent",
            "md:bg-gradient-to-r",
            isEven ? "md:from-transparent md:via-transparent md:to-card/80" : "md:from-card/80 md:via-transparent md:to-transparent"
          )} />

          {/* Floating badge */}
          {feature.badge && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: -15 }}
              animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
              transition={{ delay: 0.35, type: "spring", stiffness: 300, damping: 15 }}
              className={cn(
                "absolute top-4 right-4 px-3.5 py-1.5 text-[10px] font-bold rounded-full tracking-widest uppercase",
                "shadow-xl backdrop-blur-sm",
                `bg-gradient-to-r ${feature.accentColor} text-white`
              )}
            >
              {feature.badge}
            </motion.div>
          )}

          {/* Feature number indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 0.08 } : {}}
            transition={{ delay: 0.2 }}
            className={cn(
              "absolute bottom-4 text-[120px] font-black leading-none pointer-events-none select-none",
              isEven ? "left-4" : "right-4"
            )}
          >
            {String(index + 1).padStart(2, "0")}
          </motion.div>
        </div>

        {/* Content side */}
        <div className={cn("relative p-8 md:p-12 flex flex-col justify-center", isEven ? "md:order-2" : "md:order-1")}>
          <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-40`} />

          <div className="relative z-10">
            {/* Icon */}
            <motion.div
              initial={{ opacity: 0, x: isEven ? -30 : 30, rotateY: isEven ? -20 : 20 }}
              animate={isInView ? { opacity: 1, x: 0, rotateY: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.7, type: "spring" }}
              className="mb-6"
            >
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center",
                "bg-gradient-to-br from-muted/80 to-muted/40 border border-border/50",
                "group-hover:border-primary/30 transition-all duration-500",
                "group-hover:shadow-lg"
              )}>
                <Icon className="w-7 h-7 text-foreground/70 group-hover:text-primary transition-colors duration-300" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h3
              initial={{ opacity: 0, y: 25 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-2xl md:text-3xl font-semibold text-foreground mb-3 tracking-tight"
            >
              {feature.title}
            </motion.h3>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-base text-muted-foreground font-light leading-relaxed mb-5"
            >
              {feature.description}
            </motion.p>

            {/* Tags */}
            {feature.tags && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.45, duration: 0.5 }}
                className="flex flex-wrap gap-2 mb-6"
              >
                {feature.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest rounded-full bg-muted/50 text-muted-foreground border border-border/30"
                  >
                    {tag}
                  </span>
                ))}
              </motion.div>
            )}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.55, duration: 0.5 }}
            >
              <Link
                to={feature.link}
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium",
                  "bg-gradient-to-r text-white shadow-lg transition-all duration-300",
                  "hover:shadow-xl hover:-translate-y-0.5",
                  feature.accentColor
                )}
              >
                Explore {feature.title}
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Main Section ─── */
const ScrollStackedFeatures = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative px-4 sm:px-6 py-20 sm:py-32 bg-gradient-to-b from-muted/20 via-background to-muted/10"
      aria-labelledby="features-heading"
    >
      {/* Ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[700px] h-[700px] top-[10%] -left-[250px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.05) 0%, transparent 70%)" }}
        />
        <div
          className="absolute w-[600px] h-[600px] top-[40%] -right-[200px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(280 60% 60% / 0.04) 0%, transparent 70%)" }}
        />
        <div
          className="absolute w-[500px] h-[500px] top-[70%] left-[20%] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(200 70% 50% / 0.03) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 border border-border/40 rounded-full text-xs font-medium text-muted-foreground tracking-wider uppercase mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Complete Ecosystem
          </motion.div>

          <motion.h2
            id="features-heading"
            initial={{ opacity: 0, y: 30, rotateX: 10 }}
            animate={headerInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.8, type: "spring" }}
            className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-5 tracking-tight"
            style={{ color: "hsl(var(--chronyx-brand))", transformPerspective: 800 }}
          >
            Everything you need,{" "}
            <span className="bg-gradient-to-r from-primary via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              nothing you don't
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-lg sm:text-xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed"
          >
            Docs, Sheets, Calendar, Reader, Notes, Finance, Rewards — all AI-powered, free & beautifully crafted. Save locally or sync online.
          </motion.p>

          {/* Feature count */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={headerInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-8 inline-flex items-center gap-6 text-sm text-muted-foreground"
          >
            <span className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{features.length}</span>
              Core Modules
            </span>
            <span className="w-px h-4 bg-border" />
            <span className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{secondaryFeatures.length}+</span>
              Extra Tools
            </span>
          </motion.div>
        </div>

        {/* Primary feature cards with 3D stacking */}
        <div className="space-y-10 sm:space-y-14 mb-16 sm:mb-24" style={{ perspective: 1400 }}>
          {features.map((feature, index) => (
            <ScrollFeatureCard key={feature.title} feature={feature} index={index} total={features.length} />
          ))}
        </div>

        {/* Secondary features */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-2 tracking-tight">And so much more</h3>
            <p className="text-sm text-muted-foreground font-light">Every tool you need, thoughtfully crafted</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {secondaryFeatures.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30, rotateX: 12 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.5, type: "spring", stiffness: 150 }}
                  style={{ transformPerspective: 800 }}
                >
                  <Link to={feature.link} className="block group">
                    <div className="relative p-5 sm:p-6 rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm hover:bg-card/70 hover:border-border/60 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                      <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                        <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground mb-1">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground font-light leading-relaxed">{feature.desc}</p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScrollStackedFeatures;
