import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
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
} from "lucide-react";
import { Link } from "react-router-dom";

// Feature images
import featureTasksImg from "@/assets/landing/feature-tasks.jpg";
import featureFinanceImg from "@/assets/landing/feature-finance.jpg";
import featureLibraryImg from "@/assets/landing/feature-library.jpg";
import featureNoteflowImg from "@/assets/landing/feature-noteflow.jpg";
import featureTaxImg from "@/assets/landing/feature-tax.jpg";
import featureRewardsImg from "@/assets/landing/feature-rewards.jpg";
import featureStudyImg from "@/assets/landing/feature-study.jpg";
import featureVaultImg from "@/assets/landing/feature-vault.jpg";

interface FeatureCardData {
  icon: typeof Sparkles;
  title: string;
  description: string;
  image: string;
  gradient: string;
  glowColor: string;
  link: string;
  badge?: string;
}

const features: FeatureCardData[] = [
  {
    icon: Sparkles,
    title: "NoteFlowLM",
    description: "Transform notes into stunning images, slides & videos with AI. Your personal content engine.",
    image: featureNoteflowImg,
    gradient: "from-fuchsia-500/20 via-purple-500/10 to-indigo-500/20",
    glowColor: "shadow-fuchsia-500/20",
    link: "/app/noteflowlm",
    badge: "Flagship",
  },
  {
    icon: BookOpen,
    title: "Digital Library",
    description: "Upload, read & share books. PDF, EPUB support with built-in reader and knowledge hub.",
    image: featureLibraryImg,
    gradient: "from-cyan-500/20 via-teal-500/10 to-emerald-500/20",
    glowColor: "shadow-cyan-500/20",
    link: "/app/library",
    badge: "Popular",
  },
  {
    icon: CheckSquare,
    title: "Tasks & Productivity",
    description: "Smart task management with daily todos, priorities, streaks and productivity analytics.",
    image: featureTasksImg,
    gradient: "from-emerald-500/20 via-green-500/10 to-lime-500/20",
    glowColor: "shadow-emerald-500/20",
    link: "/app/todos",
  },
  {
    icon: Wallet,
    title: "Finance Tracker",
    description: "Track expenses, income, budgets & savings. FinanceFlow AI auto-imports from Gmail.",
    image: featureFinanceImg,
    gradient: "from-amber-500/20 via-orange-500/10 to-yellow-500/20",
    glowColor: "shadow-amber-500/20",
    link: "/app/expenses",
    badge: "New",
  },
  {
    icon: Calculator,
    title: "Tax Calculator",
    description: "Indian income tax made simple. Old vs New regime, deductions, AI assistant & PDF reports.",
    image: featureTaxImg,
    gradient: "from-violet-500/20 via-purple-500/10 to-indigo-500/20",
    glowColor: "shadow-violet-500/20",
    link: "/app/tax",
    badge: "New",
  },
  {
    icon: GraduationCap,
    title: "Study Planner",
    description: "Syllabus tracking, timetable builder, template gallery & exam countdown timers.",
    image: featureStudyImg,
    gradient: "from-blue-500/20 via-indigo-500/10 to-violet-500/20",
    glowColor: "shadow-blue-500/20",
    link: "/app/study",
  },
  {
    icon: Gift,
    title: "Rewards Hub",
    description: "Earn points for every action. Share content, complete tasks & redeem for real cashback.",
    image: featureRewardsImg,
    gradient: "from-amber-500/20 via-yellow-500/10 to-orange-500/20",
    glowColor: "shadow-amber-500/20",
    link: "/app/achievements",
    badge: "New",
  },
  {
    icon: Shield,
    title: "Document Vault",
    description: "Encrypted storage for Aadhaar, PAN, Passport & all sensitive documents. Share securely.",
    image: featureVaultImg,
    gradient: "from-zinc-500/20 via-slate-500/10 to-gray-500/20",
    glowColor: "shadow-zinc-500/20",
    link: "/app/vault",
  },
];

// Secondary features - smaller cards
const secondaryFeatures = [
  { icon: PenTool, title: "Noteflow Editor", desc: "Apple-level rich text, canvas & handwriting", link: "/app/notes" },
  { icon: Image, title: "Memory Vault", desc: "Private photo & media storage with albums", link: "/app/memory" },
  { icon: Bot, title: "NOVA AI", desc: "Personal AI assistant across all modules", link: "/app/dashboard" },
  { icon: Share2, title: "Seamless Share", desc: "Share anything instantly, earn points", link: "/app/library" },
  { icon: TreePine, title: "Family Tree", desc: "Build your genealogy records visually", link: "/app/family-tree" },
  { icon: Folder, title: "Smart Notes", desc: "Organize thoughts with tags & folders", link: "/app/notes" },
];

