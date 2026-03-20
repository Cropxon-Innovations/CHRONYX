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
  <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <circle cx="256" cy="256" r="248" fill="currentColor" />
    <circle cx="256" cy="256" r="200" fill="none" stroke="hsl(var(--background))" strokeWidth="32" />
    <circle cx="256" cy="256" r="168" fill="currentColor" />
    <path
      d="M256 128 L256 216 L168 216 L168 256 L216 256 L216 344 L256 344 L256 296 L344 296 L344 256 L296 256 L296 168 L256 168 L256 128Z"
      fill="hsl(var(--background))"
    />
    <rect x="168" y="168" width="40" height="48" fill="hsl(var(--background))" />
    <rect x="304" y="296" width="40" height="48" fill="hsl(var(--background))" />
    <rect x="296" y="168" width="48" height="40" fill="hsl(var(--background))" />
    <rect x="168" y="304" width="48" height="40" fill="hsl(var(--background))" />
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
