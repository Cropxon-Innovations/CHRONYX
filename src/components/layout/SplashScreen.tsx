import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface SplashScreenProps {
  isVisible: boolean;
  onComplete?: () => void;
  minimal?: boolean;
}

// CHRONYX Logo — outer ring static, inner geometric symbol animates (rotation + pulse)
const ChronxyxLogo = ({ className = "w-24 h-24" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer disc */}
    <circle cx="256" cy="256" r="248" fill="currentColor" />
    {/* Concentric ring */}
    <circle cx="256" cy="256" r="200" fill="none" stroke="hsl(var(--background))" strokeWidth="32" />
    {/* Inner disc — animated group */}
    <motion.g
      style={{ originX: "256px", originY: "256px", transformBox: "fill-box" } as any}
      animate={{ rotate: [0, 360], scale: [1, 1.04, 1] }}
      transition={{
        rotate: { duration: 6, repeat: Infinity, ease: "linear" },
        scale: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      <circle cx="256" cy="256" r="168" fill="currentColor" />
      <path
        d="M256 128 L256 216 L168 216 L168 256 L216 256 L216 344 L256 344 L256 296 L344 296 L344 256 L296 256 L296 168 L256 168 L256 128Z"
        fill="hsl(var(--background))"
      />
      <rect x="168" y="168" width="40" height="48" fill="hsl(var(--background))" />
      <rect x="304" y="296" width="40" height="48" fill="hsl(var(--background))" />
      <rect x="296" y="168" width="48" height="40" fill="hsl(var(--background))" />
      <rect x="168" y="304" width="48" height="40" fill="hsl(var(--background))" />
    </motion.g>
    {/* Pulsing accent ring around the inner symbol */}
    <motion.circle
      cx="256"
      cy="256"
      r="180"
      fill="none"
      stroke="hsl(var(--primary))"
      strokeWidth="2"
      style={{ originX: "256px", originY: "256px", transformBox: "fill-box" } as any}
      animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0, 0.6] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
    />
  </svg>
);

const SplashScreen = ({ isVisible, onComplete, minimal = false }: SplashScreenProps) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (isVisible && !minimal) {
      const timers = [
        setTimeout(() => setStage(1), 400),
        setTimeout(() => onComplete?.(), 2400),
      ];
      return () => timers.forEach(clearTimeout);
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.08 }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.15)_0%,_transparent_70%)]"
            />
          </div>

          {/* Main content */}
          <div className="relative flex flex-col items-center gap-8">
            <motion.div
              className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 text-foreground"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <ChronxyxLogo className="w-full h-full" />
            </motion.div>

            <div className="relative flex flex-col items-center gap-3">
              {stage >= 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="relative"
                >
                  <h1 className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight tracking-[0.35em] text-foreground whitespace-nowrap">
                    CHRONYX
                  </h1>
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-2 h-[1px] w-full origin-left bg-gradient-to-r from-primary/80 via-primary/40 to-transparent"
                  />
                </motion.div>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-2"
            >
              <div className="relative h-0.5 w-40 overflow-hidden rounded-full bg-muted/50 sm:w-56">
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute h-full w-1/3 bg-gradient-to-r from-transparent via-primary/70 to-transparent"
                />
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.5, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="absolute bottom-6 flex flex-col items-center gap-3 sm:bottom-8 md:bottom-10"
          >
            <p className="text-[10px] tracking-[0.12em] text-muted-foreground/50 sm:text-xs">
              made with <span className="text-destructive">❤️</span>{" "}
              <a
                href="https://www.abhishekpanda.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-muted-foreground transition-colors underline underline-offset-2"
              >
                Abhishek Panda
              </a>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
