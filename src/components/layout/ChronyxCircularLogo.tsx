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

// Inline SVG Logo Component - No Background
const LogoSVG = () => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Outer ring */}
    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4"/>
    {/* Inner ring with gradient */}
    <defs>
      <linearGradient id="circularRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#64748b' }}/>
        <stop offset="50%" style={{ stopColor: '#94a3b8' }}/>
        <stop offset="100%" style={{ stopColor: '#64748b' }}/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="38" fill="none" stroke="url(#circularRingGradient)" strokeWidth="3"/>
    {/* Center C letter */}
    <text x="50" y="58" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontSize="32" fontWeight="300" fill="currentColor">C</text>
    {/* Decorative dots */}
    <circle cx="50" cy="12" r="3" fill="currentColor" opacity="0.6"/>
    <circle cx="88" cy="50" r="3" fill="currentColor" opacity="0.6"/>
    <circle cx="50" cy="88" r="3" fill="currentColor" opacity="0.6"/>
    <circle cx="12" cy="50" r="3" fill="currentColor" opacity="0.6"/>
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
