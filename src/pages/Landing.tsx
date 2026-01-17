import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useInView } from "framer-motion";
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
  X,
  Check,
  Sparkles,
  Crown,
  Zap,
  Monitor,
  Calculator,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  PiggyBank,
  Bot
} from "lucide-react";
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";
import LandingNav from "@/components/landing/LandingNav";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Apple-style SF Pro inspired typography animations
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      delay: i * 0.1,
      ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
    },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 1,
      ease: "easeOut",
    },
  },
};

// Apple-style gradient orbs background
const GradientOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Primary orb */}
    <motion.div
      className="absolute w-[800px] h-[800px] -top-[400px] -right-[200px] rounded-full"
      style={{
        background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)",
      }}
      animate={{
        x: [0, 50, 0],
        y: [0, 30, 0],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
    {/* Secondary orb */}
    <motion.div
      className="absolute w-[600px] h-[600px] top-[60%] -left-[200px] rounded-full"
      style={{
        background: "radial-gradient(circle, hsl(280 60% 60% / 0.06) 0%, transparent 70%)",
      }}
      animate={{
        x: [0, -30, 0],
        y: [0, 50, 0],
      }}
      transition={{
        duration: 25,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
    {/* Accent orb */}
    <motion.div
      className="absolute w-[500px] h-[500px] top-[30%] right-[10%] rounded-full"
      style={{
        background: "radial-gradient(circle, hsl(220 70% 50% / 0.04) 0%, transparent 70%)",
      }}
      animate={{
        x: [0, 40, 0],
        y: [0, -40, 0],
      }}
      transition={{
        duration: 18,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  </div>
);

// Animated noise texture overlay
const NoiseOverlay = () => (
  <div 
    className="absolute inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
    }}
  />
);

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

// Feature cards data for stacked animation - 12 cards with enhanced visuals
const featureCards = [
  {
    id: "dashboard",
    title: "Dashboard",
    subtitle: "Your life at a glance",
    icon: TrendingUp,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    content: (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 bg-green-500/10 rounded-lg border border-green-500/20">
            <p className="text-[8px] text-muted-foreground uppercase tracking-wide">Income</p>
            <p className="text-base font-semibold text-green-600">₹12.5L</p>
          </div>
          <div className="p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <p className="text-[8px] text-muted-foreground uppercase tracking-wide">Savings</p>
            <p className="text-base font-semibold text-blue-600">₹3.2L</p>
          </div>
          <div className="p-2.5 bg-violet-500/10 rounded-lg border border-violet-500/20">
            <p className="text-[8px] text-muted-foreground uppercase tracking-wide">Tasks</p>
            <p className="text-base font-semibold text-violet-600">12/15</p>
          </div>
        </div>
        <div className="h-14 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-lg flex items-center justify-center">
          <div className="flex items-end gap-1 h-8">
            {[40, 65, 45, 80, 55, 70, 60].map((h, i) => (
              <motion.div
                key={i}
                className="w-2.5 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-sm"
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "tasks",
    title: "Tasks & Todos",
    subtitle: "Stay productive",
    icon: CheckSquare,
    color: "from-emerald-500 to-green-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    content: (
      <div className="space-y-2">
        {["Complete tax filing ✓", "Review insurance policy", "Update monthly budget"].map((task, i) => (
          <motion.div
            key={task}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12 }}
            className={`flex items-center gap-2 p-2 rounded-lg ${i === 0 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-muted/20"}`}
          >
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${i === 0 ? "bg-emerald-500" : "border-2 border-muted-foreground/30"}`}>
              {i === 0 && <Check className="w-2 h-2 text-white" />}
            </div>
            <span className={`text-[11px] ${i === 0 ? "line-through text-muted-foreground" : "text-foreground"}`}>{task}</span>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    id: "finance",
    title: "Finance Tracker",
    subtitle: "Track everything",
    icon: Wallet,
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    content: (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-3.5 h-3.5 text-green-500" />
            <span className="text-[11px]">Emergency Fund</span>
          </div>
          <span className="text-[11px] font-semibold">₹2.5L</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[9px]">
            <span className="text-muted-foreground">Monthly Budget</span>
            <span className="text-amber-500 font-medium">68% used</span>
          </div>
          <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "68%" }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "tax",
    title: "Tax Calculator",
    subtitle: "Smart tax planning",
    icon: Calculator,
    color: "from-violet-500 to-purple-500",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/30",
    content: (
      <div className="space-y-2.5">
        <div className="p-2.5 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-lg border border-violet-500/20">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[8px] text-muted-foreground uppercase tracking-wide">Tax Payable</span>
            <span className="text-[7px] px-1.5 py-0.5 bg-green-500/20 text-green-600 rounded-full font-medium">New Regime</span>
          </div>
          <p className="text-lg font-bold text-violet-600">₹52,000</p>
        </div>
        <div className="flex gap-1.5">
          {[{ l: "80C", v: "₹1.5L" }, { l: "80D", v: "₹25K" }, { l: "HRA", v: "₹1.2L" }].map((d) => (
            <div key={d.l} className="flex-1 p-1.5 bg-muted/20 rounded text-center">
              <p className="text-[7px] text-muted-foreground">{d.l}</p>
              <p className="text-[9px] font-semibold">{d.v}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "insurance",
    title: "Insurance",
    subtitle: "Policy tracker",
    icon: Heart,
    color: "from-rose-500 to-pink-500",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    content: (
      <div className="space-y-2">
        <div className="flex items-center justify-between p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
          <div className="flex items-center gap-2">
            <Heart className="w-3 h-3 text-rose-500" />
            <span className="text-[11px] font-medium">Health Insurance</span>
          </div>
          <span className="text-[8px] px-1.5 py-0.5 bg-green-500/20 text-green-600 rounded-full">Active</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="p-1.5 bg-muted/20 rounded text-center">
            <p className="text-[7px] text-muted-foreground">Sum Assured</p>
            <p className="text-[10px] font-semibold">₹10L</p>
          </div>
          <div className="p-1.5 bg-muted/20 rounded text-center">
            <p className="text-[7px] text-muted-foreground">Premium</p>
            <p className="text-[10px] font-semibold">₹12K/yr</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "memory",
    title: "Memory Vault",
    subtitle: "Private storage",
    icon: Image,
    color: "from-indigo-500 to-blue-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/30",
    content: (
      <div className="space-y-2">
        <div className="grid grid-cols-4 gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <motion.div
              key={i}
              className="aspect-square rounded bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
            />
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground">
          <span>324 memories</span>
          <span className="text-indigo-500">2.4 GB used</span>
        </div>
      </div>
    ),
  },
  {
    id: "loans",
    title: "Loan Manager",
    subtitle: "EMI tracking",
    icon: TrendingUp,
    color: "from-teal-500 to-cyan-500",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/30",
    content: (
      <div className="space-y-2">
        <div className="p-2 bg-teal-500/10 rounded-lg border border-teal-500/20">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-medium">Home Loan</span>
            <span className="text-[8px] px-1.5 py-0.5 bg-blue-500/20 text-blue-600 rounded-full">Active</span>
          </div>
          <div className="flex justify-between mt-1.5">
            <div>
              <p className="text-[7px] text-muted-foreground">EMI</p>
              <p className="text-[11px] font-semibold">₹45,000</p>
            </div>
            <div className="text-right">
              <p className="text-[7px] text-muted-foreground">Remaining</p>
              <p className="text-[11px] font-semibold">156 EMIs</p>
            </div>
          </div>
        </div>
        <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-teal-500 to-cyan-400" initial={{ width: 0 }} animate={{ width: "35%" }} transition={{ duration: 0.8 }} />
        </div>
      </div>
    ),
  },
  {
    id: "study",
    title: "Study Planner",
    subtitle: "Track learning",
    icon: BookOpen,
    color: "from-sky-500 to-blue-500",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/30",
    content: (
      <div className="space-y-2">
        {["Mathematics - 3h", "Physics - 2h", "Chemistry - 1.5h"].map((sub, i) => (
          <motion.div key={sub} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center justify-between p-1.5 bg-muted/20 rounded">
            <span className="text-[10px]">{sub.split(" - ")[0]}</span>
            <div className="flex items-center gap-1.5">
              <div className="w-12 h-1 bg-muted/40 rounded-full overflow-hidden">
                <motion.div className="h-full bg-sky-500" initial={{ width: 0 }} animate={{ width: `${80 - i * 20}%` }} transition={{ duration: 0.6, delay: i * 0.15 }} />
              </div>
              <span className="text-[8px] text-muted-foreground">{sub.split(" - ")[1]}</span>
            </div>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    id: "lifespan",
    title: "Lifespan",
    subtitle: "Time visualization",
    icon: Clock,
    color: "from-slate-500 to-gray-500",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/30",
    content: (
      <div className="space-y-2">
        <div className="text-center">
          <p className="text-[8px] text-muted-foreground uppercase tracking-wide">Time Lived</p>
          <p className="text-xl font-light text-foreground">28 Years</p>
          <p className="text-[9px] text-muted-foreground">≈ 10,227 days</p>
        </div>
        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-slate-500 to-gray-400" initial={{ width: 0 }} animate={{ width: "35%" }} transition={{ duration: 1 }} />
        </div>
        <p className="text-[8px] text-center text-muted-foreground">35% of expected lifespan (80 years)</p>
      </div>
    ),
  },
  {
    id: "documents",
    title: "Documents",
    subtitle: "Secure vault",
    icon: Shield,
    color: "from-zinc-500 to-stone-500",
    bgColor: "bg-zinc-500/10",
    borderColor: "border-zinc-500/30",
    content: (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-1.5">
          {["Aadhaar", "PAN Card", "Passport", "License"].map((doc, i) => (
            <motion.div key={doc} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }} className="p-2 bg-muted/20 rounded-lg flex items-center gap-1.5">
              <Lock className="w-2.5 h-2.5 text-zinc-500" />
              <span className="text-[9px]">{doc}</span>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-between text-[8px] text-muted-foreground">
          <span>12 documents</span>
          <span className="text-green-500">All encrypted</span>
        </div>
      </div>
    ),
  },
  {
    id: "expenses",
    title: "Expenses",
    subtitle: "Track spending",
    icon: Wallet,
    color: "from-red-500 to-rose-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    content: (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground">This Month</span>
          <span className="text-sm font-semibold text-red-500">₹45,230</span>
        </div>
        <div className="space-y-1">
          {[{ cat: "Food", amt: "₹12K", pct: 27 }, { cat: "Transport", amt: "₹8K", pct: 18 }, { cat: "Shopping", amt: "₹15K", pct: 33 }].map((e, i) => (
            <div key={e.cat} className="flex items-center gap-2">
              <span className="text-[8px] w-12">{e.cat}</span>
              <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                <motion.div className="h-full bg-red-500" initial={{ width: 0 }} animate={{ width: `${e.pct}%` }} transition={{ duration: 0.5, delay: i * 0.1 }} />
              </div>
              <span className="text-[8px] text-muted-foreground">{e.amt}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "ai",
    title: "NOVA AI",
    subtitle: "Personal assistant",
    icon: Bot,
    color: "from-fuchsia-500 to-purple-500",
    bgColor: "bg-fuchsia-500/10",
    borderColor: "border-fuchsia-500/30",
    content: (
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-500 flex items-center justify-center">
            <Bot className="w-3 h-3 text-white" />
          </div>
          <div className="flex-1 p-2 bg-muted/20 rounded-lg rounded-tl-none">
            <p className="text-[10px]">"Your savings rate is up 12% this month. Great progress!"</p>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="p-2 bg-primary/10 rounded-lg rounded-tr-none max-w-[80%]">
            <p className="text-[10px] text-primary">Show me my tax savings</p>
          </div>
        </div>
        <div className="flex justify-center">
          <motion.div className="flex items-center gap-1" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <span className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full" />
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
            <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
          </motion.div>
        </div>
      </div>
    ),
  },
];

// Animated Live Preview Component - Enhanced Stacked Cards with 3D effects
const AnimatedDashboardPreview = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % featureCards.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
      className="relative w-full max-w-sm mx-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Multi-layer ambient glow */}
      <motion.div 
        className="absolute -inset-16 bg-gradient-to-br from-primary/15 via-violet-500/10 to-cyan-500/15 rounded-[3rem] blur-3xl"
        animate={{ 
          opacity: [0.4, 0.6, 0.4],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute -inset-10 bg-gradient-to-tr from-blue-500/10 via-transparent to-purple-500/10 rounded-3xl blur-2xl"
        animate={{ 
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, 5, 0],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Stacked cards container with 3D perspective */}
      <div 
        className="relative h-[360px] w-full"
        style={{ perspective: "1200px", perspectiveOrigin: "center center" }}
      >
        {featureCards.map((card, index) => {
          const isActive = index === activeIndex;
          const distance = (index - activeIndex + featureCards.length) % featureCards.length;
          const reverseDistance = (activeIndex - index + featureCards.length) % featureCards.length;
          
          // Calculate positions for stacked effect
          let zIndex = 0;
          let y = 200;
          let scale = 0.8;
          let opacity = 0;
          let rotateX = 0;
          let z = -200;
          
          if (distance === 0) { // Active card
            zIndex = 50;
            y = 0;
            scale = 1;
            opacity = 1;
            rotateX = 0;
            z = 0;
          } else if (distance === 1) { // Next card
            zIndex = 40;
            y = 24;
            scale = 0.94;
            opacity = 0.8;
            rotateX = 4;
            z = -40;
          } else if (distance === 2) { // 2nd next
            zIndex = 30;
            y = 44;
            scale = 0.88;
            opacity = 0.5;
            rotateX = 7;
            z = -80;
          } else if (distance === 3) { // 3rd next
            zIndex = 20;
            y = 60;
            scale = 0.82;
            opacity = 0.3;
            rotateX = 9;
            z = -120;
          } else if (reverseDistance === 1) { // Previous card (exiting up)
            zIndex = 15;
            y = -60;
            scale = 0.9;
            opacity = 0;
            rotateX = -12;
            z = -100;
          }
          
          const Icon = card.icon;
          
          return (
            <motion.div
              key={card.id}
              className="absolute inset-x-0 top-0 w-full cursor-pointer"
              onClick={() => setActiveIndex(index)}
              animate={{
                zIndex,
                y,
                scale,
                opacity,
                rotateX,
                z,
              }}
              transition={{
                duration: 0.5,
                ease: [0.32, 0.72, 0, 1],
              }}
              style={{
                transformStyle: "preserve-3d",
                transformOrigin: "center bottom",
              }}
              whileHover={isActive ? { scale: 1.02 } : {}}
            >
              <div 
                className={`w-full bg-card/95 backdrop-blur-xl border ${card.borderColor} rounded-2xl shadow-2xl overflow-hidden`}
                style={{
                  boxShadow: isActive 
                    ? `0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px ${card.borderColor.replace('border-', 'rgba(').replace('/30', ', 0.3)')}`
                    : '0 10px 30px -10px rgba(0,0,0,0.15)',
                }}
              >
                {/* Card header with gradient */}
                <div className={`relative flex items-center gap-3 px-4 py-3 overflow-hidden`}>
                  <div className={`absolute inset-0 bg-gradient-to-r ${card.color} opacity-10`} />
                  <motion.div 
                    className={`relative w-9 h-9 rounded-xl ${card.bgColor} flex items-center justify-center`}
                    animate={isActive ? { rotate: [0, 5, -5, 0] } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Icon className="w-4.5 h-4.5 text-foreground" />
                  </motion.div>
                  <div className="relative">
                    <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
                    <p className="text-[9px] text-muted-foreground">{card.subtitle}</p>
                  </div>
                  <div className="ml-auto relative flex items-center gap-1.5">
                    <motion.div 
                      className={`w-2 h-2 rounded-full bg-gradient-to-r ${card.color}`}
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-[8px] text-muted-foreground font-medium">Live</span>
                  </div>
                </div>
                
                {/* Card content */}
                <div className="px-4 py-3 min-h-[100px]">
                  {card.content}
                </div>
                
                {/* Card footer with progress indicators */}
                <div className="px-4 py-2 bg-muted/10 border-t border-border/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {featureCards.slice(0, 6).map((_, i) => (
                        <motion.div
                          key={i}
                          className={`rounded-full transition-all ${
                            i === activeIndex % 6
                              ? `w-4 h-1 bg-gradient-to-r ${card.color}` 
                              : "w-1 h-1 bg-muted-foreground/20"
                          }`}
                          animate={{ 
                            width: i === activeIndex % 6 ? 16 : 4,
                          }}
                        />
                      ))}
                      <span className="text-[8px] text-muted-foreground ml-1">+{featureCards.length - 6}</span>
                    </div>
                    <span className="text-[9px] text-muted-foreground font-medium">
                      {activeIndex + 1} / {featureCards.length}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Enhanced navigation dots */}
      <div className="flex justify-center gap-1.5 mt-5">
        {featureCards.map((card, i) => (
          <motion.button
            key={card.id}
            onClick={() => setActiveIndex(i)}
            className={`rounded-full transition-all ${
              i === activeIndex 
                ? `w-6 h-1.5 bg-gradient-to-r ${card.color}` 
                : "w-1.5 h-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/40"
            }`}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            aria-label={`View ${card.title}`}
          />
        ))}
      </div>
      
      {/* Card title indicator */}
      <motion.div 
        className="text-center mt-3"
        key={activeIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <span className="text-[11px] text-muted-foreground font-medium tracking-wide">
          {featureCards[activeIndex].title}
        </span>
      </motion.div>
    </motion.div>
  );
};

// Section wrapper with scroll-based reveal
const RevealSection = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
};

const Landing = () => {
  const [mounted, setMounted] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [showDesktopDialog, setShowDesktopDialog] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  useEffect(() => {
    setMounted(true);
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  const features = [
    { icon: CheckSquare, label: "Tasks", desc: "Daily todos & productivity" },
    { icon: BookOpen, label: "Study", desc: "Syllabus & learning tracker" },
    { icon: Wallet, label: "Finance", desc: "Budget, loans & savings" },
    { icon: Calculator, label: "Tax", desc: "Smart Indian tax calculator", highlight: true },
    { icon: Heart, label: "Insurance", desc: "Policy management" },
    { icon: Image, label: "Memory", desc: "Private photo vault" },
    { icon: Clock, label: "Lifespan", desc: "Time visualization" },
  ];

  const stats = [
    { value: "10K+", label: "Users" },
    { value: "99.9%", label: "Uptime" },
    { value: "256-bit", label: "Encryption" },
    { value: "0", label: "Ads" },
  ];

  // Pricing from /pricing page - exact values
  const plans = [
    {
      name: "Free",
      price: "₹0",
      period: "forever",
      description: "Everything you need to get started",
      icon: Zap,
      popular: false,
      features: [
        "Unlimited tasks & todos",
        "Study syllabus tracking",
        "Expense & income tracking",
        "Loan EMI management",
        "Insurance policy tracking",
        "Basic tax calculator",
        "3 TAXYN messages/day",
        "2GB memory storage",
      ],
    },
    {
      name: "Pro",
      price: "₹199",
      period: "/month",
      yearlyPrice: "₹1,999/year",
      description: "Enhanced features for power users",
      icon: Sparkles,
      popular: true,
      features: [
        "Everything in Free, plus:",
        "10GB memory storage",
        "Advanced financial analytics",
        "Unlimited tax calculations",
        "Unlimited TAXYN AI assistant",
        "Regime comparison & optimization",
        "Tax PDF reports",
        "FinanceFlow AI (Gmail import)",
      ],
    },
    {
      name: "Premium",
      price: "₹499",
      period: "/month",
      yearlyPrice: "₹4,999/year",
      description: "Full access with all premium features",
      icon: Crown,
      popular: false,
      features: [
        "Everything in Pro, plus:",
        "100GB memory storage",
        "Advanced AI insights",
        "Multi-year tax history",
        "CA consultation credits",
        "Family profiles",
        "Export all data formats",
        "Direct founder support",
      ],
    },
  ];

  return (
    <motion.main 
      className="relative min-h-screen w-full overflow-x-hidden bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      role="main"
      aria-label="CHRONYX - Personal System of Record | Tax Calculator | Finance Tracker"
    >
      {/* SEO-optimized meta description */}
      <span className="sr-only">
        CHRONYX is a private personal system of record for managing your life - tasks, finances, tax calculations, 
        insurance policies, and memories. Indian Income Tax Calculator with Old vs New Regime comparison. 
        Built by Cropxon Innovations.
      </span>

      {/* Apple-style background effects */}
      <GradientOrbs />
      <NoiseOverlay />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="landing-grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-foreground" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#landing-grid)" />
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Navigation */}
        <LandingNav onDesktopDownload={() => setShowDesktopDialog(true)} />

        {/* HERO SECTION - Apple/Vercel style */}
        <motion.section 
          className="relative flex-1 flex items-center justify-center px-6 pt-28 pb-20 lg:pt-32 lg:pb-24 min-h-screen"
          style={{ opacity: mounted ? 1 : 0 }}
        >
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
              
              {/* Left - Content */}
              <div className="text-center lg:text-left space-y-8">
                {/* Logo + Badge */}
                <motion.div 
                  className="flex items-center justify-center lg:justify-start gap-4"
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  custom={0}
                >
                  <ChronxyxLogo className="w-14 h-14" />
                  <div className="flex flex-col items-start">
                    <span className="text-3xl font-extralight tracking-[0.25em] text-foreground">CHRONYX</span>
                    <span className="text-[10px] text-muted-foreground tracking-[0.3em] uppercase font-medium">Personal System of Record</span>
                  </div>
                </motion.div>

                {/* Main Headline - Vercel Typography */}
                <motion.h1 
                  className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extralight leading-[1.1] tracking-tight"
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  custom={1}
                >
                  <span className="text-foreground">A quiet space</span>
                  <br />
                  <span className="bg-gradient-to-r from-muted-foreground to-muted-foreground/60 bg-clip-text text-transparent">for your life.</span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p 
                  className="text-lg sm:text-xl text-muted-foreground font-light max-w-lg mx-auto lg:mx-0 leading-relaxed"
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  custom={2}
                >
                  Tasks, finances, tax calculations, insurance, and memories — 
                  all in one private, minimal dashboard.
                </motion.p>

                {/* Feature pills */}
                <motion.div 
                  className="flex flex-wrap items-center justify-center lg:justify-start gap-3"
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  custom={3}
                >
                  {[
                    { icon: Calculator, label: "Tax Calculator", highlight: true },
                    { icon: Wallet, label: "Finance" },
                    { icon: CheckSquare, label: "Tasks" },
                    { icon: Shield, label: "Private" },
                  ].map((item) => (
                    <motion.div 
                      key={item.label}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition-all ${
                        item.highlight 
                          ? "border-primary/50 bg-primary/5 text-primary font-medium" 
                          : "border-border/50 bg-card/30 text-muted-foreground hover:text-foreground hover:border-primary/30 backdrop-blur-sm"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {item.highlight && <Sparkles className="w-3.5 h-3.5" />}
                    </motion.div>
                  ))}
                </motion.div>

                {/* CTA Buttons */}
                <motion.div 
                  className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  custom={4}
                >
                  <Link to="/login">
                    <motion.button 
                      className="group flex items-center gap-3 px-8 py-4 text-base font-medium bg-foreground text-background rounded-full hover:bg-foreground/90 transition-all shadow-xl shadow-foreground/10"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Get Started Free
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                    </motion.button>
                  </Link>
                  
                  <motion.button 
                    onClick={() => setShowDemo(true)}
                    className="flex items-center gap-3 px-6 py-4 text-base text-muted-foreground border border-border/50 rounded-full hover:border-foreground/30 hover:text-foreground transition-all backdrop-blur-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Play className="w-5 h-5" />
                    Watch Demo
                  </motion.button>
                </motion.div>

                {/* PWA Install */}
                <motion.div
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  custom={5}
                >
                  <PWAInstallPrompt variant="hero" />
                </motion.div>

                {/* Trust indicators */}
                <motion.div 
                  className="flex items-center justify-center lg:justify-start gap-8 pt-4"
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  custom={6}
                >
                  {stats.map((stat) => (
                    <div key={stat.label} className="text-center">
                      <p className="text-xl font-semibold text-foreground">{stat.value}</p>
                      <p className="text-[11px] text-muted-foreground font-medium tracking-wide uppercase">{stat.label}</p>
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
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              <span className="text-[10px] tracking-[0.3em] uppercase font-medium">Explore</span>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronDown className="w-5 h-5" />
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* WHAT IS CHRONYX */}
        <RevealSection className="px-6 py-24 border-t border-border/10">
          <article className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-extralight text-foreground mb-6 tracking-tight">
              What is CHRONYX?
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed font-light">
              CHRONYX is a <strong className="text-foreground font-medium">personal system of record</strong> — 
              a quiet place to hold the threads of your life. Tasks, knowledge, finances, tax calculations, and memories.
              Not a productivity tool. Just a place for continuity.
            </p>
          </article>
        </RevealSection>

        {/* FEATURES GRID */}
        <RevealSection className="px-6 py-24 bg-muted/20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extralight text-foreground mb-4 tracking-tight">
                Everything you need, nothing you don't
              </h2>
              <p className="text-lg text-muted-foreground font-light max-w-xl mx-auto">
                A personal dashboard for tasks, studies, finances, taxes, insurance, and memories
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.6 }}
                    className={`group relative p-6 rounded-2xl border transition-all cursor-pointer ${
                      feature.highlight 
                        ? "border-primary/30 bg-gradient-to-br from-primary/5 to-violet-500/5" 
                        : "border-border/30 bg-card/50 hover:border-primary/20 hover:bg-card/80"
                    }`}
                    whileHover={{ y: -4 }}
                  >
                    {feature.highlight && (
                      <div className="absolute -top-2 -right-2 px-2.5 py-1 bg-primary text-primary-foreground text-[10px] font-medium rounded-full tracking-wide">
                        New
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                      feature.highlight ? "bg-primary/10" : "bg-muted/50 group-hover:bg-primary/10"
                    } transition-colors`}>
                      <Icon className={`w-6 h-6 ${feature.highlight ? "text-primary" : "text-muted-foreground group-hover:text-primary"} transition-colors`} />
                    </div>
                    <h3 className="text-base font-medium text-foreground mb-1">{feature.label}</h3>
                    <p className="text-sm text-muted-foreground font-light">{feature.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </RevealSection>

        {/* TAX CALCULATOR HIGHLIGHT */}
        <RevealSection className="px-6 py-24 border-t border-border/10">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <motion.div 
                  className="flex items-center gap-3 mb-6"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm text-violet-500 font-medium tracking-wider uppercase">Tax Calculator</span>
                </motion.div>
                <h2 className="text-3xl sm:text-4xl font-extralight text-foreground mb-6 tracking-tight">
                  Indian Income Tax <span className="text-primary font-light">Made Simple</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-8 font-light leading-relaxed">
                  Calculate your taxes accurately with our step-by-step wizard. Compare Old vs New regime, 
                  discover deductions, and download professional PDF reports.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "FY 2025-26 tax slabs updated",
                    "Old vs New regime comparison",
                    "Auto-discover deductions (80C, 80D, etc.)",
                    "AI-powered TAXYN assistant",
                    "Professional PDF tax reports",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-base">
                      <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-500" />
                      </div>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/login">
                  <motion.button 
                    className="group flex items-center gap-3 px-6 py-3 text-base font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-full hover:from-violet-600 hover:to-purple-700 transition-all shadow-xl shadow-violet-500/20"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Try Tax Calculator
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                  </motion.button>
                </Link>
              </div>
              <motion.div 
                className="relative"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="absolute -inset-4 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-3xl blur-2xl" />
                <div className="relative p-8 bg-card/80 backdrop-blur-sm border border-violet-500/20 rounded-2xl">
                  <div className="space-y-5">
                    <div className="flex justify-between items-center p-4 bg-muted/30 rounded-xl">
                      <span className="text-base font-light">Gross Income</span>
                      <span className="text-lg font-medium">₹12,00,000</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-muted/30 rounded-xl">
                      <span className="text-base font-light">Deductions</span>
                      <span className="text-lg font-medium text-blue-500">-₹2,25,000</span>
                    </div>
                    <div className="h-px bg-border/50" />
                    <div className="flex justify-between items-center p-5 bg-violet-500/10 rounded-xl border border-violet-500/20">
                      <span className="text-base font-medium">Tax Payable</span>
                      <span className="text-2xl font-light text-violet-600">₹0</span>
                    </div>
                    <p className="text-center text-sm text-green-600 font-medium">✓ Zero tax under New Regime (87A Rebate)</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </RevealSection>

        {/* DESKTOP COMING SOON */}
        <RevealSection className="px-6 py-24 bg-muted/20 border-t border-border/10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div 
              className="relative inline-block mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 border border-border/50 flex items-center justify-center backdrop-blur-sm">
                <Monitor className="w-10 h-10 text-foreground/60" />
              </div>
              <div className="absolute -top-2 -right-4 px-3 py-1 bg-amber-500 text-white text-xs font-medium rounded-full transform rotate-12 shadow-lg">
                Soon
              </div>
            </motion.div>
            
            <h2 className="text-3xl font-extralight text-foreground mb-4 tracking-tight">
              CHRONYX Desktop
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto font-light">
              Native desktop app for macOS and Windows. Faster, offline-capable, and seamlessly integrated.
            </p>
            
            <motion.button 
              onClick={() => setShowDesktopDialog(true)}
              className="inline-flex items-center gap-3 px-6 py-3 text-base border border-border/50 text-muted-foreground rounded-full hover:border-foreground/30 hover:text-foreground transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Download className="w-5 h-5" />
              Download for Desktop
            </motion.button>
          </div>
        </RevealSection>

        {/* PRICING SECTION - Synced with /pricing page */}
        <RevealSection className="px-6 py-24 border-t border-border/10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extralight text-foreground mb-4 tracking-tight">
                Simple, Honest Pricing
              </h2>
              <p className="text-lg text-muted-foreground font-light">
                Start free, upgrade when you need more. No hidden fees, no surprises.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan, index) => {
                const Icon = plan.icon;
                return (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    className={`relative p-8 rounded-2xl border transition-all ${
                      plan.popular
                        ? "border-primary/50 bg-gradient-to-br from-primary/5 to-violet-500/5 shadow-xl shadow-primary/5"
                        : "border-border/40 bg-card/50"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                        Most Popular
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        plan.popular ? "bg-primary/10" : "bg-muted/50"
                      }`}>
                        <Icon className={`w-6 h-6 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <h3 className="text-xl font-medium text-foreground">{plan.name}</h3>
                    </div>

                    <div className="mb-2">
                      <span className="text-4xl font-extralight text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground text-base ml-1">{plan.period}</span>
                    </div>
                    
                    {plan.yearlyPrice && (
                      <p className="text-sm text-muted-foreground mb-6">or {plan.yearlyPrice} (save 17%)</p>
                    )}
                    {!plan.yearlyPrice && <div className="mb-6" />}

                    <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            plan.popular ? "text-primary" : "text-muted-foreground"
                          }`} />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link to={plan.name === "Free" ? "/login" : "/pricing"}>
                      <motion.button 
                        className={`w-full py-3 rounded-full font-medium transition-all ${
                          plan.popular 
                            ? "bg-foreground text-background hover:bg-foreground/90" 
                            : "bg-muted text-foreground hover:bg-muted/80"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {plan.name === "Free" ? "Get Started Free" : `Upgrade to ${plan.name}`}
                      </motion.button>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Tax Pro addon */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-12 p-8 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-500/5 to-purple-500/5"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Bot className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-foreground">Just need Tax features?</h3>
                    <p className="text-sm text-muted-foreground">Unlimited tax calculations and TAXYN AI for just ₹49/month</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <span className="text-3xl font-light text-foreground">₹49</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <span className="px-4 py-2 bg-amber-500/10 text-amber-500 text-sm font-medium rounded-full">Coming soon</span>
                </div>
              </div>
            </motion.div>
            
            <div className="text-center mt-10">
              <Link to="/pricing" className="text-primary hover:underline text-base font-medium">
                View full pricing details →
              </Link>
            </div>
          </div>
        </RevealSection>

        {/* FOOTER */}
        <footer id="footer" className="px-6 py-16 border-t border-border/10 bg-muted/10">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
              {/* Brand */}
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-3 mb-4">
                  <ChronxyxLogo className="w-10 h-10" />
                  <span className="text-xl font-extralight tracking-[0.15em]">CHRONYX</span>
                </div>
                <p className="text-sm text-muted-foreground font-light">A quiet space for your life.</p>
                <p className="text-xs text-muted-foreground/60 mt-3">by Cropxon Innovations</p>
              </div>

              {/* Product */}
              <div>
                <h4 className="text-sm font-medium mb-4 tracking-wide">Product</h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li><Link to="/login" className="hover:text-foreground transition-colors">Dashboard</Link></li>
                  <li><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                  <li><Link to="/about" className="hover:text-foreground transition-colors">About</Link></li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="text-sm font-medium mb-4 tracking-wide">Legal</h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
                  <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
                  <li><Link to="/refund" className="hover:text-foreground transition-colors">Refund</Link></li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h4 className="text-sm font-medium mb-4 tracking-wide">Contact</h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li><a href="mailto:support@getchronyx.com" className="hover:text-foreground transition-colors">support@getchronyx.com</a></li>
                  <li><a href="https://www.cropxon.com" target="_blank" rel="noopener" className="hover:text-foreground transition-colors">cropxon.com</a></li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground/60">
                © 2024-2026 Cropxon Innovations Pvt. Ltd. All rights reserved.
              </p>
              <p className="text-xs text-muted-foreground/40 tracking-wider">Private · Quiet · Timeless</p>
            </div>
          </div>
        </footer>
      </div>

      {/* MODALS */}
      
      {/* Demo Video */}
      <AnimatePresence>
        {showDemo && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-lg p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDemo(false)}
          >
            <motion.div 
              className="relative max-w-4xl w-full aspect-video bg-card rounded-2xl border border-border/50 flex items-center justify-center shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowDemo(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-center p-8">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Play className="w-10 h-10 text-primary ml-1" />
                </div>
                <h3 className="text-xl font-light mb-2">Demo Video</h3>
                <p className="text-muted-foreground text-sm">Coming soon</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Download Dialog */}
      <Dialog open={showDesktopDialog} onOpenChange={setShowDesktopDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-light">Desktop App Coming Soon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">
              CHRONYX Desktop is currently in development. We're building native apps for macOS (Apple Silicon) and Windows (x64).
            </p>
            <div className="flex gap-3 p-4 bg-muted/30 rounded-xl border border-border/30">
              <div className="flex-1 text-center p-3">
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                  <span className="text-lg"></span>
                </div>
                <p className="text-sm font-medium">macOS</p>
                <p className="text-xs text-muted-foreground">Apple Silicon</p>
              </div>
              <div className="flex-1 text-center p-3">
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-sm font-medium">Windows</p>
                <p className="text-xs text-muted-foreground">x64</p>
              </div>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              In the meantime, use the web app or install as a PWA!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </motion.main>
  );
};

export default Landing;
