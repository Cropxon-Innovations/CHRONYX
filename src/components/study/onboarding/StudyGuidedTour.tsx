import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  X,
  ArrowRight,
  BookOpen,
  BarChart3,
  Plus
} from "lucide-react";

interface Props {
  onComplete: () => void;
}

const tourSteps = [
  {
    id: "syllabus",
    title: "Your Complete Syllabus",
    description: "This is your syllabus tree. Track every subject, chapter, and topic here. Click any item to update its progress.",
    icon: BookOpen,
    position: "left" as const, // Which side the tooltip appears
    highlight: "syllabus-tree"
  },
  {
    id: "progress",
    title: "Track Your Progress",
    description: "These cards show your overall completion, streak, and study hours. Watch them grow as you study!",
    icon: BarChart3,
    position: "top" as const,
    highlight: "progress-cards"
  },
  {
    id: "add",
    title: "Customize Anytime",
    description: "You can always add new subjects, chapters, modules, or topics. Your syllabus grows with you.",
    icon: Plus,
    position: "bottom" as const,
    highlight: "add-button"
  }
];

export const StudyGuidedTour = ({ onComplete }: Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = tourSteps[currentStep];

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      >
        {/* Tour Card */}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm px-4"
        >
          <Card className="relative overflow-hidden">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>

            <div className="p-6">
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-4">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      index <= currentStep ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>

              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <step.icon className="w-6 h-6 text-primary" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-medium text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {step.description}
              </p>

              {/* Don't show again (on last step) */}
              {currentStep === tourSteps.length - 1 && (
                <div className="flex items-center gap-2 mb-4">
                  <Checkbox
                    id="dontShow"
                    checked={dontShowAgain}
                    onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
                  />
                  <label 
                    htmlFor="dontShow" 
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Don't show this again
                  </label>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-muted-foreground"
                >
                  Skip tour
                </Button>
                
                <Button onClick={handleNext} size="sm" className="gap-2">
                  {currentStep < tourSteps.length - 1 ? (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    "Get Started"
                  )}
                </Button>
              </div>
            </div>

            {/* Decorative corner */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
          </Card>
        </motion.div>

        {/* Spotlight effect could be added here for highlighting specific elements */}
      </motion.div>
    </AnimatePresence>
  );
};
