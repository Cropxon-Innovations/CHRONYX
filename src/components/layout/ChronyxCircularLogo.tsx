import { motion } from "framer-motion";

interface ChronyxCircularLogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  spinning?: boolean;
}

const sizeConfig = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

// CHRONYX Logo Component - Consistent with Landing Page (no "C" letter)
const LogoSVG = () => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <linearGradient id="circular-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
      </linearGradient>
    </defs>
    {/* Outer ring */}
    <circle 
      cx="50" cy="50" r="45" 
      stroke="url(#circular-logo-gradient)" 
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

export const ChronyxCircularLogo = ({ 
  className = "", 
  size = "md",
  animate = false,
  spinning = false
}: ChronyxCircularLogoProps) => {
  if (animate || spinning) {
    return (
      <motion.div
        className={`relative ${sizeConfig[size]} ${className} text-foreground`}
        initial={animate ? { opacity: 0, scale: 0.8 } : undefined}
        animate={{
          opacity: 1,
          scale: 1,
          rotate: spinning ? 360 : 0,
        }}
        transition={spinning ? {
          rotate: {
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          },
          opacity: { duration: 0.3 },
          scale: { duration: 0.3 },
        } : {
          duration: 0.4,
          ease: "easeOut",
        }}
      >
        <LogoSVG />
      </motion.div>
    );
  }

  return (
    <div className={`relative ${sizeConfig[size]} ${className} text-foreground`}>
      <LogoSVG />
    </div>
  );
};

export default ChronyxCircularLogo;
