import { motion } from "framer-motion";
import chronyxStack from "@/assets/chronyx-stack.svg";

interface ChronyxStackLogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  animate?: boolean;
}

const sizeConfig = {
  xs: "w-8 h-5",
  sm: "w-10 h-6",
  md: "w-14 h-8",
  lg: "w-20 h-12",
  xl: "w-28 h-16",
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
            src={chronyxStack} 
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
        src={chronyxStack} 
        alt="CHRONYX" 
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default ChronyxStackLogo;
