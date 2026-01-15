import { motion } from "framer-motion";
import chronyxLogo from "@/assets/chronyx-logo.png";

const PageLoader = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
    >
      {/* CHRONYX Logo with stack animation */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="flex flex-col items-center gap-4"
      >
        {/* Stack Logo with bounce effect */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20">
          <motion.div
            animate={{
              y: [0, -5, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <img 
              src={chronyxLogo} 
              alt="CHRONYX" 
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </motion.div>
        </div>
        
        {/* Logo Text */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-[0.3em] text-foreground">
          CHRONYX
        </h1>
        
        {/* Loading bar */}
        <div className="w-40 sm:w-48 h-0.5 bg-muted overflow-hidden rounded-full">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="h-full w-1/2 bg-primary/60"
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
      </motion.div>
      
      {/* By CROPXON text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-4 sm:bottom-6 md:bottom-8 text-[9px] sm:text-[10px] md:text-xs tracking-[0.2em] text-muted-foreground"
      >
        CHRONYX by CROPXON
      </motion.p>
    </motion.div>
  );
};

export default PageLoader;
