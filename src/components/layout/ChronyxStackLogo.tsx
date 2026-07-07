import { motion } from "framer-motion";
import chronyxMark from "@/assets/chronyx-mark.png";

interface ChronyxStackLogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  /** Show wordmark next to the mark. Defaults to true. */
  withWordmark?: boolean;
}

const markSize = {
  xs: "h-5 w-5",
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const wordSize = {
  xs: "text-[10px] tracking-[0.28em]",
  sm: "text-xs tracking-[0.3em]",
  md: "text-sm tracking-[0.32em]",
  lg: "text-lg tracking-[0.34em]",
  xl: "text-2xl tracking-[0.36em]",
};

export const ChronyxStackLogo = ({
  className = "",
  size = "md",
  animate = false,
  withWordmark = true,
}: ChronyxStackLogoProps) => {
  const Mark = (
    <img
      src={chronyxMark}
      alt="CHRONYX"
      className={`${markSize[size]} object-contain select-none dark:invert`}
      draggable={false}
    />
  );

  const content = (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {animate ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {Mark}
        </motion.div>
      ) : (
        Mark
      )}
      {withWordmark && (
        <span
          className={`font-extralight text-foreground ${wordSize[size]}`}
        >
          CHRONYX
        </span>
      )}
    </div>
  );

  return content;
};

export default ChronyxStackLogo;