// Individual scroll-animated feature card
const ScrollFeatureCard = ({ feature, index }: { feature: FeatureCardData; index: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-80px" });
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 0.5, 1], [80, 0, -30]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.92, 1, 1, 0.96]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.3, 1, 1, 0.6]);
  const rotateX = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [8, 0, 0, -4]);

  const isEven = index % 2 === 0;
  const Icon = feature.icon;

  return (
    <motion.div
      ref={cardRef}
      style={{ y, scale, opacity, rotateX, perspective: 1200 }}
      className="relative will-change-transform"
    >
      <div
        className={cn(
          "group relative grid md:grid-cols-2 gap-0 rounded-3xl border border-border/40 overflow-hidden",
          "bg-card/60 backdrop-blur-xl transition-all duration-500",
          `hover:shadow-2xl hover:${feature.glowColor} hover:border-border/60`,
          "hover:bg-card/80"
        )}
      >
        {/* Image side */}
        <div className={cn("relative overflow-hidden h-64 md:h-80", isEven ? "md:order-1" : "md:order-2")}>
          <motion.img
            src={feature.image}
            alt={`${feature.title} - CHRONYX feature`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            initial={{ scale: 1.1 }}
            animate={isInView ? { scale: 1 } : { scale: 1.1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
          {/* Gradient overlay */}
          <div className={cn("absolute inset-0 bg-gradient-to-t from-card/90 via-card/20 to-transparent md:bg-gradient-to-r", isEven ? "md:from-transparent md:to-card/60" : "md:from-card/60 md:to-transparent")} />

          {/* Badge */}
          {feature.badge && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.3 }}
              className={cn(
                "absolute top-4 right-4 px-3 py-1 text-[11px] font-bold rounded-full tracking-wide",
                feature.badge === "Flagship"
                  ? "bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/30"
                  : feature.badge === "Popular"
                  ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30"
                  : "bg-gradient-to-r from-primary to-violet-600 text-primary-foreground shadow-lg shadow-primary/30"
              )}
            >
              {feature.badge}
            </motion.div>
          )}
        </div>

        {/* Content side */}
        <div className={cn("relative p-8 md:p-10 flex flex-col justify-center", isEven ? "md:order-2" : "md:order-1")}>
          {/* Subtle gradient bg */}
          <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-50`} />

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: isEven ? -20 : 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex items-center gap-3 mb-5"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-border/40 flex items-center justify-center group-hover:border-primary/30 transition-colors">
                <Icon className="w-6 h-6 text-foreground/80 group-hover:text-primary transition-colors" />
              </div>
            </motion.div>

            <motion.h3
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-2xl md:text-3xl font-semibold text-foreground mb-3 tracking-tight"
            >
              {feature.title}
            </motion.h3>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-base text-muted-foreground font-light leading-relaxed mb-6"
            >
              {feature.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Link
                to={feature.link}
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-primary transition-colors group/link"
              >
                Explore {feature.title}
                <ArrowUpRight className="w-4 h-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ScrollStackedFeatures = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      ref={sectionRef}
      className="relative px-4 sm:px-6 py-20 sm:py-32 bg-gradient-to-b from-muted/20 via-background to-muted/10"
      aria-labelledby="features-heading"
    >
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] top-1/4 -left-[200px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.04) 0%, transparent 70%)" }}
        />
        <div
          className="absolute w-[500px] h-[500px] top-2/3 -right-[150px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(280 60% 60% / 0.03) 0%, transparent 70%)" }}
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
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-5 tracking-tight"
            style={{ color: "hsl(var(--chronyx-brand))" }}
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
            Your complete digital ecosystem — library, tasks, finance, rewards, and seamless sharing. All in one beautiful space.
          </motion.p>
        </div>

        {/* Primary feature cards - scroll-animated */}
        <div className="space-y-8 sm:space-y-12 mb-16 sm:mb-24">
          {features.map((feature, index) => (
            <ScrollFeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>

        {/* Secondary features grid */}
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
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.5 }}
                >
                  <Link to={feature.link} className="block group">
                    <div className="relative p-5 sm:p-6 rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm hover:bg-card/70 hover:border-border/60 hover:shadow-lg transition-all duration-300">
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
