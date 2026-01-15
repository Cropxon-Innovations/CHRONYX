import { motion } from "framer-motion";
import chronyxLogo from "@/assets/chronyx-logo.png";

interface ChronyxStackLogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  animate?: boolean;
}

const sizeConfig = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

export const ChronyxStackLogo = ({ 
  className = "", 
  size = "md",
  animate = false 
}: ChronyxStackLogoProps) => {
  if (animate) {
    return (
      <div className={`relative ${sizeConfig[size]} ${className}`}>
        {/* Animated stacked layers */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="absolute inset-0"
        >
          <img 
            src={chronyxLogo} 
            alt="CHRONYX" 
            className="w-full h-full object-contain"
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`relative ${sizeConfig[size]} ${className}`}>
      <img 
        src={chronyxLogo} 
        alt="CHRONYX" 
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default ChronyxStackLogo;
