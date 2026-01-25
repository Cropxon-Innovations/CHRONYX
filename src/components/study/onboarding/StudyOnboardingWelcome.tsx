import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  BookOpen, 
  FileText, 
  Sparkles, 
  ArrowRight,
  LayoutTemplate,
  PenLine,
  Brain
} from "lucide-react";
import { StudyMode } from "@/hooks/useStudyOnboarding";
import chronyxLogo from "@/assets/chronyx-circular-logo.png";

interface Props {
  onSelectMode: (mode: StudyMode) => void;
  onSkip: () => void;
}

const modeOptions: {
  mode: StudyMode;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  isPrimary?: boolean;
  gradient: string;
}[] = [
  {
    mode: "template",
    icon: LayoutTemplate,
    title: "Start with a Template",
    subtitle: "Ready-made syllabi",
    description: "For UPSC, Tech Careers, GMAT, and more. Get started instantly.",
    isPrimary: true,
    gradient: "from-primary/20 to-primary/5"
  },
  {
    mode: "blank",
    icon: PenLine,
    title: "Start from Blank",
    subtitle: "Build your own",
    description: "Manually add subjects, chapters, and topics as you go.",
    gradient: "from-muted to-muted/50"
  },
  {
    mode: "ai-parse",
    icon: Brain,
    title: "AI Parse Syllabus",
    subtitle: "Upload & auto-build",
    description: "Upload a PDF, image, or text — AI will structure it for you.",
    gradient: "from-accent/20 to-accent/5"
  }
];

export const StudyOnboardingWelcome = ({ onSelectMode, onSkip }: Props) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 left-[10%] text-6xl font-light text-primary/5"
          animate={{ y: [-10, 10, -10], rotate: [-5, 5, -5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          ◇
        </motion.div>
        <motion.div
          className="absolute bottom-32 right-[15%] text-5xl font-light text-primary/5"
          animate={{ y: [10, -10, 10] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          △
        </motion.div>
        <motion.div
          className="absolute top-[40%] right-[8%] text-4xl font-light text-primary/5"
          animate={{ y: [-5, 15, -5] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          ○
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
              <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            </div>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-foreground mb-3"
          >
            Welcome to Chronyx Study
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto"
          >
            Build your complete preparation workspace — from syllabus to selection.
          </motion.p>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid gap-4 sm:gap-6">
          {modeOptions.map((option, index) => (
            <motion.div
              key={option.mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Card
                className={`group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                  option.isPrimary 
                    ? "border-primary/30 bg-gradient-to-r " + option.gradient
                    : "border-border bg-gradient-to-r " + option.gradient + " hover:border-primary/20"
                }`}
                onClick={() => onSelectMode(option.mode)}
              >
                <div className="p-4 sm:p-6 flex items-start gap-4">
                  <div className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center ${
                    option.isPrimary 
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                  } transition-colors`}>
                    <option.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-medium text-foreground text-base sm:text-lg">
                        {option.title}
                      </h3>
                      {option.isPrimary && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                      {option.subtitle}
                    </p>
                    <p className="text-sm text-muted-foreground/80 hidden sm:block">
                      {option.description}
                    </p>
                  </div>
                  
                  <ArrowRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Skip link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip for now
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};
