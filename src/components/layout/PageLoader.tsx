import { motion } from "framer-motion";

// Inline SVG Logo Component - No Background
const ChronyxLogoSVG = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Outer ring */}
    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4"/>
    {/* Inner ring with gradient */}
    <defs>
      <linearGradient id="loaderRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#64748b' }}/>
        <stop offset="50%" style={{ stopColor: '#94a3b8' }}/>
        <stop offset="100%" style={{ stopColor: '#64748b' }}/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="38" fill="none" stroke="url(#loaderRingGradient)" strokeWidth="3"/>
    {/* Center C letter */}
    <text x="50" y="58" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontSize="32" fontWeight="300" fill="currentColor">C</text>
    {/* Decorative dots */}
    <circle cx="50" cy="12" r="3" fill="currentColor" opacity="0.6"/>
    <circle cx="88" cy="50" r="3" fill="currentColor" opacity="0.6"/>
    <circle cx="50" cy="88" r="3" fill="currentColor" opacity="0.6"/>
    <circle cx="12" cy="50" r="3" fill="currentColor" opacity="0.6"/>
  </svg>
);

const PageLoader = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
    >
      {/* CHRONYX Logo with spinning animation */}
      <div className="flex flex-col items-center gap-4">
        {/* Spinning Circular Logo - Inline SVG */}
        <motion.div
          className="w-16 h-16 sm:w-20 sm:h-20 text-foreground"
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <ChronyxLogoSVG className="w-full h-full" />
        </motion.div>
        
        {/* Logo Text */}
        <div className="flex flex-col items-center">
          <h1 className="text-2xl sm:text-3xl font-light tracking-[0.3em] text-foreground">
            CHRONYX
          </h1>
          <span className="text-[8px] sm:text-[9px] tracking-[0.12em] text-muted-foreground mt-0.5">
            BY CROPXON
          </span>
        </div>
        
        {/* Loading bar */}
        <div className="w-32 sm:w-40 h-0.5 bg-muted overflow-hidden rounded-full mt-2">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="h-full w-1/2 bg-gradient-to-r from-transparent via-primary/60 to-transparent"
          />
        </div>
        
        {/* Skeleton content preview */}
        <div className="mt-6 sm:mt-8 w-56 sm:w-64 space-y-3">
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="h-3 bg-muted rounded w-full"
          />
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
            className="h-3 bg-muted rounded w-3/4"
          />
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            className="h-3 bg-muted rounded w-1/2"
          />
        </div>
      </div>
      
      {/* By CROPXON text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-4 sm:bottom-6 md:bottom-8 flex flex-col items-center gap-0.5"
      >
        <p className="text-[9px] sm:text-[10px] md:text-xs tracking-[0.15em] text-muted-foreground text-center leading-relaxed">
          CHRONYX BY CROPXON<br />
          INNOVATIONS PVT. LTD.
        </p>
        <a 
          href="https://www.cropxon.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[8px] tracking-[0.1em] text-muted-foreground/60 hover:text-muted-foreground transition-colors sm:text-[9px]"
        >
          www.cropxon.com
        </a>
      </motion.div>
    </motion.div>
  );
};

export default PageLoader;