import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckSquare, 
  BookOpen, 
  Wallet, 
  Clock, 
  Heart, 
  Shield, 
  Image,
  Play,
  ChevronDown,
  Lock,
  Download,
  Eye,
  X,
  Check,
  Sparkles,
  Crown,
  Zap,
  Monitor,
  Apple,
  WifiOff,
  RefreshCw,
  Calculator,
  ArrowRight,
  Star,
  ChevronRight,
  FileText,
  TrendingUp,
  PiggyBank
} from "lucide-react";
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";
import chronyxPhilosophy from "@/assets/chronyx-philosophy.png";
import SketchBorderCard from "@/components/landing/SketchBorderCard";
import { 
  FloatingSketchElements, 
  SketchUnderline, 
  HeroSketchFrame,
  SectionConnector 
} from "@/components/landing/SketchAnimations";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/landing/ScrollReveal";
import LandingNav from "@/components/landing/LandingNav";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// CHRONYX Logo Component
const ChronxyxLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" stroke="url(#logo-gradient)" strokeWidth="2" fill="none" className="opacity-80" />
    <circle cx="50" cy="50" r="35" stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="6 4" fill="none" className="opacity-40" />
    <circle cx="50" cy="50" r="5" fill="hsl(var(--primary))" className="opacity-90" />
    {[0, 90, 180, 270].map((angle, i) => (
      <circle 
        key={i}
        cx={50 + 40 * Math.cos((angle - 90) * Math.PI / 180)}
        cy={50 + 40 * Math.sin((angle - 90) * Math.PI / 180)}
        r="2"
        fill="hsl(var(--primary))"
        className="opacity-50"
      />
    ))}
  </svg>
);

