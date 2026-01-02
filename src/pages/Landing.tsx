import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
  X
} from "lucide-react";
import chronyxPhilosophy from "@/assets/chronyx-philosophy.png";

// CHRONYX Logo Component
const ChronxyxLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
      </linearGradient>
    </defs>
    {/* Outer ring */}
    <circle 
      cx="50" cy="50" r="45" 
      stroke="url(#logo-gradient)" 
      strokeWidth="2" 
      fill="none"
      className="opacity-80"
    />
    {/* Inner dashed ring */}
    <circle 
      cx="50" cy="50" r="35" 
      stroke="hsl(var(--primary))" 
      strokeWidth="1" 
      strokeDasharray="6 4"
      fill="none"
      className="opacity-40"
    />
    {/* Center dot */}
    <circle 
      cx="50" cy="50" r="5" 
      fill="hsl(var(--primary))"
      className="opacity-90"
    />
    {/* Time markers */}
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

const Landing = () => {
  const [mounted, setMounted] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    { icon: CheckSquare, label: "Tasks", desc: "Record daily todos", sketch: "M" },
    { icon: BookOpen, label: "Study", desc: "Hold your syllabus", sketch: "◇" },
    { icon: Wallet, label: "Finance", desc: "Budget & loans", sketch: "△" },
    { icon: Heart, label: "Insurance", desc: "Policy records", sketch: "○" },
    { icon: Image, label: "Memory", desc: "Private photo vault", sketch: "□" },
    { icon: Clock, label: "Time", desc: "Lifespan view", sketch: "◎" },
  ];

  return (
    <motion.main 
      className="relative min-h-screen w-full overflow-x-hidden bg-chronyx-landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {/* Paper-like texture overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015]" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} 
      />

      {/* Handmade sketch grid background */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="sketch-grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path 
                d="M 80 0 L 0 0 0 80" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="0.3"
                strokeDasharray="3,6"
                className="text-foreground"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sketch-grid)" />
        </svg>
      </div>

      {/* Subtle vignette overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--chronyx-landing-vignette))_100%)]" />
      
      {/* Slow rotating concentric rings - meditative motion */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg
          className="chronyx-ring-rotate"
          width="700"
          height="700"
          viewBox="0 0 700 700"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="350"
            cy="350"
            r="320"
            stroke="hsl(var(--chronyx-arc-stroke))"
            strokeWidth="0.5"
            strokeDasharray="502 1508"
            strokeLinecap="round"
            fill="none"
            className="opacity-[0.03]"
          />
          <circle
            cx="350"
            cy="350"
            r="280"
            stroke="hsl(var(--chronyx-arc-stroke))"
            strokeWidth="0.5"
            strokeDasharray="220 1540"
            strokeLinecap="round"
            fill="none"
            className="opacity-[0.04]"
          />
          <circle
            cx="350"
            cy="350"
            r="240"
            stroke="hsl(var(--chronyx-arc-stroke))"
            strokeWidth="0.5"
            fill="none"
            className="opacity-[0.02]"
          />
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Header */}
        <header className="w-full px-6 py-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChronxyxLogo className="w-8 h-8" />
              <span className="text-lg font-light tracking-[0.2em] text-foreground/80">CHRONYX</span>
            </div>
            <Link to="/login">
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Enter
              </button>
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-8 pb-16">
          {/* Logo animation */}
          <div 
            className={`relative mb-10 transition-all duration-1000 ease-out ${
              mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <ChronxyxLogo className="w-20 h-20 md:w-24 md:h-24" />
          </div>

          {/* Primary Title */}
          <h1 
            className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight tracking-[0.15em] sm:tracking-[0.2em] text-chronyx-landing-title transition-all duration-[800ms] ease-out ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
          >
            CHRONYX
          </h1>

          {/* Tagline */}
          <p 
            className={`mt-6 text-lg sm:text-xl md:text-2xl font-light text-chronyx-landing-tagline transition-all duration-[600ms] ease-out ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ 
              transitionDelay: '300ms',
              fontFamily: "'Inter', system-ui, sans-serif"
            }}
          >
            A quiet space for your life.
          </p>

          {/* Subdescription */}
          <p 
            className={`mt-4 text-sm sm:text-base font-light text-muted-foreground/70 max-w-md transition-all duration-[600ms] ease-out ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '400ms' }}
          >
            A private system to hold your life with continuity.
            <br className="hidden sm:block" />
            No optimization. No pressure. Just time, recorded.
          </p>

          {/* Feature pills */}
          <div 
            className={`mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-xl transition-all duration-[600ms] ease-out ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '500ms' }}
          >
            {features.slice(0, 4).map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={feature.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/40 bg-card/20 backdrop-blur-sm text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all duration-300 group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Icon className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
                  <span className="text-xs sm:text-sm font-light tracking-wide">{feature.label}</span>
                </div>
              );
            })}
          </div>

          {/* CTA Buttons */}
          <div 
            className={`mt-12 flex flex-col sm:flex-row items-center gap-4 transition-all duration-[600ms] ease-out ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '700ms' }}
          >
            <Link to="/login">
              <button className="group relative px-8 py-3 text-sm tracking-wider font-light border border-primary/80 text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-all duration-300 ease-out overflow-hidden">
                <span className="relative z-10 flex items-center gap-2">
                  Enter CHRONYX
                  <Shield className="w-4 h-4 opacity-70" />
                </span>
              </button>
            </Link>
            
            <button 
              onClick={() => setShowDemo(true)}
              className="flex items-center gap-2 px-6 py-3 text-sm tracking-wider font-light border border-border/50 text-muted-foreground bg-transparent rounded-md hover:border-primary/30 hover:text-foreground transition-all duration-300"
            >
              <Play className="w-4 h-4" />
              Watch Demo
            </button>
          </div>

          {/* Scroll indicator */}
          <div 
            className={`mt-20 flex flex-col items-center gap-2 text-muted-foreground/40 transition-all duration-[600ms] ease-out ${
              mounted ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ transitionDelay: '1000ms' }}
          >
            <span className="text-xs tracking-widest uppercase">Explore</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </div>
        </section>

        {/* What is CHRONYX Section */}
        <section className="px-4 sm:px-6 py-20 sm:py-28 border-t border-border/20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 
              className={`text-2xl sm:text-3xl font-light text-foreground mb-6 transition-all duration-500 ${
                mounted ? 'opacity-100' : 'opacity-0'
              }`}
            >
              What is CHRONYX?
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              CHRONYX is a <strong className="text-foreground font-medium">personal system of record</strong> — 
              a quiet place to hold the threads of your life. Tasks you complete, knowledge you acquire, 
              money you manage, memories you preserve. All in one private, calm space.
            </p>
            <p className="text-muted-foreground/70 mt-4 text-sm">
              Not a productivity tool. Not a second brain. Just a place for continuity.
            </p>
          </div>
        </section>

        {/* Why CHRONYX Section */}
        <section className="px-4 sm:px-6 py-20 sm:py-28 bg-card/30">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-light text-foreground mb-6">
              Why CHRONYX?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/50 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium text-foreground mb-2">No Gamification</h3>
                <p className="text-sm text-muted-foreground">No streaks, no points, no pressure. Just quiet recording.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/50 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium text-foreground mb-2">Completely Private</h3>
                <p className="text-sm text-muted-foreground">Your data belongs to you. No sharing, no selling, no tracking.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/50 flex items-center justify-center">
                  <Download className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium text-foreground mb-2">Full Control</h3>
                <p className="text-sm text-muted-foreground">Export everything anytime. Your records, your ownership.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid Section */}
        <section className="px-4 sm:px-6 py-20 sm:py-28">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-center text-2xl sm:text-3xl font-light text-foreground mb-4">
              Everything in one place
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-md mx-auto">
              A personal dashboard for tasks, studies, finances, and memories
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.label}
                    className={`group relative p-6 sm:p-8 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm hover:border-primary/30 hover:bg-card/50 transition-all duration-500 cursor-default ${
                      mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: `${1000 + index * 100}ms` }}
                  >
                    {/* Sketch corner decoration */}
                    <div className="absolute top-2 right-2 text-xs text-muted-foreground/20 font-mono">
                      {feature.sketch}
                    </div>
                    
                    <div className="flex flex-col items-start">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-accent/50 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-medium text-foreground mb-1">{feature.label}</h3>
                      <p className="text-sm text-muted-foreground">{feature.desc}</p>
                    </div>
                    
                    {/* Hover line effect */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Philosophy Image Section */}
        <section className="px-4 sm:px-6 py-20 sm:py-28 border-t border-border/20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center text-2xl sm:text-3xl font-light text-foreground mb-4">
              The Philosophy of CHRONYX
            </h2>
            <p className="text-center text-muted-foreground mb-10 max-w-lg mx-auto">
              An integrated view of your life — from finances to memories
            </p>
            {/* Image with bottom cropped to hide NotebookLM watermark */}
            <div className="relative rounded-xl overflow-hidden border border-border/40 shadow-lg">
              <div className="overflow-hidden" style={{ marginBottom: '-40px' }}>
                <img 
                  src={chronyxPhilosophy} 
                  alt="CHRONYX Philosophy - A quiet space for your life" 
                  className="w-full h-auto"
                />
              </div>
              {/* Gradient overlay at bottom to smoothly hide watermark area */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background via-background/90 to-transparent" />
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="px-4 sm:px-6 py-20 sm:py-28 border-t border-border/20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-light text-foreground mb-6">
              Privacy, Ownership, Control
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              CHRONYX is designed for one person: you. Your data never leaves your account. 
              Export everything as JSON or PDF anytime. Backup and restore at will. 
              This is a system you can trust and live with for many years.
            </p>
          </div>
        </section>

        {/* Quiet Closing Section */}
        <section className="px-4 sm:px-6 py-24 sm:py-32 text-center">
          <p className="text-xl sm:text-2xl font-light text-muted-foreground mb-8">
            A system someone could trust<br />and live with for many years.
          </p>
          <Link to="/login">
            <button className="px-8 py-3 text-sm tracking-wider font-light border border-primary/80 text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-all duration-300">
              Enter CHRONYX
            </button>
          </Link>
        </section>

        {/* Footer */}
        <footer className="px-4 sm:px-6 py-8 border-t border-border/20">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground/50">
            <div className="flex items-center gap-3">
              <ChronxyxLogo className="w-5 h-5 opacity-50" />
              <span className="font-light tracking-wide">CHRONYX by CROPXON</span>
            </div>
            <p className="text-xs">Private · Quiet · Timeless</p>
          </div>
        </footer>
      </div>

      {/* Demo Video Modal */}
      {showDemo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md p-4"
          onClick={() => setShowDemo(false)}
        >
          <div 
            className="relative w-full max-w-4xl aspect-video bg-card rounded-xl border border-border overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Video Player */}
            <video
              className="w-full h-full object-cover"
              controls
              autoPlay
              playsInline
            >
              <source 
                src="https://ewevnteuyfpinnlhvoty.supabase.co/storage/v1/object/public/chronyx/CHRONYX__A_Quiet_Space.mp4" 
                type="video/mp4" 
              />
              Your browser does not support the video tag.
            </video>
            
            {/* Brand Overlay - covers NotebookLM branding in top-left corner */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-background via-background/80 to-transparent px-4 py-3 pointer-events-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChronxyxLogo className="w-6 h-6" />
                  <span className="text-base font-light tracking-[0.15em] text-foreground">CHRONYX</span>
                </div>
                <span className="text-xs font-light tracking-wide text-muted-foreground mr-10">by CROPXON</span>
              </div>
            </div>
            
            {/* Bottom overlay to hide any watermarks */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/80 to-transparent h-16 pointer-events-none flex items-end justify-center pb-2">
              <span className="text-xs font-light tracking-widest text-muted-foreground/60">A QUIET SPACE FOR YOUR LIFE</span>
            </div>
            
            {/* Close button */}
            <button 
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10"
              onClick={() => setShowDemo(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </motion.main>
  );
};

export default Landing;
