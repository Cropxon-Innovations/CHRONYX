import { motion, useReducedMotion } from "framer-motion";

interface ChronyxMiniLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeConfig = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
};

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

export const ChronyxMiniLogo = ({ className = "", size = "md" }: ChronyxMiniLogoProps) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`relative ${sizeConfig[size]} ${className} text-foreground`}
      whileHover={reduce ? undefined : { rotate: 360 }}
      transition={{ duration: 1, ease: "easeInOut" }}
      aria-label="CHRONYX"
    >
      <LogoSVG />
    </motion.div>
  );
};