// Animated Live Preview Component
const AnimatedDashboardPreview = () => {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ["Dashboard", "Tasks", "Finance", "Tax"];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % tabs.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
      className="relative"
    >
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 via-transparent to-violet-500/10 rounded-3xl blur-2xl" />
      
      {/* Browser frame */}
      <div className="relative bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
        {/* Browser header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/30">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
          </div>
          <div className="flex-1 mx-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-background/50 rounded-md text-xs text-muted-foreground">
              <Lock className="w-3 h-3 text-green-500" />
              <span>chronyx.app/dashboard</span>
            </div>
          </div>
        </div>
        
        {/* App content */}
        <div className="p-4 min-h-[280px] bg-background/80">
          {/* Tab navigation */}
          <div className="flex gap-1 mb-4 bg-muted/30 p-1 rounded-lg w-fit">
            {tabs.map((tab, i) => (
              <motion.button
                key={tab}
                className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                  activeTab === i
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                animate={{ scale: activeTab === i ? 1 : 0.98 }}
              >
                {tab}
              </motion.button>
            ))}
          </div>
          
          {/* Animated content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {activeTab === 0 && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <p className="text-[10px] text-muted-foreground">Income</p>
                      <p className="text-lg font-semibold text-green-600">₹12.5L</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <p className="text-[10px] text-muted-foreground">Savings</p>
                      <p className="text-lg font-semibold text-blue-600">₹3.2L</p>
                    </div>
                    <div className="p-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
                      <p className="text-[10px] text-muted-foreground">Tasks</p>
                      <p className="text-lg font-semibold text-violet-600">12/15</p>
                    </div>
                  </div>
                  <div className="h-24 bg-gradient-to-r from-primary/5 to-violet-500/5 rounded-lg border border-border/30 flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-primary/30" />
                  </div>
                </>
              )}
              
              {activeTab === 1 && (
                <div className="space-y-2">
                  {["Complete tax filing", "Review insurance", "Update budget"].map((task, i) => (
                    <motion.div
                      key={task}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/20"
                    >
                      <div className={`w-4 h-4 rounded border-2 ${i === 0 ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                        {i === 0 && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm ${i === 0 ? "line-through text-muted-foreground" : ""}`}>{task}</span>
                    </motion.div>
                  ))}
                </div>
              )}
              
              {activeTab === 2 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <PiggyBank className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Emergency Fund</span>
                    </div>
                    <span className="text-sm font-medium">₹2.5L</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Monthly Budget</span>
                    </div>
                    <span className="text-sm font-medium">₹45K</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                      initial={{ width: "0%" }}
                      animate={{ width: "68%" }}
                      transition={{ duration: 1, delay: 0.3 }}
                    />
                  </div>
                </div>
              )}
              
              {activeTab === 3 && (
                <div className="space-y-3">
                  <div className="p-3 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-lg border border-violet-500/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-muted-foreground">Tax Payable (New Regime)</span>
                      <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-600 rounded">Optimal</span>
                    </div>
                    <p className="text-2xl font-bold text-violet-600">₹52,000</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 p-2 bg-muted/30 rounded text-center">
                      <p className="text-[9px] text-muted-foreground">80C</p>
                      <p className="text-xs font-medium">₹1.5L</p>
                    </div>
                    <div className="flex-1 p-2 bg-muted/30 rounded text-center">
                      <p className="text-[9px] text-muted-foreground">80D</p>
                      <p className="text-xs font-medium">₹25K</p>
                    </div>
                    <div className="flex-1 p-2 bg-muted/30 rounded text-center">
                      <p className="text-[9px] text-muted-foreground">NPS</p>
                      <p className="text-xs font-medium">₹50K</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Tab indicator */}
        <div className="flex justify-center gap-1.5 py-3 bg-muted/20 border-t border-border/20">
          {tabs.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                activeTab === i ? "bg-primary w-4" : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const Landing = () => {
  const [mounted, setMounted] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [showDesktopDialog, setShowDesktopDialog] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  const features = [
    { icon: CheckSquare, label: "Tasks", desc: "Daily todos & productivity", sketch: "M" },
    { icon: BookOpen, label: "Study", desc: "Syllabus & learning tracker", sketch: "◇" },
    { icon: Wallet, label: "Finance", desc: "Budget, loans & savings", sketch: "△" },
    { icon: Calculator, label: "Tax", desc: "Smart Indian tax calculator", sketch: "⬡", highlight: true },
    { icon: Heart, label: "Insurance", desc: "Policy management", sketch: "○" },
    { icon: Image, label: "Memory", desc: "Private photo vault", sketch: "□" },
    { icon: Clock, label: "Lifespan", desc: "Time visualization", sketch: "◎" },
  ];

  const stats = [
    { value: "10K+", label: "Users" },
    { value: "99.9%", label: "Uptime" },
    { value: "256-bit", label: "Encryption" },
    { value: "0", label: "Ads" },
  ];

  return (
    <motion.main 
      className="relative min-h-screen w-full overflow-x-hidden bg-chronyx-landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      role="main"
      aria-label="CHRONYX - Personal System of Record | Tax Calculator | Finance Tracker"
    >
      {/* SEO-optimized meta description via aria */}
      <span className="sr-only">
        CHRONYX is a private personal system of record for managing your life - tasks, finances, tax calculations, 
        insurance policies, and memories. Indian Income Tax Calculator with Old vs New Regime comparison. 
        Built by Cropxon Innovations.
      </span>

      {/* Subtle background elements */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} 
      />

      {/* Grid pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full opacity-[0.015]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="landing-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-foreground" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#landing-grid)" />
        </svg>
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--chronyx-landing-vignette))_100%)]" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Navigation */}
        <LandingNav onDesktopDownload={() => setShowDesktopDialog(true)} />

        {/* Spacer */}
        <div className="h-16" />

        {/* HERO SECTION - Minimal & Clean */}
        <section className="relative flex-1 flex items-center justify-center px-4 sm:px-6 py-12 lg:py-16">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              
              {/* Left - Content */}
              <div className="text-center lg:text-left space-y-6">
                {/* Logo + Badge */}
                <motion.div 
                  className="flex items-center justify-center lg:justify-start gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <ChronxyxLogo className="w-12 h-12" />
                  <div className="flex flex-col items-start">
                    <span className="text-2xl font-light tracking-[0.2em] text-foreground">CHRONYX</span>
                    <span className="text-[10px] text-muted-foreground tracking-widest">PERSONAL SYSTEM OF RECORD</span>
                  </div>
                </motion.div>

                {/* Main Headline - H1 for SEO */}
                <motion.h1 
                  className="text-3xl sm:text-4xl lg:text-5xl font-extralight leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                >
                  <span className="text-foreground">A quiet space</span>
                  <br />
                  <span className="text-muted-foreground">for your life.</span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p 
                  className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto lg:mx-0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  Tasks, finances, tax calculations, insurance, and memories — 
                  all in one private, minimal dashboard. <strong className="text-foreground">No ads. No tracking.</strong>
                </motion.p>

                {/* Feature highlights */}
                <motion.div 
                  className="flex flex-wrap items-center justify-center lg:justify-start gap-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  {[
                    { icon: Calculator, label: "Tax Calculator", highlight: true },
                    { icon: Wallet, label: "Finance" },
                    { icon: CheckSquare, label: "Tasks" },
                    { icon: Shield, label: "Private" },
                  ].map((item) => (
                    <div 
                      key={item.label}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                        item.highlight 
                          ? "border-primary/40 bg-primary/5 text-primary" 
                          : "border-border/30 bg-card/20 text-muted-foreground hover:text-foreground hover:border-primary/30"
                      }`}
                    >
                      <item.icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                      {item.highlight && <Sparkles className="w-3 h-3" />}
                    </div>
                  ))}
                </motion.div>

                {/* CTA Buttons */}
                <motion.div 
                  className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <Link to="/login">
                    <button className="group flex items-center gap-2 px-6 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                      Get Started Free
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </Link>
                  
                  <button 
                    onClick={() => setShowDemo(true)}
                    className="flex items-center gap-2 px-5 py-3 text-sm text-muted-foreground border border-border/40 rounded-lg hover:border-primary/30 hover:text-foreground transition-all"
                  >
                    <Play className="w-4 h-4" />
                    Watch Demo
                  </button>
                </motion.div>

                {/* PWA Install */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                >
                  <PWAInstallPrompt variant="hero" />
                </motion.div>

                {/* Trust indicators */}
                <motion.div 
                  className="flex items-center justify-center lg:justify-start gap-6 pt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                >
                  {stats.map((stat) => (
                    <div key={stat.label} className="text-center">
                      <p className="text-lg font-semibold text-foreground">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Right - Animated Preview */}
              <div className="hidden lg:block">
                <AnimatedDashboardPreview />
              </div>
            </div>

            {/* Scroll indicator */}
            <motion.div 
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              <span className="text-[10px] tracking-widest uppercase">Explore</span>
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </motion.div>
          </div>
        </section>

        {/* WHAT IS CHRONYX */}
        <ScrollReveal direction="up" delay={0.1}>
          <section className="px-4 sm:px-6 py-16 border-t border-border/20" aria-labelledby="what-is-chronyx">
            <article className="max-w-2xl mx-auto text-center">
              <h2 id="what-is-chronyx" className="text-2xl font-light text-foreground mb-4">
                What is CHRONYX?
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                CHRONYX is a <strong className="text-foreground">personal system of record</strong> — 
                a quiet place to hold the threads of your life. Tasks, knowledge, finances, tax calculations, and memories.
                Not a productivity tool. Just a place for continuity.
              </p>
            </article>
          </section>
        </ScrollReveal>

        {/* FEATURES GRID */}
        <ScrollReveal direction="up" delay={0.1}>
          <section id="features" className="px-4 sm:px-6 py-16 bg-card/20">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-center text-2xl font-light text-foreground mb-3">
                Everything you need, nothing you don't
              </h2>
              <p className="text-center text-muted-foreground mb-10 max-w-lg mx-auto text-sm">
                A personal dashboard for tasks, studies, finances, taxes, insurance, and memories
              </p>
              
              <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" staggerDelay={0.08}>
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <StaggerItem key={feature.label}>
                      <div className={`group relative p-4 rounded-xl border transition-all hover:shadow-md ${
                        feature.highlight 
                          ? "border-primary/30 bg-gradient-to-br from-primary/5 to-violet-500/5" 
                          : "border-border/30 bg-card/50 hover:border-primary/20"
                      }`}>
                        {feature.highlight && (
                          <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-primary text-primary-foreground text-[9px] font-medium rounded-full">
                            New
                          </div>
                        )}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                          feature.highlight ? "bg-primary/10" : "bg-muted/50"
                        }`}>
                          <Icon className={`w-5 h-5 ${feature.highlight ? "text-primary" : "text-muted-foreground group-hover:text-primary"} transition-colors`} />
                        </div>
                        <h3 className="text-sm font-medium text-foreground mb-1">{feature.label}</h3>
                        <p className="text-xs text-muted-foreground">{feature.desc}</p>
                      </div>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
            </div>
          </section>
        </ScrollReveal>

        {/* TAX CALCULATOR HIGHLIGHT */}
        <ScrollReveal direction="up" delay={0.1}>
          <section className="px-4 sm:px-6 py-16 border-t border-border/20">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Calculator className="w-6 h-6 text-violet-500" />
                    <span className="text-xs text-violet-500 font-medium tracking-wider uppercase">Tax Calculator</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-light text-foreground mb-4">
                    Indian Income Tax <span className="text-primary">Made Simple</span>
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Calculate your taxes accurately with our step-by-step wizard. Compare Old vs New regime, 
                    discover deductions, and download professional PDF reports.
                  </p>
                  <ul className="space-y-2 mb-6">
                    {[
                      "FY 2025-26 tax slabs updated",
                      "Old vs New regime comparison",
                      "Auto-discover deductions (80C, 80D, etc.)",
                      "AI-powered TAXYN assistant",
                      "Professional PDF tax reports",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/login">
                    <button className="group flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg">
                      Try Tax Calculator
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-2xl blur-xl" />
                  <div className="relative p-6 bg-card border border-violet-500/20 rounded-xl">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm">Gross Income</span>
                        <span className="font-medium">₹12,00,000</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm">Deductions</span>
                        <span className="font-medium text-blue-500">-₹2,25,000</span>
                      </div>
                      <div className="h-px bg-border" />
                      <div className="flex justify-between items-center p-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
                        <span className="text-sm font-medium">Tax Payable</span>
                        <span className="text-xl font-bold text-violet-600">₹0</span>
                      </div>
                      <p className="text-center text-xs text-green-600">✓ Zero tax under New Regime (87A Rebate)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* DESKTOP COMING SOON */}
        <ScrollReveal direction="up" delay={0.1}>
          <section className="px-4 sm:px-6 py-16 border-t border-border/20 bg-card/20">
            <div className="max-w-2xl mx-auto text-center">
              <div className="relative inline-block mb-4">
                <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center">
                  <Monitor className="w-7 h-7 text-primary" />
                </div>
                <div className="absolute -top-2 -right-6 px-2 py-0.5 bg-amber-500 text-white text-[9px] font-medium rounded-full transform rotate-12 shadow-lg">
                  Soon
                </div>
              </div>
              
              <h2 className="text-2xl font-light text-foreground mb-3">
                CHRONYX Desktop
              </h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Native desktop app for macOS and Windows. Faster, offline-capable, and seamlessly integrated.
              </p>
              
              <button 
                onClick={() => setShowDesktopDialog(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm border border-border/40 text-muted-foreground rounded-lg hover:border-primary/40 hover:text-foreground transition-all"
              >
                <Download className="w-4 h-4" />
                Download for Desktop
              </button>
            </div>
          </section>
        </ScrollReveal>

        {/* PRICING PREVIEW */}
        <ScrollReveal direction="up" delay={0.1}>
          <section className="px-4 sm:px-6 py-16 border-t border-border/20">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl font-light text-foreground mb-3">Simple, Fair Pricing</h2>
              <p className="text-muted-foreground mb-10 text-sm">Start free, upgrade when you need more</p>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
                {/* Free */}
                <div className="p-6 bg-card border border-border/30 rounded-xl text-left">
                  <p className="text-xs text-muted-foreground mb-1">Free Forever</p>
                  <p className="text-2xl font-light mb-4">₹0<span className="text-sm text-muted-foreground">/mo</span></p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-500" />Basic tax calculator</li>
                    <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-500" />5 tasks/day</li>
                    <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-500" />1 income source</li>
                  </ul>
                </div>
                
                {/* Pro */}
                <div className="p-6 bg-gradient-to-br from-primary/5 to-violet-500/5 border-2 border-primary/30 rounded-xl text-left relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded-full">
                    Popular
                  </div>
                  <p className="text-xs text-primary mb-1">Pro</p>
                  <p className="text-2xl font-light mb-4">₹99<span className="text-sm text-muted-foreground">/mo</span></p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-500" />Full tax calculator + PDF</li>
                    <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-500" />Unlimited tasks</li>
                    <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-500" />Unlimited TAXYN AI</li>
                  </ul>
                </div>
                
                {/* Premium */}
                <div className="p-6 bg-card border border-border/30 rounded-xl text-left sm:col-span-2 lg:col-span-1">
                  <p className="text-xs text-muted-foreground mb-1">Premium</p>
                  <p className="text-2xl font-light mb-4">₹199<span className="text-sm text-muted-foreground">/mo</span></p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-500" />Everything in Pro</li>
                    <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-500" />Priority support</li>
                    <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-500" />Advanced analytics</li>
                  </ul>
                </div>
              </div>
              
              <Link to="/pricing" className="inline-block mt-8">
                <button className="text-sm text-primary hover:underline">View full pricing →</button>
              </Link>
            </div>
          </section>
        </ScrollReveal>

        {/* FOOTER */}
        <footer className="px-4 sm:px-6 py-12 border-t border-border/20 bg-card/30">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              {/* Brand */}
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <ChronxyxLogo className="w-8 h-8" />
                  <span className="text-lg font-light tracking-wider">CHRONYX</span>
                </div>
                <p className="text-xs text-muted-foreground">A quiet space for your life.</p>
                <p className="text-[10px] text-muted-foreground/60 mt-2">by Cropxon Innovations</p>
              </div>

              {/* Product */}
              <div>
                <h4 className="text-xs font-medium mb-3">Product</h4>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li><Link to="/login" className="hover:text-foreground">Dashboard</Link></li>
                  <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
                  <li><Link to="/about" className="hover:text-foreground">About</Link></li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="text-xs font-medium mb-3">Legal</h4>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li><Link to="/privacy" className="hover:text-foreground">Privacy</Link></li>
                  <li><Link to="/terms" className="hover:text-foreground">Terms</Link></li>
                  <li><Link to="/refund" className="hover:text-foreground">Refund</Link></li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h4 className="text-xs font-medium mb-3">Contact</h4>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li><a href="mailto:support@getchronyx.com" className="hover:text-foreground">support@getchronyx.com</a></li>
                  <li><a href="https://www.cropxon.com" target="_blank" rel="noopener" className="hover:text-foreground">cropxon.com</a></li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[10px] text-muted-foreground/50">
                © 2024-2026 Cropxon Innovations Pvt. Ltd. All rights reserved.
              </p>
              <p className="text-[10px] text-muted-foreground/40">Private · Quiet · Timeless</p>
            </div>
          </div>
        </footer>
      </div>

      {/* MODALS */}
      
      {/* Demo Video */}
      {showDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md p-4" onClick={() => setShowDemo(false)}>
          <div className="relative w-full max-w-4xl aspect-video bg-card rounded-xl border overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <video className="w-full h-full object-cover" controls autoPlay playsInline>
              <source src="https://ewevnteuyfpinnlhvoty.supabase.co/storage/v1/object/public/chronyx/CHRONYX__A_Quiet_Space.mp4" type="video/mp4" />
            </video>
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-background to-transparent px-4 py-3 pointer-events-none">
              <div className="flex items-center gap-2">
                <ChronxyxLogo className="w-6 h-6" />
                <span className="text-base font-light tracking-wider">CHRONYX</span>
              </div>
            </div>
            <button className="absolute top-4 right-4 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center" onClick={() => setShowDemo(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Dialog */}
      <Dialog open={showDesktopDialog} onOpenChange={setShowDesktopDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-primary" />
              CHRONYX Desktop
            </DialogTitle>
            <DialogDescription>Choose your platform</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-3 mt-4">
            <button className="flex items-center gap-4 p-4 rounded-lg border border-border/40 bg-card/30 hover:border-primary/40 transition-all">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <Apple className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-sm font-medium">macOS</h4>
                <p className="text-xs text-muted-foreground">Apple Silicon</p>
              </div>
              <span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-[10px] rounded-full">Soon</span>
            </button>
            
            <button className="flex items-center gap-4 p-4 rounded-lg border border-border/40 bg-card/30 hover:border-primary/40 transition-all">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 5.557l7.357-1.002v7.1H3V5.557zm0 12.886l7.357 1.002v-7.06H3v6.058zM11.543 5.03L21 3.674v8.074h-9.457V5.03zm0 13.94L21 20.326v-8.064h-9.457v6.708z"/>
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-sm font-medium">Windows</h4>
                <p className="text-xs text-muted-foreground">Intel / AMD</p>
              </div>
              <span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-[10px] rounded-full">Soon</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.main>
  );
};

export default Landing;
