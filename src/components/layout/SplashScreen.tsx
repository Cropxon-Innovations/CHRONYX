import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface SplashScreenProps {
  isVisible: boolean;
  onComplete?: () => void;
  minimal?: boolean;
}

const SplashScreen = ({ isVisible, onComplete, minimal = false }: SplashScreenProps) => {
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    if (isVisible && !minimal) {
      const taglineTimer = setTimeout(() => setShowTagline(true), 600);
      const completeTimer = setTimeout(() => onComplete?.(), 2000);
      
      return () => {
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
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
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
            {/* Logo animation */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.6, 
                ease: [0.22, 1, 0.36, 1],
                delay: 0.1 
              }}
              className="relative"
            >
              {/* Logo text */}
              <motion.h1
                className="text-4xl font-light tracking-[0.4em] text-foreground sm:text-5xl md:text-6xl"
                initial={{ letterSpacing: "0.8em", opacity: 0 }}
                animate={{ letterSpacing: "0.4em", opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                CHRONYX
              </motion.h1>

              {/* Animated underline */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mt-2 h-px w-full origin-center bg-gradient-to-r from-transparent via-primary/60 to-transparent"
              />
            </motion.div>

            {/* Tagline */}
            {!minimal && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: showTagline ? 0.7 : 0, y: showTagline ? 0 : 10 }}
                transition={{ duration: 0.5 }}
                className="text-center text-sm tracking-[0.15em] text-muted-foreground sm:text-base"
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
            className="absolute bottom-6 flex flex-col items-center gap-1 sm:bottom-8"
          >
            <p className="text-[10px] tracking-[0.2em] text-muted-foreground sm:text-xs">
              CHRONYX by CROPXON
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
