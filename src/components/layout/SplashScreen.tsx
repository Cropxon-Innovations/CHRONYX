import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

interface SplashScreenProps {
  isVisible: boolean;
  onComplete?: () => void;
  minimal?: boolean;
}

/**
 * Splash logo — Orbital Nucleus assembled with a "liquid metal" feel:
 * nucleus pours in from a blurred drop, orbits draw on, electrons fly into place.
 */
const ChronxyxLogo = ({ className = "w-24 h-24" }: { className?: string }) => {
  const reduce = useReducedMotion();
  const orbits = [
    { rot: 0, dur: 18, dir: 1, w: 10, eR: 18, eFill: "hsl(var(--primary))" },
    { rot: 60, dur: 22, dir: -1, w: 8, eR: 14, eFill: "currentColor" },
    { rot: -60, dur: 26, dir: 1, w: 8, eR: 14, eFill: "currentColor" },
  ];
  return (
    <svg className={className} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="splash-n" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.82" />
        </radialGradient>
        <radialGradient id="splash-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
          <stop offset="70%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </radialGradient>
        <filter id="splash-blur"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>

      {/* Halo */}
      {!reduce && (
        <motion.circle
          cx="256" cy="256" r="252" fill="url(#splash-halo)"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0, 0.9, 0.5], scale: [0.6, 1.05, 1] }}
          transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
        />
      )}

      {/* Orbits draw on */}
      {orbits.map((o, i) => (
        <motion.g
          key={o.rot}
          style={{ transformOrigin: "256px 256px", transformBox: "fill-box" as any }}
          initial={{ rotate: o.rot - 90, opacity: 0 }}
          animate={
            reduce
              ? { rotate: o.rot, opacity: 1 }
              : { rotate: [o.rot - 90, o.rot, o.rot + o.dir * 360], opacity: [0, 1, 1] }
          }
          transition={
            reduce
              ? undefined
              : {
                  rotate: { duration: o.dur, times: [0, 0.18, 1], repeat: Infinity, ease: ["easeOut", "linear"] as any, delay: 0.2 + i * 0.12 },
                  opacity: { duration: 0.8, times: [0, 0.4, 1], delay: 0.2 + i * 0.12 },
                }
          }
        >
          <g transform={`rotate(${o.rot} 256 256)`}>
            <motion.ellipse
              cx="256" cy="256" rx="220" ry="74"
              fill="none" stroke="currentColor" strokeOpacity={0.55} strokeWidth={o.w}
              strokeDasharray="1380"
              initial={{ strokeDashoffset: 1380 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 1.1, delay: 0.25 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.circle
              cx="476" cy="256" r={o.eR} fill={o.eFill}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 1] }}
              transition={{ duration: 0.7, delay: 0.9 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            />
          </g>
        </motion.g>
      ))}

      {/* Nucleus liquid-metal drop */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        <motion.circle
          cx="256" cy="256" fill="url(#splash-n)" filter="url(#splash-blur)"
          initial={{ r: 0 }}
          animate={{ r: [0, 110, 78] }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.circle
          cx="256" cy="256" fill="url(#splash-n)"
          initial={{ r: 0 }}
          animate={{ r: [0, 92, 78] }}
          transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.circle
          cx="232" cy="232" r="22" fill="hsl(var(--background))" fillOpacity="0.22"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.4 }}
        />
      </motion.g>
    </svg>
  );
};

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
