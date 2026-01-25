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
      {/* Floating button */}
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
              className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 relative group"
            >
              <Sparkles className="w-6 h-6" />
              <span className="absolute -top-12 right-0 bg-card border border-border rounded-lg px-3 py-1.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                Ask NOVA Study
              </span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? "auto" : "auto"
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={cn(
              "fixed z-50 shadow-2xl rounded-2xl overflow-hidden border border-border bg-background",
              isMinimized 
                ? "bottom-6 right-6 w-80" 
                : "bottom-6 right-6 w-96 max-h-[600px]"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="font-medium text-sm">NOVA Study</span>
                  {currentTopic && !isMinimized && (
                    <p className="text-xs text-muted-foreground">{currentTopic}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            {!isMinimized && (
              <div className="max-h-[500px] overflow-auto">
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
