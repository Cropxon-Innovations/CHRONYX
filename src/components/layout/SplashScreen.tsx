import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import chronyxLogo from "@/assets/chronyx-logo.png";

interface SplashScreenProps {
  isVisible: boolean;
  onComplete?: () => void;
  minimal?: boolean;
}

const SplashScreen = ({ isVisible, onComplete, minimal = false }: SplashScreenProps) => {
  const [showTagline, setShowTagline] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (isVisible && !minimal) {
      // Phase 1: Stack animation starts
      const phase1 = setTimeout(() => setAnimationPhase(1), 100);
      // Phase 2: Show logo fully
      const phase2 = setTimeout(() => setAnimationPhase(2), 600);
      // Phase 3: Show tagline
      const taglineTimer = setTimeout(() => setShowTagline(true), 800);
      // Complete
      const completeTimer = setTimeout(() => onComplete?.(), 2200);
      
      return () => {
        clearTimeout(phase1);
        clearTimeout(phase2);
        clearTimeout(taglineTimer);
        clearTimeout(completeTimer);
      };
    } else if (isVisible && minimal) {
      const timer = setTimeout(() => onComplete?.(), 800);
      return () => clearTimeout(timer);
    }
  }, [isVisible, minimal, onComplete]);

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
              animate={{ scale: 1.2, opacity: 0.1 }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
            />
            <motion.div
              initial={{ scale: 1, opacity: 0 }}
              animate={{ scale: 1.3, opacity: 0.08 }}
              transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse", delay: 0.5 }}
              className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
            />
          </div>

          {/* Main content */}
          <div className="relative flex flex-col items-center gap-6">
            {/* Stacked Logo Animation */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
              {/* Layer 1 - Bottom */}
              <motion.div
                initial={{ y: 40, opacity: 0, scale: 0.8 }}
                animate={{ 
                  y: animationPhase >= 1 ? 0 : 40, 
                  opacity: animationPhase >= 1 ? 1 : 0,
                  scale: animationPhase >= 1 ? 1 : 0.8
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <img 
                  src={chronyxLogo} 
                  alt="CHRONYX" 
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </motion.div>
            </div>

            {/* Logo text */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.6, 
                ease: [0.22, 1, 0.36, 1],
                delay: 0.4 
              }}
              className="relative"
            >
              <motion.h1
                className="text-3xl font-light tracking-[0.3em] text-foreground sm:text-4xl md:text-5xl"
                initial={{ letterSpacing: "0.6em", opacity: 0 }}
                animate={{ letterSpacing: "0.3em", opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                CHRONYX
              </motion.h1>

              {/* Animated underline */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="mt-2 h-px w-full origin-center bg-gradient-to-r from-transparent via-primary/60 to-transparent"
              />
            </motion.div>

            {/* Tagline */}
            {!minimal && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: showTagline ? 0.7 : 0, y: showTagline ? 0 : 10 }}
                transition={{ duration: 0.5 }}
                className="text-center text-xs tracking-[0.15em] text-muted-foreground sm:text-sm"
              >
                A Quiet Space for Your Life
              </motion.p>
            )}

            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-4"
            >
              <div className="relative h-0.5 w-32 overflow-hidden rounded-full bg-muted sm:w-48">
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute h-full w-1/2 bg-gradient-to-r from-transparent via-primary/60 to-transparent"
                />
              </div>
            </motion.div>
          </div>

          {/* Footer branding */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="absolute bottom-4 flex flex-col items-center gap-1 sm:bottom-6 md:bottom-8"
          >
            <p className="text-[9px] tracking-[0.2em] text-muted-foreground sm:text-[10px] md:text-xs">
              CHRONYX by CROPXON
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
