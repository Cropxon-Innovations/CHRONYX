import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import chronyxLogo from "@/assets/chronyx-circular-logo.png";
import { 
  CheckSquare, 
  BookOpen, 
  Wallet, 
  Heart, 
  Image,
  Clock,
  ArrowRight,
  Sparkles,
  User,
  Calendar,
  Target,
  Check,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OnboardingFlowProps {
  onComplete: () => void;
}

const FEATURE_STEPS = [
  {
    id: "welcome",
    title: "Welcome to CHRONYX",
    subtitle: "A quiet space for your life.",
    description: "Your personal sanctuary for holding everything that matters — with continuity.",
    icon: Sparkles,
    sketch: "◎",
    color: "from-primary/20 to-transparent",
    preview: null
  },
  {
    id: "todos",
    title: "Daily Tasks",
    subtitle: "Simple daily planning",
    description: "Organize todos by date, set priorities, and build quiet routines.",
    icon: CheckSquare,
    sketch: "M",
    color: "from-emerald-500/20 to-transparent",
    preview: "todos"
  },
  {
    id: "study",
    title: "Study Tracker",
    subtitle: "Syllabus at a glance",
    description: "Upload syllabi, track progress, and hold your learning journey.",
    icon: BookOpen,
    sketch: "◇",
    color: "from-blue-500/20 to-transparent",
    preview: "study"
  },
  {
    id: "finance",
    title: "Financial Clarity",
    subtitle: "Loans, budgets & expenses",
    description: "Track EMIs, monitor spending, and stay on top of your finances.",
    icon: Wallet,
    sketch: "△",
    color: "from-amber-500/20 to-transparent",
    preview: "finance"
  },
  {
    id: "insurance",
    title: "Insurance Hub",
    subtitle: "Policies organized",
    description: "Never miss a renewal. All your insurance in one private place.",
    icon: Heart,
    sketch: "○",
    color: "from-rose-500/20 to-transparent",
    preview: "insurance"
  },
  {
    id: "memory",
    title: "Memory Vault",
    subtitle: "Photos preserved",
    description: "Upload, organize, and protect your precious memories.",
    icon: Image,
    sketch: "□",
    color: "from-purple-500/20 to-transparent",
    preview: "memory"
  },
  {
    id: "lifespan",
    title: "Time Perspective",
    subtitle: "Your lifespan view",
    description: "See your life in weeks. Make each one count.",
    icon: Clock,
    sketch: "◉",
    color: "from-cyan-500/20 to-transparent",
    preview: "lifespan"
  }
];

const PROFILE_STEP = {
  id: "profile",
  title: "Let's personalize",
  subtitle: "Tell us about yourself",
  description: "Help us create a personalized experience for you.",
  icon: User,
  sketch: "★",
  color: "from-indigo-500/20 to-transparent"
};

const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile data
  const [displayName, setDisplayName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [targetAge, setTargetAge] = useState("80");
  
  // All steps including profile step at the end
  const allSteps = [...FEATURE_STEPS, PROFILE_STEP];
  const isProfileStep = currentStep === allSteps.length - 1;
  const isLastStep = currentStep === allSteps.length - 1;

  const handleNext = async () => {
    if (isProfileStep) {
      // Save profile data
      if (!displayName.trim()) {
        toast({
          title: "Please enter your name",
          variant: "destructive",
        });
        return;
      }
      
      setIsSaving(true);
      try {
        const { error } = await supabase
          .from("profiles")
          .upsert({
            id: user?.id,
            display_name: displayName.trim(),
            birth_date: birthDate || null,
            target_age: parseInt(targetAge) || 80,
          });
        
        if (error) throw error;
        
        toast({
          title: "Welcome to CHRONYX!",
          description: "Your profile has been set up.",
        });
        onComplete();
      } catch (error) {
        console.error("Error saving profile:", error);
        toast({
          title: "Error saving profile",
          description: "Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    } else {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    if (isProfileStep) {
      onComplete();
    } else {
      setDirection(1);
      setCurrentStep(allSteps.length - 1); // Jump to profile step
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  const step = allSteps[currentStep];
  const Icon = step.icon;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.95
    })
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isProfileStep) {
        handleNext();
      } else if (e.key === "ArrowRight" && !isProfileStep) {
        handleNext();
      } else if (e.key === "ArrowLeft" && currentStep > 0) {
        handleBack();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, isProfileStep]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        {/* Sketch grid */}
        <svg className="w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="onboarding-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path 
                d="M 40 0 L 0 0 0 40" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="0.5"
                strokeDasharray="2,4"
                className="text-foreground"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#onboarding-grid)" />
        </svg>

        {/* Floating sketch elements */}
        <motion.div
          className="absolute top-20 left-[10%] text-6xl font-light text-primary/10"
          animate={{ y: [-10, 10, -10], rotate: [-5, 5, -5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          ◇
        </motion.div>
        <motion.div
          className="absolute bottom-32 right-[15%] text-5xl font-light text-primary/10"
          animate={{ y: [10, -10, 10], rotate: [5, -5, 5] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          △
        </motion.div>
        <motion.div
          className="absolute top-[40%] right-[8%] text-4xl font-light text-primary/10"
          animate={{ y: [-5, 15, -5], rotate: [-3, 3, -3] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          ○
        </motion.div>

        {/* Gradient orb */}
        <motion.div
          className={`absolute inset-0 bg-gradient-radial ${step.color} opacity-30`}
          key={step.id}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.3 }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg px-6 text-center">
        {/* Logo at top */}
        {currentStep === 0 && (
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <img src={chronyxLogo} alt="CHRONYX" className="w-16 h-16 mx-auto" />
          </motion.div>
        )}
        
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8 sm:mb-12">
          {allSteps.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => {
                setDirection(i > currentStep ? 1 : -1);
                setCurrentStep(i);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep 
                  ? "w-8 bg-primary" 
                  : i < currentStep 
                    ? "w-1.5 bg-primary/50 cursor-pointer hover:bg-primary/70" 
                    : "w-1.5 bg-muted-foreground/30"
              }`}
              layoutId={`dot-${i}`}
            />
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-6"
          >
            {/* Icon with sketch element */}
            <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24">
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center backdrop-blur-sm">
                  <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-primary" strokeWidth={1.5} />
                </div>
              </motion.div>
              
              {/* Sketch decorator */}
              <motion.span
                className="absolute -top-2 -right-2 text-xl sm:text-2xl font-light text-primary/40"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {step.sketch}
              </motion.span>
            </div>

            {/* Title */}
            <motion.h1
              className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight text-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {step.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-base sm:text-lg text-muted-foreground font-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {step.subtitle}
            </motion.p>

            {/* Description or Profile Form */}
            {isProfileStep ? (
              <motion.div
                className="space-y-4 text-left max-w-sm mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Your Name *
                  </Label>
                  <Input
                    id="displayName"
                    placeholder="Enter your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-background"
                    autoFocus
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Birth Date (for lifespan tracking)
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="bg-background"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="targetAge" className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Target Age (life goal)
                  </Label>
                  <Input
                    id="targetAge"
                    type="number"
                    min="50"
                    max="120"
                    value={targetAge}
                    onChange={(e) => setTargetAge(e.target.value)}
                    className="bg-background"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.p
                className="text-sm text-muted-foreground/80 max-w-sm mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {step.description}
              </motion.p>
            )}

            {/* Feature Preview Animation */}
            {'preview' in step && step.preview && !isProfileStep && (
              <motion.div
                className="mt-6 p-4 bg-muted/30 rounded-xl border border-border/50"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center justify-center gap-4">
                  {step.preview === "todos" && (
                    <div className="flex flex-col gap-2 w-full max-w-xs">
                      {["Complete daily tasks", "Review progress", "Plan tomorrow"].map((task, i) => (
                        <motion.div
                          key={task}
                          className="flex items-center gap-2 text-sm text-foreground/80"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + i * 0.1 }}
                        >
                          <Check className="w-4 h-4 text-emerald-500" />
                          {task}
                        </motion.div>
                      ))}
                    </div>
                  )}
                  {step.preview === "study" && (
                    <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                        <motion.div
                          key={day}
                          className="text-center p-2 rounded-lg bg-blue-500/10"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 + i * 0.05 }}
                        >
                          <p className="text-xs text-muted-foreground">{day}</p>
                          <p className="text-sm font-medium text-blue-500">{Math.floor(Math.random() * 3 + 1)}h</p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  {step.preview === "finance" && (
                    <div className="flex items-end gap-1 h-16">
                      {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
                        <motion.div
                          key={i}
                          className="w-4 bg-gradient-to-t from-amber-500 to-amber-300 rounded-t"
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 0.6 + i * 0.05, duration: 0.3 }}
                        />
                      ))}
                    </div>
                  )}
                  {step.preview === "insurance" && (
                    <div className="flex gap-3">
                      {["Health", "Life", "Vehicle"].map((type, i) => (
                        <motion.div
                          key={type}
                          className="p-3 rounded-lg bg-rose-500/10 text-center"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 + i * 0.1 }}
                        >
                          <Heart className="w-5 h-5 text-rose-500 mx-auto mb-1" />
                          <p className="text-xs">{type}</p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  {step.preview === "memory" && (
                    <div className="grid grid-cols-3 gap-1">
                      {Array(6).fill(0).map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30"
                          initial={{ opacity: 0, rotate: -10 }}
                          animate={{ opacity: 1, rotate: 0 }}
                          transition={{ delay: 0.6 + i * 0.05 }}
                        />
                      ))}
                    </div>
                  )}
                  {step.preview === "lifespan" && (
                    <div className="w-full max-w-xs">
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300"
                          initial={{ width: 0 }}
                          animate={{ width: "35%" }}
                          transition={{ delay: 0.6, duration: 1 }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 text-center">35% of life lived</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="mt-8 sm:mt-12 flex flex-col gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-3 justify-center"
          >
            {currentStep > 0 && (
              <Button
                onClick={handleBack}
                variant="outline"
                size="lg"
                className="min-w-[100px]"
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              size="lg"
              className="min-w-[140px] group"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isProfileStep ? (
                <>
                  Get Started
                  <Sparkles className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </motion.div>

          {!isProfileStep && (
            <motion.button
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Skip intro
            </motion.button>
          )}
        </div>

        {/* Keyboard hint */}
        {!isProfileStep && (
          <motion.p
            className="mt-6 sm:mt-8 text-xs text-muted-foreground/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Use arrow keys or press Enter to navigate
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default OnboardingFlow;