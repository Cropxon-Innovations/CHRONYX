import { motion } from "framer-motion";
import { Mail, Sparkles, Database, CheckCircle2, Loader2, FolderSearch, Tag, Import } from "lucide-react";

interface FinanceDataFlowProps {
  phase: "reading" | "parsing" | "categorizing" | "complete";
  itemsProcessed?: number;
  totalItems?: number;
}

const FinanceDataFlow = ({ phase, itemsProcessed = 0, totalItems = 0 }: FinanceDataFlowProps) => {
  const phases = [
    { id: "reading", label: "Connecting to Gmail", description: "Fetching your transaction emails", icon: Mail },
    { id: "parsing", label: "Extracting Details", description: "Reading amounts, merchants & dates", icon: FolderSearch },
    { id: "categorizing", label: "Smart Categorizing", description: "Organizing by spending category", icon: Tag },
    { id: "complete", label: "Ready to Import", description: "Transactions prepared for review", icon: Import },
  ];

  const currentPhaseIndex = phases.findIndex((p) => p.id === phase);

  return (
    <div className="py-4 px-2">
      {/* Current Step Highlight */}
      <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 rounded-full border-2 border-red-500/30 border-t-red-500 flex items-center justify-center"
            >
              {(() => {
                const CurrentIcon = phases[currentPhaseIndex]?.icon || Sparkles;
                return <CurrentIcon className="w-4 h-4 text-red-500" />;
              })()}
            </motion.div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {phases[currentPhaseIndex]?.label || "Processing..."}
            </p>
            <p className="text-xs text-muted-foreground">
              {phases[currentPhaseIndex]?.description}
            </p>
          </div>
          {totalItems > 0 && (
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{itemsProcessed}/{totalItems}</p>
              <p className="text-[10px] text-muted-foreground">processed</p>
            </div>
          )}
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-2">
        {phases.slice(0, -1).map((p, index) => {
          const isComplete = currentPhaseIndex > index;
          const isCurrent = currentPhaseIndex === index;
          const isPending = currentPhaseIndex < index;
          const Icon = p.icon;

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isCurrent 
                  ? "bg-primary/5 border border-primary/20" 
                  : isComplete 
                    ? "bg-vyom-success/5" 
                    : "opacity-50"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isComplete 
                  ? "bg-vyom-success text-white" 
                  : isCurrent 
                    ? "bg-gradient-to-br from-red-500 to-orange-500 text-white" 
                    : "bg-muted"
              }`}>
                {isComplete ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isCurrent ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Icon className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isCurrent ? "text-foreground" : isComplete ? "text-vyom-success" : "text-muted-foreground"}`}>
                  {p.label}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {p.description}
                </p>
              </div>
              <div className="text-[10px] text-muted-foreground shrink-0">
                Step {index + 1}/3
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Trust Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 text-center"
      >
        <p className="text-[10px] text-muted-foreground">
          🔒 Your data is processed securely and never stored on external servers
        </p>
      </motion.div>
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