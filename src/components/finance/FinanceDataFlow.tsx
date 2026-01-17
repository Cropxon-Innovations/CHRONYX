import { motion } from "framer-motion";
import { Mail, Sparkles, ArrowRight, Database } from "lucide-react";

interface FinanceDataFlowProps {
  phase: "reading" | "parsing" | "categorizing" | "complete";
  itemsProcessed?: number;
  totalItems?: number;
}

const FinanceDataFlow = ({ phase, itemsProcessed = 0, totalItems = 0 }: FinanceDataFlowProps) => {
  const phases = [
    { id: "reading", label: "Reading emails", icon: Mail },
    { id: "parsing", label: "Extracting data", icon: Sparkles },
    { id: "categorizing", label: "Categorizing", icon: Database },
  ];

  const currentPhaseIndex = phases.findIndex((p) => p.id === phase);

  return (
    <div className="relative py-6">
      {/* Flow line */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted -translate-y-1/2" />
      
      {/* Animated progress line */}
      <motion.div
        className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-red-500 via-orange-500 to-emerald-500 -translate-y-1/2"
        initial={{ width: "0%" }}
        animate={{
          width: phase === "complete" 
            ? "100%" 
            : `${((currentPhaseIndex + 1) / phases.length) * 100}%`,
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />

      {/* Flowing particles */}
      {phase !== "complete" && (
        <motion.div
          className="absolute top-1/2 -translate-y-1/2"
          initial={{ left: "0%", opacity: 0 }}
          animate={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-orange-500 shadow-lg shadow-orange-500/50" />
        </motion.div>
      )}

      {/* Phase indicators */}
      <div className="relative flex justify-between">
        {phases.map((p, index) => {
          const isActive = currentPhaseIndex >= index;
          const isCurrent = currentPhaseIndex === index;
          const Icon = p.icon;

          return (
            <div key={p.id} className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                  opacity: isActive ? 1 : 0.5,
                }}
                transition={{ duration: 0.3 }}
                className={`relative w-12 h-12 rounded-full flex items-center justify-center ${
                  isActive
                    ? "bg-gradient-to-br from-red-500 to-orange-500"
                    : "bg-muted"
                }`}
              >
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500 to-orange-500"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 relative z-10 ${
                    isActive ? "text-white" : "text-muted-foreground"
                  }`}
                />
              </motion.div>
              <motion.span
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`mt-2 text-xs font-medium ${
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {p.label}
              </motion.span>
              {isCurrent && totalItems > 0 && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] text-muted-foreground"
                >
                  {itemsProcessed}/{totalItems}
                </motion.span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FinanceDataFlow;

// Compact inline version for buttons/headers
export const FinanceFlowIndicator = ({ syncing }: { syncing: boolean }) => {
  if (!syncing) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-4 h-4 rounded-full border-2 border-red-500 border-t-transparent"
      />
      <span className="text-xs text-muted-foreground">Syncing...</span>
    </motion.div>
  );
};
