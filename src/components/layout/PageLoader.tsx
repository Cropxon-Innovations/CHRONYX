import { motion } from "framer-motion";
import chronyxCircularLogo from "@/assets/chronyx-circular-logo.png";

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
        {/* Spinning Circular Logo */}
        <motion.div
          className="w-16 h-16 sm:w-20 sm:h-20"
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <img 
            src={chronyxCircularLogo} 
            alt="CHRONYX" 
            className="w-full h-full object-contain"
          />
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
      
      {/* By CROPXON text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-4 sm:bottom-6 md:bottom-8 text-[9px] sm:text-[10px] md:text-xs tracking-[0.15em] text-muted-foreground text-center leading-relaxed"
      >
        CHRONYX BY CROPXON<br />
        INNOVATIONS PVT. LTD.
      </motion.p>
    </motion.div>
  );
};

export default PageLoader;
