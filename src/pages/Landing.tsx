import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, memo } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
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
  Bot,
  Library,
  Share2,
  Gift,
  Globe,
  Users,
  FileText,
  Coins,
  PenTool,
  TreePine,
  Folder,
  Brain
} from "lucide-react";
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";
import LandingNav from "@/components/landing/LandingNav";
import ScrollStackedFeatures from "@/components/landing/ScrollStackedFeatures";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

 // Import the demo video
 import chronxyxDemoVideo from "@/assets/chronyx-demo.mp4";

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

// Apple-style gradient orbs background - CSS-only for performance
const GradientOrbs = memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ contain: "layout paint" }}>
    {/* Primary orb - CSS animation instead of JS */}
    <div
      className="absolute w-[800px] h-[800px] -top-[400px] -right-[200px] rounded-full animate-float-slow"
      style={{
        background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)",
        willChange: "transform",
      }}
    />
    {/* Secondary orb */}
    <div
      className="absolute w-[600px] h-[600px] top-[60%] -left-[200px] rounded-full animate-float-slower"
      style={{
        background: "radial-gradient(circle, hsl(280 60% 60% / 0.06) 0%, transparent 70%)",
        willChange: "transform",
      }}
    />
    {/* Accent orb */}
    <div
      className="absolute w-[500px] h-[500px] top-[30%] right-[10%] rounded-full animate-float-medium"
      style={{
        background: "radial-gradient(circle, hsl(220 70% 50% / 0.04) 0%, transparent 70%)",
        willChange: "transform",
      }}
    />
  </div>
));

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

// NoteFlowLM Flagship Feature Card - Premium design
const NoteFlowLMCard = {
  id: "noteflow",
  title: "NoteFlow",
  subtitle: "AI-Powered Note Intelligence",
  icon: Sparkles,
  color: "from-fuchsia-500 via-purple-500 to-indigo-500",
  bgColor: "bg-gradient-to-br from-fuchsia-500/10 to-indigo-500/10",
  borderColor: "border-fuchsia-500/40",
  isFlagship: true,
  content: (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-2.5 bg-gradient-to-r from-fuchsia-500/10 to-purple-500/10 rounded-xl border border-fuchsia-500/20">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-semibold text-fuchsia-600 dark:text-fuchsia-400">FLAGSHIP PRODUCT</p>
          <p className="text-[8px] text-muted-foreground">Transform notes to visuals</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { icon: "🖼️", label: "Images", status: "Live" },
          { icon: "📊", label: "Slides", status: "Beta" },
          { icon: "📹", label: "Video", status: "Soon" },
        ].map((item) => (
          <motion.div
            key={item.label}
            className="p-2 bg-muted/30 rounded-lg text-center border border-border/30"
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-sm">{item.icon}</span>
            <p className="text-[8px] mt-0.5">{item.label}</p>
            <span className={`text-[6px] px-1.5 py-0.5 rounded-full ${item.status === "Live" ? "bg-green-500/20 text-green-600" : item.status === "Beta" ? "bg-amber-500/20 text-amber-600" : "bg-gray-500/20 text-gray-500"}`}>
              {item.status}
            </span>
          </motion.div>
        ))}
      </div>
      <div className="flex justify-between items-center text-[9px]">
        <span className="text-muted-foreground">Powered by Gemini 2.5</span>
        <span className="text-fuchsia-500 font-medium">→ /app/noteflowlm</span>
      </div>
    </div>
  ),
};

