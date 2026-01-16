import { motion } from "framer-motion";
import chronyxCircularLogo from "@/assets/chronyx-circular-logo.png";

interface ChronyxMiniLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeConfig = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
};

export const ChronyxMiniLogo = ({ className = "", size = "md" }: ChronyxMiniLogoProps) => {
  return (
    <motion.div
      className={`relative ${sizeConfig[size]} ${className}`}
      whileHover={{ rotate: 360 }}
      transition={{ duration: 1, ease: "easeInOut" }}
    >
      <img 
        src={chronyxCircularLogo} 
        alt="CHRONYX" 
        className="w-full h-full object-contain"
      />
    </motion.div>
  );
};
