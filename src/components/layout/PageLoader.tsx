import { motion } from "framer-motion";

// CHRONYX Logo Component - Consistent with Landing Page (no "C" letter)
const ChronyxLogoSVG = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="loader-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
      </linearGradient>
    </defs>
    {/* Outer ring */}
    <circle 
      cx="50" cy="50" r="45" 
      stroke="url(#loader-logo-gradient)" 
      strokeWidth="2" 
      fill="none"
      opacity="0.8"
    />
    {/* Inner dashed ring */}
    <circle 
      cx="50" cy="50" r="35" 
      stroke="hsl(var(--primary))" 
      strokeWidth="1" 
      strokeDasharray="6 4"
      fill="none"
      opacity="0.4"
    />
    {/* Center dot */}
    <circle 
      cx="50" cy="50" r="5" 
      fill="hsl(var(--primary))"
      opacity="0.9"
    />
    {/* Time markers at 12, 3, 6, 9 o'clock positions */}
    <circle cx="50" cy="10" r="2" fill="hsl(var(--primary))" opacity="0.5"/>
    <circle cx="90" cy="50" r="2" fill="hsl(var(--primary))" opacity="0.5"/>
    <circle cx="50" cy="90" r="2" fill="hsl(var(--primary))" opacity="0.5"/>
    <circle cx="10" cy="50" r="2" fill="hsl(var(--primary))" opacity="0.5"/>
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
      
      {/* By ORIGINX LABS text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-4 sm:bottom-6 md:bottom-8 flex flex-col items-center gap-0.5"
      >
        <p className="text-[9px] sm:text-[10px] md:text-xs tracking-[0.15em] text-muted-foreground text-center leading-relaxed">
          CHRONYX BY ORIGINX<br />
          LABS PVT. LTD.
        </p>
        <a 
          href="https://www.originxlabs.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[8px] tracking-[0.1em] text-muted-foreground/60 hover:text-muted-foreground transition-colors sm:text-[9px]"
        >
          www.originxlabs.com
        </a>
      </motion.div>
    </motion.div>
  );
};

export default PageLoader;