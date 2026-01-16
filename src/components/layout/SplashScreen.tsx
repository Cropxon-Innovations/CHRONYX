import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface SplashScreenProps {
  isVisible: boolean;
  onComplete?: () => void;
  minimal?: boolean;
}

// Inline SVG Logo Component - No Background
const ChronyxLogoSVG = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Outer ring */}
    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4"/>
    {/* Inner ring with gradient */}
    <defs>
      <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#64748b' }}/>
        <stop offset="50%" style={{ stopColor: '#94a3b8' }}/>
        <stop offset="100%" style={{ stopColor: '#64748b' }}/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="38" fill="none" stroke="url(#ringGradient)" strokeWidth="3"/>
    {/* Center C letter */}
    <text x="50" y="58" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontSize="32" fontWeight="300" fill="currentColor">C</text>
    {/* Decorative dots */}
    <circle cx="50" cy="12" r="3" fill="currentColor" opacity="0.6"/>
    <circle cx="88" cy="50" r="3" fill="currentColor" opacity="0.6"/>
    <circle cx="50" cy="88" r="3" fill="currentColor" opacity="0.6"/>
    <circle cx="12" cy="50" r="3" fill="currentColor" opacity="0.6"/>
  </svg>
);

const SplashScreen = ({ isVisible, onComplete, minimal = false }: SplashScreenProps) => {
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    if (isVisible && !minimal) {
      const taglineTimer = setTimeout(() => setShowTagline(true), 800);
      const completeTimer = setTimeout(() => onComplete?.(), 2200);
      
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
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900 overflow-hidden"
        >
          {/* Background gradient effect */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 bg-gradient-to-br from-slate-800/20 via-transparent to-slate-700/10"
            />
            {/* Subtle animated circles */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 0.15 }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-slate-500/20 blur-3xl"
            />
            <motion.div
              initial={{ scale: 1, opacity: 0 }}
              animate={{ scale: 1.3, opacity: 0.1 }}
              transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse", delay: 0.5 }}
              className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-slate-600/20 blur-3xl"
            />
          </div>

          {/* Main content */}
          <div className="relative flex flex-col items-center gap-6">
            {/* Spinning Circular Logo - Inline SVG */}
            <motion.div
              className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 text-slate-50"
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <ChronyxLogoSVG className="w-full h-full" />
            </motion.div>

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
                className="text-3xl font-light tracking-[0.3em] text-slate-50 sm:text-4xl md:text-5xl"
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
                className="mt-2 h-px w-full origin-center bg-gradient-to-r from-transparent via-slate-400/60 to-transparent"
              />
            </motion.div>

            {/* Tagline */}
            {!minimal && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: showTagline ? 0.7 : 0, y: showTagline ? 0 : 10 }}
                transition={{ duration: 0.5 }}
                className="text-center text-xs tracking-[0.15em] text-slate-400 sm:text-sm"
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
              <div className="relative h-0.5 w-32 overflow-hidden rounded-full bg-slate-800 sm:w-48">
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute h-full w-1/2 bg-gradient-to-r from-transparent via-slate-500 to-transparent"
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
            <p className="text-[9px] tracking-[0.15em] text-slate-500 sm:text-[10px] md:text-xs text-center leading-relaxed">
              CHRONYX BY CROPXON<br />
              INNOVATIONS PVT. LTD.
            </p>
            <a 
              href="https://www.cropxon.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[8px] tracking-[0.1em] text-slate-600 hover:text-slate-400 transition-colors sm:text-[9px]"
            >
              www.cropxon.com
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