// Feature cards data for stacked animation - 12 cards with enhanced visuals
const featureCards = [
  NoteFlowLMCard,
  {
    id: "noteflow",
    title: "Noteflow Editor",
    subtitle: "Apple-level writing experience",
    icon: PenTool,
    color: "from-violet-500 to-purple-500",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/30",
    content: (
      <div className="space-y-2">
        <div className="p-2.5 bg-violet-500/10 rounded-lg border border-violet-500/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded bg-violet-500 flex items-center justify-center">
              <PenTool className="w-3 h-3 text-white" />
            </div>
            <span className="text-[10px] font-medium">Unified Editor</span>
          </div>
          <div className="flex gap-1">
            {["Rich Text", "Canvas", "Handwriting"].map((mode) => (
              <span key={mode} className="text-[7px] px-1.5 py-0.5 bg-muted/50 rounded-full">{mode}</span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {["Plain", "Lined", "Grid"].map((paper) => (
            <div key={paper} className="p-1.5 bg-muted/20 rounded text-center text-[8px]">{paper}</div>
          ))}
        </div>
      </div>
    ),
  },
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
    id: "library",
    title: "Digital Library",
    subtitle: "World's hub for knowledge",
    icon: Library,
    color: "from-cyan-500 to-teal-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    content: (
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-1.5">
          {["PDF", "EPUB", "Notes"].map((type, i) => (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20 text-center"
            >
              <BookOpen className="w-3 h-3 mx-auto mb-1 text-cyan-600" />
              <span className="text-[8px] text-muted-foreground">{type}</span>
            </motion.div>
          ))}
        </div>
        <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
          <span className="text-[10px]">Uploaded Books</span>
          <span className="text-[10px] font-semibold text-cyan-600">24</span>
        </div>
      </div>
    ),
  },
  {
    id: "rewards",
    title: "Rewards Hub",
    subtitle: "Earn & redeem points",
    icon: Gift,
    color: "from-amber-500 to-yellow-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    content: (
      <div className="space-y-2.5">
        <div className="p-2.5 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-lg border border-amber-500/20">
          <div className="flex justify-between items-center">
            <span className="text-[8px] text-muted-foreground uppercase tracking-wide">Your Points</span>
            <Coins className="w-3 h-3 text-amber-500" />
          </div>
          <p className="text-lg font-bold text-amber-600">12,450</p>
          <p className="text-[8px] text-muted-foreground">= ₹124.50 cashback</p>
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
            <p className="text-[10px]">"Your savings rate is up 12% this month!"</p>
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
    id: "share",
    title: "Seamless Share",
    subtitle: "Share anything instantly",
    icon: Share2,
    color: "from-blue-500 to-indigo-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    content: (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <Globe className="w-3.5 h-3.5 text-blue-500" />
          <div className="flex-1">
            <p className="text-[10px] font-medium">Public Library</p>
            <p className="text-[8px] text-muted-foreground">12 items shared</p>
          </div>
        </div>
        <div className="flex justify-between text-[8px]">
          <span className="text-muted-foreground">Each share = +5 points</span>
          <span className="text-blue-500 font-medium">Earn while sharing!</span>
        </div>
      </div>
    ),
  },
];
// Animated Live Preview Component - Stack then Queue Animation
const AnimatedDashboardPreview = memo(() => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<"stack" | "queue">("stack");
  const [loopCount, setLoopCount] = useState(0);
  
  useEffect(() => {
    if (isHovered) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % featureCards.length;
        // After one complete loop, switch to queue animation
        if (next === 0 && loopCount === 0) {
          setLoopCount(1);
          setAnimationPhase("queue");
        }
        return next;
      });
    }, animationPhase === "stack" ? 2500 : 3500);
    
    return () => clearInterval(interval);
  }, [isHovered, animationPhase, loopCount]);

  return (
    <div
      className="relative w-full max-w-sm mx-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ contain: "layout" }}
    >
      {/* Premium ambient glow - Enhanced for flagship */}
      <div 
        className="absolute -inset-16 bg-gradient-to-br from-primary/20 via-fuchsia-500/15 to-cyan-500/15 rounded-[3rem] blur-3xl opacity-60 animate-pulse"
        style={{ animationDuration: "4s" }}
      />
      <div 
        className="absolute -inset-10 bg-gradient-to-tr from-violet-500/10 via-transparent to-purple-500/10 rounded-3xl blur-2xl opacity-50"
      />
      
      {/* Stacked cards container with 3D perspective */}
      <div 
        className="relative h-[380px] sm:h-[400px] w-full"
        style={{ perspective: "1200px", perspectiveOrigin: "center center" }}
      >
        {featureCards.map((card, index) => {
          const isActive = index === activeIndex;
          const distance = (index - activeIndex + featureCards.length) % featureCards.length;
          const reverseDistance = (activeIndex - index + featureCards.length) % featureCards.length;
          const isFlagship = (card as any).isFlagship;
          
          // Calculate positions for stacked/queue effect
          let zIndex = 0;
          let y = 200;
          let scale = 0.8;
          let opacity = 0;
          let rotateX = 0;
          let z = -200;
          let x = 0;
          
          if (animationPhase === "stack") {
            // Stack animation (cards behind each other)
            if (distance === 0) {
              zIndex = 50; y = 0; scale = 1; opacity = 1; rotateX = 0; z = 0;
            } else if (distance === 1) {
              zIndex = 40; y = 24; scale = 0.94; opacity = 0.8; rotateX = 4; z = -40;
            } else if (distance === 2) {
              zIndex = 30; y = 44; scale = 0.88; opacity = 0.5; rotateX = 7; z = -80;
            } else if (distance === 3) {
              zIndex = 20; y = 60; scale = 0.82; opacity = 0.3; rotateX = 9; z = -120;
            } else if (reverseDistance === 1) {
              zIndex = 15; y = -60; scale = 0.9; opacity = 0; rotateX = -12; z = -100;
            }
          } else {
            // Queue animation (cards slide in from side)
            if (distance === 0) {
              zIndex = 50; y = 0; scale = 1; opacity = 1; rotateX = 0; z = 0; x = 0;
            } else if (distance === 1) {
              zIndex = 40; y = 0; scale = 0.92; opacity = 0.7; rotateX = 0; z = -30; x = 30;
            } else if (distance === 2) {
              zIndex = 30; y = 0; scale = 0.84; opacity = 0.4; rotateX = 0; z = -60; x = 60;
            } else if (reverseDistance === 1) {
              zIndex = 15; y = 0; scale = 0.9; opacity = 0; rotateX = 0; z = -100; x = -60;
            }
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
                x,
              }}
              transition={{
                duration: 0.6,
                ease: [0.32, 0.72, 0, 1],
              }}
              style={{
                transformStyle: "preserve-3d",
                transformOrigin: "center bottom",
              }}
              whileHover={isActive ? { scale: 1.02 } : {}}
            >
              <div 
                className={cn(
                  "w-full backdrop-blur-xl border rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden",
                  isFlagship 
                    ? "bg-gradient-to-br from-fuchsia-500/5 via-purple-500/5 to-indigo-500/5 border-fuchsia-500/40" 
                    : `bg-card/95 ${card.borderColor}`
                )}
                style={{
                  boxShadow: isActive 
                    ? isFlagship
                      ? '0 30px 60px -15px rgba(168, 85, 247, 0.35), 0 0 0 1px rgba(168, 85, 247, 0.3)'
                      : `0 25px 50px -12px rgba(0,0,0,0.25)`
                    : '0 10px 30px -10px rgba(0,0,0,0.15)',
                }}
              >
                {/* Flagship badge */}
                {isFlagship && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white text-[8px] font-bold rounded-full flex items-center gap-1 z-10">
                    <Crown className="w-2.5 h-2.5" />
                    FLAGSHIP
                  </div>
                )}
                
                {/* Card header with gradient */}
                <div className={`relative flex items-center gap-3 px-4 py-3 sm:py-4 overflow-hidden`}>
                  <div className={`absolute inset-0 bg-gradient-to-r ${card.color} opacity-10`} />
                  <motion.div 
                    className={cn(
                      "relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center",
                      isFlagship ? "bg-gradient-to-br from-fuchsia-500 to-purple-600" : card.bgColor
                    )}
                    animate={isActive ? { rotate: [0, 5, -5, 0] } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", isFlagship ? "text-white" : "text-foreground")} />
                  </motion.div>
                  <div className="relative">
                    <h3 className="text-sm sm:text-base font-semibold text-foreground">{card.title}</h3>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground">{card.subtitle}</p>
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
                <div className="px-4 py-3 sm:py-4 min-h-[100px] sm:min-h-[120px]">
                  {card.content}
                </div>
                
                {/* Card footer with progress indicators */}
                <div className="px-4 py-2 sm:py-3 bg-muted/10 border-t border-border/10">
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
        {(featureCards[activeIndex] as any).isFlagship && (
          <span className="ml-2 text-[9px] px-1.5 py-0.5 bg-fuchsia-500/20 text-fuchsia-500 rounded-full">
            ★ Flagship
          </span>
        )}
      </motion.div>
    </div>
  );
});
// Simple section wrapper with CSS-based reveal - no scroll listeners for performance
const RevealSection = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
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

  useEffect(() => {
    setMounted(true);
  }, []);

  // Features are now in ScrollStackedFeatures component

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
      {/* SEO-optimized meta description & structured data */}
      <span className="sr-only">
        CHRONYX is a private personal system of record for managing your life — tasks, finances, tax calculations, 
        insurance policies, study planning, digital library, and memories. Indian Income Tax Calculator with Old vs New 
        Regime comparison. AI-powered NoteFlowLM for content creation. Rewards & cashback system. 
        Built by ORIGINX LABS PVT. LTD. Available as PWA and web app at getchronyx.com.
      </span>
      
      {/* JSON-LD Structured Data for SEO & GEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "CHRONYX",
        "applicationCategory": "LifestyleApplication",
        "operatingSystem": "Web, PWA",
        "description": "AI-powered personal system of record — tasks, finance, study planner, tax calculator, digital library, document vault, and rewards. Built for India.",
        "url": "https://www.getchronyx.com",
        "author": {
          "@type": "Organization",
          "name": "ORIGINX LABS PVT. LTD.",
          "url": "https://www.originxlabs.com"
        },
        "offers": [
          { "@type": "Offer", "price": "0", "priceCurrency": "INR", "name": "Free" },
          { "@type": "Offer", "price": "199", "priceCurrency": "INR", "name": "Pro" },
          { "@type": "Offer", "price": "499", "priceCurrency": "INR", "name": "Premium" }
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "reviewCount": "1024"
        }
      })}} />

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
          className="relative flex-1 flex items-center justify-center px-4 sm:px-6 pt-24 pb-20 lg:pt-28 lg:pb-24 min-h-screen"
          style={{ opacity: mounted ? 1 : 0 }}
        >
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              
              {/* Left - Content */}
              <div className="text-center lg:text-left space-y-6 sm:space-y-8">

                {/* Main Headline - Vercel Typography */}
                <motion.h1 
                  className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold leading-[1.1] tracking-tight"
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  custom={1}
                >
                  <span style={{ color: 'hsl(var(--chronyx-brand))' }}>A quiet space</span>
                  <br />
                  <span className="bg-gradient-to-r from-muted-foreground to-muted-foreground/60 bg-clip-text text-transparent">for your life.</span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p 
                  className="text-base sm:text-lg lg:text-xl text-muted-foreground font-light max-w-lg mx-auto lg:mx-0 leading-relaxed"
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  custom={2}
                >
                  Tasks, finances, tax calculations, insurance, and memories — 
                  all in one private, minimal dashboard.
                </motion.p>

                {/* Feature pills - including NoteFlowLM */}
                <motion.div 
                  className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3"
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  custom={3}
                >
                  {[
                    { icon: Sparkles, label: "NoteFlow", highlight: true, flagship: true },
                    { icon: Calculator, label: "Tax Calculator", highlight: true },
                    { icon: Wallet, label: "Finance" },
                    { icon: CheckSquare, label: "Tasks" },
                    { icon: Library, label: "Library" },
                    { icon: Shield, label: "Private" },
                  ].map((item) => (
                    <motion.div 
                      key={item.label}
                      className={cn(
                        "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm border transition-all",
                        (item as any).flagship
                          ? "border-fuchsia-500/50 bg-gradient-to-r from-fuchsia-500/10 to-purple-500/10 text-fuchsia-600 dark:text-fuchsia-400 font-semibold shadow-lg shadow-fuchsia-500/10" 
                          : item.highlight 
                            ? "border-primary/50 bg-primary/5 text-primary font-medium" 
                            : "border-border/50 bg-card/30 text-muted-foreground hover:text-foreground hover:border-primary/30 backdrop-blur-sm"
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>{item.label}</span>
                      {(item as any).flagship && <Crown className="w-3 h-3 text-fuchsia-500" />}
                      {item.highlight && !(item as any).flagship && <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
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
            <h2 className="text-3xl sm:text-4xl font-semibold mb-6 tracking-tight" style={{ color: 'hsl(var(--chronyx-brand))' }}>
              What is CHRONYX?
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed font-light mb-4">
              CHRONYX is the <strong className="text-foreground font-medium">world's most complete personal digital hub</strong> — 
              a quiet place to hold the threads of your life. Tasks, knowledge, finances, tax calculations, library, and memories.
              Not just a productivity tool. A seamless ecosystem for your entire life.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed font-light">
              Upload books, share knowledge globally, earn rewards, track your studies, manage finances — all in one beautiful, 
              private space. Earn points for every action and redeem them for real money.
            </p>
          </article>
        </RevealSection>

        {/* FEATURES - Scroll Stacked Animated Cards */}
        <ScrollStackedFeatures />

        {/* NOTEFLOW FLAGSHIP SECTION */}
        <RevealSection className="px-4 sm:px-6 py-16 sm:py-24 bg-gradient-to-br from-fuchsia-500/5 via-purple-500/5 to-indigo-500/5 border-t border-fuchsia-500/10">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
              <motion.div 
                className="relative order-2 md:order-1"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="absolute -inset-4 bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 rounded-3xl blur-3xl" />
                <div className="relative p-6 sm:p-8 bg-card/90 backdrop-blur-xl border border-fuchsia-500/30 rounded-2xl sm:rounded-3xl shadow-2xl">
                  {/* Flagship badge */}
                  <div className="absolute -top-3 -right-3 px-3 py-1 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg">
                    <Crown className="w-3.5 h-3.5" />
                    FLAGSHIP
                  </div>
                  
                  <div className="flex items-center gap-3 mb-6">
                    <motion.div 
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-fuchsia-500 to-purple-600 bg-clip-text text-transparent">NoteFlow</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">AI-Powered Note Intelligence</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
                    {[
                      { icon: "🖼️", label: "Images", status: "Live", desc: "Transform notes to visuals" },
                      { icon: "📊", label: "Slides", status: "Beta", desc: "Auto presentations" },
                      { icon: "📹", label: "Video", status: "Soon", desc: "Animated explainers" },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="p-3 sm:p-4 bg-muted/30 rounded-xl border border-border/30 text-center hover:border-fuchsia-500/30 transition-colors"
                      >
                        <span className="text-xl sm:text-2xl">{item.icon}</span>
                        <p className="text-xs sm:text-sm font-medium mt-1">{item.label}</p>
                        <span className={cn(
                          "text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block",
                          item.status === "Live" ? "bg-green-500/20 text-green-600" : 
                          item.status === "Beta" ? "bg-amber-500/20 text-amber-600" : 
                          "bg-muted text-muted-foreground"
                        )}>
                          {item.status}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-gradient-to-r from-fuchsia-500/10 to-purple-500/10 rounded-xl border border-fuchsia-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-fuchsia-500" />
                      <span className="text-xs sm:text-sm font-medium">Powered by Gemini 2.5</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground">
                      Transform any note into stunning visuals, presentations, and videos with AI
                    </p>
                  </div>
                </div>
              </motion.div>
              
              <div className="order-1 md:order-2">
                <motion.div 
                  className="flex items-center gap-3 mb-4 sm:mb-6"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] sm:text-xs text-fuchsia-500 font-bold tracking-wider uppercase">★ FLAGSHIP PRODUCT</span>
                  </div>
                </motion.div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-4 sm:mb-6 tracking-tight" style={{ color: 'hsl(var(--chronyx-brand))' }}>
                  NoteFlow: <span className="bg-gradient-to-r from-fuchsia-500 to-purple-600 bg-clip-text text-transparent">Transform Notes into Anything</span>
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 font-light leading-relaxed">
                  The future of note-taking. Convert your notes into stunning images, professional slides, 
                  and explainer videos with AI.
                </p>
                <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                  {[
                    "Generate images from notes with Gemini 2.5",
                    "Auto-create presentation slides (Beta)",
                    "Private Mode: Uses CHRONYX context",
                    "Public Mode: Web search enabled",
                    "Daily limits: Free 5, Pro 12, Premium 20",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-fuchsia-500/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-fuchsia-500" />
                      </div>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/app/noteflowlm">
                  <motion.button 
                    className="group flex items-center gap-2 sm:gap-3 px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white rounded-full hover:from-fuchsia-600 hover:to-purple-700 transition-all shadow-xl shadow-fuchsia-500/25"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    Try NoteFlow
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-0.5 transition-transform" />
                  </motion.button>
                </Link>
              </div>
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
                <h2 className="text-3xl sm:text-4xl font-semibold mb-6 tracking-tight" style={{ color: 'hsl(var(--chronyx-brand))' }}>
                  Indian Income Tax <span className="text-primary">Made Simple</span>
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

        {/* DIGITAL LIBRARY HIGHLIGHT */}
        <RevealSection className="px-6 py-24 bg-muted/10 border-t border-border/10">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div 
                className="relative order-2 md:order-1"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="absolute -inset-4 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 rounded-3xl blur-2xl" />
                <div className="relative p-8 bg-card/80 backdrop-blur-sm border border-cyan-500/20 rounded-2xl">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {[
                      { icon: BookOpen, label: "PDFs", count: "156" },
                      { icon: FileText, label: "Notes", count: "89" },
                      { icon: Library, label: "EPUBs", count: "24" },
                      { icon: Share2, label: "Shared", count: "12" },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 bg-muted/30 rounded-xl text-center"
                      >
                        <item.icon className="w-6 h-6 mx-auto mb-2 text-cyan-600" />
                        <p className="text-lg font-medium">{item.count}</p>
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                      </motion.div>
                    ))}
                  </div>
                  <div className="p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-cyan-600" />
                      <div>
                        <p className="text-sm font-medium">World's Digital Hub</p>
                        <p className="text-xs text-muted-foreground">Share & access knowledge globally</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              <div className="order-1 md:order-2">
                <motion.div 
                  className="flex items-center gap-3 mb-6"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
                    <Library className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm text-cyan-600 font-medium tracking-wider uppercase">Digital Library</span>
                </motion.div>
                <h2 className="text-3xl sm:text-4xl font-semibold mb-6 tracking-tight" style={{ color: 'hsl(var(--chronyx-brand))' }}>
                  World's Most <span className="text-cyan-600">Online Digital Hub</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-8 font-light leading-relaxed">
                  Upload your books, notes, and documents. Read with Day/Sepia/Night themes, 
                  track progress, and share with anyone globally.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Upload PDFs, EPUBs & documents",
                    "Kindle/Apple Books-style reader",
                    "Auto-sync reading progress",
                    "Inline dictionary & translation",
                    "Share globally with anyone",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-base">
                      <div className="w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center">
                        <Check className="w-3 h-3 text-cyan-600" />
                      </div>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/login">
                  <motion.button 
                    className="group flex items-center gap-3 px-6 py-3 text-base font-medium bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-full hover:from-cyan-600 hover:to-teal-700 transition-all shadow-xl shadow-cyan-500/20"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Explore Library
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </RevealSection>

        {/* REWARDS & POINTS SYSTEM */}
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
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm text-amber-600 font-medium tracking-wider uppercase">Rewards Hub</span>
                </motion.div>
                <h2 className="text-3xl sm:text-4xl font-semibold mb-6 tracking-tight" style={{ color: 'hsl(var(--chronyx-brand))' }}>
                  Earn Points, <span className="text-amber-600">Get Real Cash</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-8 font-light leading-relaxed">
                  Every action earns you points. Share content, complete tasks, and engage with the platform 
                  to accumulate points that convert to real money.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <Coins className="w-6 h-6 text-amber-600 mb-2" />
                    <p className="text-2xl font-light">100 pts</p>
                    <p className="text-sm text-muted-foreground">= ₹1 Rupee</p>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                    <Gift className="w-6 h-6 text-green-600 mb-2" />
                    <p className="text-2xl font-light">₹100</p>
                    <p className="text-sm text-muted-foreground">Min. Redemption</p>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    "+5 points for every share",
                    "+10 points for reviews",
                    "+2 points daily login",
                    "Redeem via UPI or Bank Transfer",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-base">
                      <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <Check className="w-3 h-3 text-amber-600" />
                      </div>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <motion.div 
                className="relative"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-3xl blur-2xl" />
                <div className="relative p-8 bg-card/80 backdrop-blur-sm border border-amber-500/20 rounded-2xl">
                  <div className="text-center mb-6">
                    <motion.div
                      className="inline-block p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full mb-4"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      <Coins className="w-8 h-8 text-white" />
                    </motion.div>
                    <p className="text-3xl font-light">12,450</p>
                    <p className="text-sm text-muted-foreground">Total Points Earned</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">Shared PDF</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">+5</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-xl">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm">Completed Task</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">+2</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-violet-500" />
                        <span className="text-sm">Referral Bonus</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">+100</span>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-green-500/10 rounded-xl border border-green-500/20 text-center">
                    <p className="text-lg font-medium text-green-600">₹124.50</p>
                    <p className="text-xs text-muted-foreground">Available for redemption</p>
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
            
            <h2 className="text-3xl font-semibold mb-4 tracking-tight" style={{ color: 'hsl(var(--chronyx-brand))' }}>
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
              <h2 className="text-3xl sm:text-4xl font-semibold mb-4 tracking-tight" style={{ color: 'hsl(var(--chronyx-brand))' }}>
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
                  <img src={chronyxLogoImg} alt="CHRONYX" className="w-10 h-10 dark:invert" />
                  <span className="text-xl font-semibold tracking-[0.15em]" style={{ color: 'hsl(var(--chronyx-brand))' }}>CHRONYX</span>
                </div>
                <p className="text-sm text-muted-foreground font-light">A quiet space for your life.</p>
                <p className="text-xs text-muted-foreground/60 mt-3">by ORIGINX LABS</p>
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
                  <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
                  <li><a href="mailto:Office@getchronyx.com" className="hover:text-foreground transition-colors">Office@getchronyx.com</a></li>
                  <li><a href="mailto:support@getchronyx.com" className="hover:text-foreground transition-colors">support@getchronyx.com</a></li>
                  <li><a href="https://www.originxlabs.com" target="_blank" rel="noopener" className="hover:text-foreground transition-colors">originxlabs.com</a></li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground/60">
                © 2024-2026 ORIGINX LABS PVT. LTD. All rights reserved.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
                <p className="text-xs text-muted-foreground/50 tracking-wider">Private · Quiet · Timeless</p>
                <p className="text-xs text-muted-foreground/60">
                  Developed by <span className="text-destructive">❤️</span>{" "}
                  <a
                    href="https://www.abhishekpanda.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:text-foreground transition-colors underline underline-offset-2"
                  >
                    Abhishek Panda
                  </a>
                </p>
              </div>
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
              className="relative max-w-4xl w-full aspect-video bg-card rounded-2xl border border-border/50 flex items-center justify-center shadow-2xl overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowDemo(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 hover:bg-background transition-colors backdrop-blur-sm border border-border/50"
              >
                <X className="w-5 h-5" />
              </button>
              <video 
                src={chronxyxDemoVideo}
                controls
                autoPlay
                className="w-full h-full object-cover"
                playsInline
              >
                Your browser does not support the video tag.
              </video>
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
