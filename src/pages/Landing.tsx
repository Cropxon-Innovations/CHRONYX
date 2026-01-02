import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
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
  Sparkles,
  Lock,
  BarChart3,
  Calendar
} from "lucide-react";

const Landing = () => {
  const [mounted, setMounted] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    { icon: CheckSquare, label: "Tasks", desc: "Track daily todos", sketch: "M" },
    { icon: BookOpen, label: "Study", desc: "Master your syllabus", sketch: "◇" },
    { icon: Wallet, label: "Finance", desc: "Budget & loans", sketch: "△" },
    { icon: Heart, label: "Insurance", desc: "Policy tracker", sketch: "○" },
    { icon: Image, label: "Memory", desc: "Photo vault", sketch: "□" },
    { icon: Clock, label: "Time", desc: "Lifespan view", sketch: "◎" },
  ];

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-vyom-landing">
      {/* Handmade sketch grid background */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="sketch-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path 
                d="M 60 0 L 0 0 0 60" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="0.5"
                strokeDasharray="2,4"
                className="text-foreground"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sketch-grid)" />
        </svg>
      </div>

      {/* Decorative sketch elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top left corner decoration */}
        <svg className="absolute top-10 left-10 w-20 h-20 sketch-element opacity-[0.06]" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="8,12" className="text-primary" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary opacity-50" />
        </svg>
        
        {/* Bottom right corner decoration */}
        <svg className="absolute bottom-20 right-20 w-32 h-32 sketch-element opacity-[0.05]" viewBox="0 0 100 100">
          <rect x="20" y="20" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="0.5" transform="rotate(12 50 50)" className="text-primary" />
          <rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="0.5" transform="rotate(-8 50 50)" className="text-primary opacity-50" />
        </svg>

        {/* Floating dots pattern */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/10 sketch-float"
            style={{
              left: `${10 + (i * 8) % 80}%`,
              top: `${15 + (i * 13) % 70}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Subtle vignette overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--vyom-landing-vignette))_100%)]" />
      
      {/* Rotating Arc - Meditative motion */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg
          className="vyom-arc-rotate"
          width="600"
          height="600"
          viewBox="0 0 600 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="300"
            cy="300"
            r="280"
            stroke="hsl(var(--vyom-arc-stroke))"
            strokeWidth="1"
            strokeDasharray="440 1320"
            strokeLinecap="round"
            fill="none"
            className="opacity-[0.04]"
          />
          <circle
            cx="300"
            cy="300"
            r="260"
            stroke="hsl(var(--vyom-arc-stroke))"
            strokeWidth="0.5"
            strokeDasharray="220 1540"
            strokeLinecap="round"
            fill="none"
            className="opacity-[0.03]"
          />
        </svg>
      </div>

      {/* Progress Ring - Subtle circular indicator */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg
          className="vyom-ring-slow-rotate"
          width="500"
          height="500"
          viewBox="0 0 500 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="250"
            cy="250"
            r="220"
            stroke="hsl(var(--vyom-arc-stroke))"
            strokeWidth="1"
            fill="none"
            className="opacity-[0.02]"
          />
          <circle
            cx="250"
            cy="250"
            r="220"
            stroke="hsl(var(--vyom-arc-stroke))"
            strokeWidth="1.5"
            strokeDasharray="345 1036"
            strokeDashoffset="0"
            strokeLinecap="round"
            fill="none"
            className="opacity-[0.05] vyom-ring-fill-animate"
            transform="rotate(-90 250 250)"
          />
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Hero Section */}
        <section className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-12 pb-8">
          {/* Sketch-style logo accent */}
          <div 
            className={`relative mb-6 transition-all duration-1000 ease-out ${
              mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <div className="absolute -inset-4 border border-dashed border-primary/20 rounded-lg sketch-rotate" />
            <div className="absolute -inset-6 border border-dotted border-primary/10 rounded-xl" />
            <Sparkles className="w-8 h-8 text-primary/40" />
          </div>

          {/* Primary Title with handwritten feel */}
          <h1 
            className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extralight tracking-[0.25em] sm:tracking-[0.35em] text-vyom-landing-title transition-all duration-[800ms] ease-out relative ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
          >
            <span className="relative">
              VYOM
              {/* Underline sketch */}
              <svg className="absolute -bottom-2 left-0 w-full h-3 overflow-visible" viewBox="0 0 100 10">
                <path 
                  d="M 0 5 Q 25 8 50 5 T 100 5" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="0.5"
                  className="text-primary/30 sketch-draw"
                />
              </svg>
            </span>
          </h1>

          {/* Tagline */}
          <p 
            className={`mt-8 text-lg sm:text-xl md:text-2xl font-light text-vyom-landing-tagline transition-all duration-[600ms] ease-out ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ 
              transitionDelay: '300ms',
              fontFamily: "'Inter', system-ui, sans-serif"
            }}
          >
            A quiet space for your life.
          </p>

          {/* Feature pills with icons */}
          <div 
            className={`mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-xl transition-all duration-[600ms] ease-out ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '500ms' }}
          >
            {features.slice(0, 4).map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={feature.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 bg-background/30 backdrop-blur-sm text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all duration-300 group"
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
                  Enter VYOM
                  <Shield className="w-4 h-4 opacity-70" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 opacity-0 group-hover:opacity-100 transition-opacity" />
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
            className={`mt-16 flex flex-col items-center gap-2 text-muted-foreground/50 transition-all duration-[600ms] ease-out ${
              mounted ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ transitionDelay: '1000ms' }}
          >
            <span className="text-xs tracking-widest uppercase">Explore</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </div>
        </section>

        {/* Features Grid Section */}
        <section className="px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-6xl mx-auto">
            <h2 
              className={`text-center text-2xl sm:text-3xl font-light text-foreground mb-4 transition-all duration-500 ${
                mounted ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ transitionDelay: '800ms' }}
            >
              Everything in one place
            </h2>
            <p 
              className={`text-center text-muted-foreground mb-12 max-w-md mx-auto transition-all duration-500 ${
                mounted ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ transitionDelay: '900ms' }}
            >
              A personal dashboard for tasks, studies, finances, and memories
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.label}
                    className={`group relative p-6 sm:p-8 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm hover:border-primary/30 hover:bg-card/50 transition-all duration-500 cursor-default ${
                      mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: `${1000 + index * 100}ms` }}
                  >
                    {/* Sketch corner decoration */}
                    <div className="absolute top-2 right-2 text-xs text-muted-foreground/30 font-mono">
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

        {/* Stats Section */}
        <section className="px-4 sm:px-6 py-12 sm:py-16 border-t border-border/30">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div className={`transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '1200ms' }}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-primary/60" />
                  <span className="text-2xl sm:text-3xl font-light text-foreground">100%</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Private</p>
              </div>
              <div className={`transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '1300ms' }}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-primary/60" />
                  <span className="text-2xl sm:text-3xl font-light text-foreground">6+</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Modules</p>
              </div>
              <div className={`transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '1400ms' }}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-primary/60" />
                  <span className="text-2xl sm:text-3xl font-light text-foreground">∞</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Timeline</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-4 sm:px-6 py-8 border-t border-border/20">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground/60">
            <p className="font-light tracking-wide">VYOM · Your life, organized</p>
            <p className="text-xs">Private · Secure · Minimal</p>
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
            <div className="absolute inset-0 flex items-center justify-center bg-accent/30">
              <div className="text-center">
                <Play className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">Demo video coming soon</p>
                <p className="text-sm text-muted-foreground/60 mt-2">Click anywhere to close</p>
              </div>
            </div>
            <button 
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowDemo(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Landing;
