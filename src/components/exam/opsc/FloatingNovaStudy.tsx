import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, X, Minimize2 } from "lucide-react";
import { NovaStudyBot } from "./NovaStudyBot";
import { cn } from "@/lib/utils";

interface FloatingNovaStudyProps {
  examType?: string;
  subjects?: string[];
  currentTopic?: string;
}

export const FloatingNovaStudy: React.FC<FloatingNovaStudyProps> = ({
  examType = "OPSC",
  subjects = [],
  currentTopic,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <>
      {/* Floating button - Dark Charcoal Theme */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className={cn(
                "h-14 w-14 rounded-full shadow-xl relative group",
                "bg-zinc-900 hover:bg-zinc-800 border border-zinc-700",
                "transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              )}
            >
              <Sparkles className="w-6 h-6 text-white" />
              
              {/* Tooltip - Always visible on hover */}
              <span className={cn(
                "absolute -top-14 right-0 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap",
                "bg-zinc-900 text-white border border-zinc-700 shadow-xl",
                "opacity-0 group-hover:opacity-100 transition-all duration-200",
                "pointer-events-none"
              )}>
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  NOVA Study AI
                </span>
                <span className="absolute bottom-0 right-6 translate-y-1/2 rotate-45 w-2 h-2 bg-zinc-900 border-r border-b border-zinc-700" />
              </span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel - Dark Charcoal Theme */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={cn(
              "fixed z-50 shadow-2xl rounded-2xl overflow-hidden",
              "bg-zinc-900 border border-zinc-700",
              isMinimized ? "bottom-6 right-6 w-80" : "bottom-6 right-6 w-[420px] max-h-[650px]"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-zinc-800 to-zinc-900 border-b border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/20">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="font-semibold text-white">NOVA Study AI</span>
                  {currentTopic && !isMinimized && (
                    <p className="text-xs text-zinc-400">{currentTopic}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-700"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-700"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            {!isMinimized && (
              <div className="max-h-[550px] overflow-auto bg-zinc-900">
                <NovaStudyBot
                  examType={examType}
                  subjects={subjects}
                  currentTopic={currentTopic}
                  inline
                  onClose={() => setIsOpen(false)}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingNovaStudy;
