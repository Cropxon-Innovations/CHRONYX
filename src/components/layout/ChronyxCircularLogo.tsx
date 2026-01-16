import { motion } from "framer-motion";
import chronyxCircularLogo from "@/assets/chronyx-circular-logo.png";

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

export const ChronyxCircularLogo = ({ 
  className = "", 
  size = "md",
  animate = false,
  spinning = false
}: ChronyxCircularLogoProps) => {
  if (animate || spinning) {
    return (
      <motion.div
        className={`relative ${sizeConfig[size]} ${className}`}
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
        <img 
          src={chronyxCircularLogo} 
          alt="CHRONYX" 
          className="w-full h-full object-contain"
        />
      </motion.div>
    );
  }

  return (
    <div className={`relative ${sizeConfig[size]} ${className}`}>
      <img 
        src={chronyxCircularLogo} 
        alt="CHRONYX" 
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default ChronyxCircularLogo;
