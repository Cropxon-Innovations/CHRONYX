import { motion } from "framer-motion";
import { 
  BookOpen,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { StudyConfig, StudyTemplate } from "@/hooks/useStudyOnboarding";

interface Props {
  template: StudyTemplate;
  config: StudyConfig;
  progress: number;
}

const steps = [
  "Setting up your study workspace",
  "Creating subjects structure",
  "Adding chapters and modules",
  "Populating topics",
  "Configuring progress tracking"
];

export const StudyOnboardingCreating = ({ template, config, progress }: Props) => {
  const currentStepIndex = Math.min(Math.floor(progress / 20), steps.length - 1);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        {/* Animated Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-24 h-24 mx-auto mb-8"
        >
          {/* Outer ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/20"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Progress ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="44"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
              className="transition-all duration-500"
            />
          </svg>
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <BookOpen className="w-10 h-10 text-primary" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl sm:text-2xl font-light text-foreground mb-2"
        >
          Creating Your Workspace
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground mb-8"
        >
          {config.studyName || template.name}
        </motion.p>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-3 text-left max-w-xs mx-auto"
        >
          {steps.map((step, index) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-center gap-3"
            >
              {index < currentStepIndex ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : index === currentStepIndex ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-5 h-5 text-primary shrink-0" />
                </motion.div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-muted shrink-0" />
              )}
              <span className={`text-sm ${
                index <= currentStepIndex ? "text-foreground" : "text-muted-foreground"
              }`}>
                {step}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Progress percentage */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-sm text-muted-foreground mt-8"
        >
          {Math.round(progress)}% complete
        </motion.p>
      </motion.div>
    </div>
  );
};
