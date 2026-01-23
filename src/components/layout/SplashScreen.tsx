import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface SplashScreenProps {
  isVisible: boolean;
  onComplete?: () => void;
  minimal?: boolean;
}

// CHRONYX Logo Component - Same as Landing Page with proper theming
const ChronxyxLogo = ({ className = "w-24 h-24" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="splash-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
      </linearGradient>
    </defs>
    {/* Outer ring */}
    <circle 
      cx="50" cy="50" r="45" 
      stroke="url(#splash-logo-gradient)" 
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

// Animated letter component for character-by-character reveal
const AnimatedLetter = ({ 
  letter, 
  index, 
  baseDelay = 0,
  className = ""
}: { 
  letter: string; 
  index: number; 
  baseDelay?: number;
  className?: string;
}) => (
  <motion.span
    initial={{ opacity: 0, y: 20, rotateX: -90 }}
    animate={{ opacity: 1, y: 0, rotateX: 0 }}
    transition={{
      duration: 0.5,
      delay: baseDelay + index * 0.08,
      ease: [0.22, 1, 0.36, 1],
    }}
    className={`inline-block ${className}`}
    style={{ transformOrigin: "bottom" }}
  >
    {letter === " " ? "\u00A0" : letter}
  </motion.span>
);

const SplashScreen = ({ isVisible, onComplete, minimal = false }: SplashScreenProps) => {
  const [stage, setStage] = useState(0); // 0: logo, 1: CHRONYX, 2: BY, 3: ORIGINX

  useEffect(() => {
    if (isVisible && !minimal) {
      const timers = [
        setTimeout(() => setStage(1), 400),   // Show CHRONYX
        setTimeout(() => setStage(2), 1200),  // Show BY
        setTimeout(() => setStage(3), 1600),  // Show ORIGINX
        setTimeout(() => onComplete?.(), 3000), // Complete
      ];
      
      return () => timers.forEach(clearTimeout);
    } else if (isVisible && minimal) {
      const timer = setTimeout(() => onComplete?.(), 800);
      return () => clearTimeout(timer);
    }
  }, [isVisible, minimal, onComplete]);

  const chronyx = "CHRONYX";
  const originx = "ORIGINX LABS PVT LTD";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background overflow-hidden"
        >
          {/* Background gradient effect */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10"
            />
            {/* Subtle animated circles */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 0.15 }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
            />
            <motion.div
              initial={{ scale: 1, opacity: 0 }}
              animate={{ scale: 1.3, opacity: 0.1 }}
              transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse", delay: 0.5 }}
              className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-primary/5 blur-3xl"
            />
            {/* Additional glow for premium feel */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.08 }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.15)_0%,_transparent_70%)]"
            />
          </div>

          {/* Main content */}
          <div className="relative flex flex-col items-center gap-8">
            {/* Spinning CHRONYX Logo */}
            <motion.div
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <ChronxyxLogo className="w-full h-full" />
              </motion.div>
            </motion.div>

            {/* CHRONYX - Main brand name with character animation */}
            <div className="relative flex flex-col items-center gap-4">
              {stage >= 1 && (
                <motion.div className="relative">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight tracking-[0.35em] text-foreground">
                    {chronyx.split("").map((letter, i) => (
                      <AnimatedLetter 
                        key={i} 
                        letter={letter} 
                        index={i}
                        baseDelay={0}
                      />
                    ))}
                  </h1>
                  
                  {/* Animated underline */}
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-3 h-[1px] w-full origin-left bg-gradient-to-r from-primary/80 via-primary/40 to-transparent"
                  />
                </motion.div>
              )}

              {/* BY - Elegant centered connector */}
              {stage >= 2 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-4 py-2"
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: 32 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="h-[1px] bg-gradient-to-r from-transparent to-muted-foreground/30"
                  />
                  <motion.span 
                    initial={{ opacity: 0, letterSpacing: "0.5em" }}
                    animate={{ opacity: 0.6, letterSpacing: "0.3em" }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-xs sm:text-sm font-light text-muted-foreground tracking-[0.3em]"
                  >
                    BY
                  </motion.span>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: 32 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="h-[1px] bg-gradient-to-l from-transparent to-muted-foreground/30"
                  />
                </motion.div>
              )}

              {/* ORIGINX LABS PVT LTD - Company name with staggered reveal */}
              {stage >= 3 && (
                <motion.div className="flex flex-col items-center gap-1">
                  <div className="text-lg sm:text-xl md:text-2xl font-light tracking-[0.2em] text-foreground/90">
                    {originx.split("").map((letter, i) => (
                      <AnimatedLetter 
                        key={i} 
                        letter={letter} 
                        index={i}
                        baseDelay={0}
                        className="text-foreground/80"
                      />
                    ))}
                  </div>
                  
                  {/* Subtle decorative line */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="mt-2 h-[1px] w-24 origin-center bg-gradient-to-r from-transparent via-primary/30 to-transparent"
                  />
                </motion.div>
              )}
            </div>

            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6"
            >
              <div className="relative h-0.5 w-40 overflow-hidden rounded-full bg-muted/50 sm:w-56">
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute h-full w-1/3 bg-gradient-to-r from-transparent via-primary/70 to-transparent"
                />
              </div>
            </motion.div>
          </div>

          {/* Footer with website */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.5, y: 0 }}
            transition={{ delay: 2, duration: 0.5 }}
            className="absolute bottom-6 flex flex-col items-center gap-2 sm:bottom-8 md:bottom-10"
          >
            <a 
              href="https://www.originxlabs.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] tracking-[0.15em] text-muted-foreground/60 hover:text-muted-foreground transition-colors sm:text-xs"
            >
              www.originxlabs.com
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
