import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import chronyxMark from "@/assets/chronyx-mark.png";

interface SplashScreenProps {
  isVisible: boolean;
  onComplete?: () => void;
  minimal?: boolean;
}

/**
 * Premium animated splash — real logo mark reveals over an aurora backdrop.
 * No square frame around the logo; transparent PNG floats on ambient gradients.
 */
const SplashScreen = ({ isVisible, onComplete, minimal = false }: SplashScreenProps) => {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!isVisible) return;
    const t = setTimeout(() => onComplete?.(), minimal ? 700 : 2200);
    return () => clearTimeout(t);
  }, [isVisible, minimal, onComplete]);

  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.55, ease }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-background"
        >
          {/* Aurora backdrop — soft, non-square, no hard edges */}
          <div className="pointer-events-none absolute inset-0">
            <motion.div
              className="absolute -top-1/3 left-1/2 h-[70vmax] w-[70vmax] -translate-x-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, hsl(var(--primary)/0.18), transparent 60%)",
                filter: "blur(40px)",
              }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.4, ease }}
            />
            <motion.div
              className="absolute bottom-[-20vmax] left-[-10vmax] h-[55vmax] w-[55vmax] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, hsl(var(--primary)/0.10), transparent 65%)",
                filter: "blur(60px)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.6, delay: 0.1, ease }}
            />
            <motion.div
              className="absolute right-[-15vmax] top-[10vmax] h-[45vmax] w-[45vmax] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, hsl(var(--foreground)/0.06), transparent 70%)",
                filter: "blur(50px)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.8, delay: 0.2, ease }}
            />
            {/* Subtle grain overlay */}
            <div
              className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
              style={{
                backgroundImage:
                  "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)",
                backgroundSize: "3px 3px",
              }}
            />
          </div>

          {/* Center stack */}
          <div className="relative flex flex-col items-center gap-8">
            {/* Logo mark — real transparent PNG with concentric ring pulse */}
            <div className="relative flex h-36 w-36 items-center justify-center sm:h-44 sm:w-44">
              {!reduce && (
                <>
                  <motion.span
                    className="absolute inset-0 rounded-full border border-primary/30"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: [0.6, 1.4], opacity: [0.6, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                  />
                  <motion.span
                    className="absolute inset-0 rounded-full border border-primary/20"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: [0.6, 1.7], opacity: [0.5, 0] }}
                    transition={{
                      duration: 2.6,
                      repeat: Infinity,
                      ease: "easeOut",
                      delay: 0.6,
                    }}
                  />
                </>
              )}
              <motion.img
                src={chronyxMark}
                alt="Chronyx"
                width={512}
                height={512}
                className="relative h-24 w-24 select-none object-contain drop-shadow-[0_10px_30px_hsl(var(--primary)/0.35)] dark:invert sm:h-28 sm:w-28"
                initial={{ opacity: 0, scale: 0.7, filter: "blur(12px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.9, ease }}
                draggable={false}
              />
            </div>

            {/* Wordmark */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease }}
              className="flex flex-col items-center gap-2"
            >
              <h1 className="text-3xl font-extralight tracking-[0.42em] text-foreground sm:text-4xl md:text-5xl">
                CHRONYX
              </h1>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.9, delay: 0.7, ease }}
                className="h-px w-40 origin-center bg-gradient-to-r from-transparent via-primary/70 to-transparent sm:w-56"
              />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.55 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                className="text-[10px] font-light tracking-[0.4em] text-muted-foreground sm:text-xs"
              >
                BY ORIGINX LABS
              </motion.p>
            </motion.div>

            {/* Loading shimmer */}
            {!minimal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="mt-2 h-[2px] w-40 overflow-hidden rounded-full bg-muted/40 sm:w-56"
              >
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent"
                />
              </motion.div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.5, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="absolute bottom-6 flex flex-col items-center gap-1 sm:bottom-8"
          >
            <p className="text-[10px] tracking-[0.12em] text-muted-foreground/60 sm:text-xs">
              made with <span className="text-destructive">❤️</span>{" "}
              <a
                href="https://www.abhishekpanda.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 transition-colors hover:text-muted-foreground"
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
