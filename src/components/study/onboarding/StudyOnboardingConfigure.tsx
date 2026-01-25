import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Clock,
  Target,
  GraduationCap,
  BookOpen,
  Briefcase,
  Zap
} from "lucide-react";
import { StudyConfig, StudyTemplate } from "@/hooks/useStudyOnboarding";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  template: StudyTemplate;
  config: StudyConfig;
  onUpdateConfig: (updates: Partial<StudyConfig>) => void;
  onContinue: () => void;
  onBack: () => void;
}

const experienceLevels = [
  { id: "beginner", label: "Beginner", description: "New to this field", icon: GraduationCap },
  { id: "intermediate", label: "Intermediate", description: "Some experience", icon: BookOpen },
  { id: "advanced", label: "Advanced", description: "Deep expertise", icon: Zap }
] as const;

const goals = [
  { id: "exam", label: "Exam Selection", description: "Clear a competitive exam", icon: Target },
  { id: "interview", label: "Interview Prep", description: "Prepare for job interviews", icon: Briefcase },
  { id: "skill-mastery", label: "Skill Mastery", description: "Master the subject deeply", icon: BookOpen }
] as const;

export const StudyOnboardingConfigure = ({ 
  template, 
  config, 
  onUpdateConfig, 
  onContinue, 
  onBack 
}: Props) => {
  const [dateOpen, setDateOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row p-4 sm:p-6 lg:p-8 gap-6 lg:gap-8">
      {/* Main Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 max-w-2xl mx-auto lg:mx-0"
      >
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </motion.div>

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full mb-4"
          >
            <span>Step 3 of 4</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <span>Configure</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl font-light tracking-tight text-foreground mb-2"
          >
            Configure Your Study
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground"
          >
            Personalize your preparation journey
          </motion.p>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {/* Target Date */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Label className="flex items-center gap-2 mb-2">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              Target Exam / Interview Date
            </Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !config.targetDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {config.targetDate ? format(config.targetDate, "PPP") : "Select target date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                <Calendar
                  mode="single"
                  selected={config.targetDate || undefined}
                  onSelect={(date) => {
                    onUpdateConfig({ targetDate: date || null });
                    setDateOpen(false);
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </motion.div>

          {/* Daily Study Hours */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Label className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Daily Study Hours: <span className="font-semibold text-primary">{config.dailyHours}h</span>
            </Label>
            <Slider
              value={[config.dailyHours]}
              onValueChange={([value]) => onUpdateConfig({ dailyHours: value })}
              min={1}
              max={12}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>1 hour</span>
              <span>12 hours</span>
            </div>
          </motion.div>

          {/* Experience Level */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Label className="mb-3 block">Experience Level</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {experienceLevels.map((level) => (
                <Card
                  key={level.id}
                  className={cn(
                    "cursor-pointer transition-all p-3 text-center hover:border-primary/30",
                    config.experienceLevel === level.id && "border-primary bg-primary/5"
                  )}
                  onClick={() => onUpdateConfig({ experienceLevel: level.id })}
                >
                  <level.icon className={cn(
                    "w-5 h-5 mx-auto mb-2",
                    config.experienceLevel === level.id ? "text-primary" : "text-muted-foreground"
                  )} />
                  <p className="font-medium text-sm">{level.label}</p>
                  <p className="text-xs text-muted-foreground">{level.description}</p>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Primary Goal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Label className="mb-3 block">Primary Goal</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {goals.map((goal) => (
                <Card
                  key={goal.id}
                  className={cn(
                    "cursor-pointer transition-all p-3 text-center hover:border-primary/30",
                    config.primaryGoal === goal.id && "border-primary bg-primary/5"
                  )}
                  onClick={() => onUpdateConfig({ primaryGoal: goal.id })}
                >
                  <goal.icon className={cn(
                    "w-5 h-5 mx-auto mb-2",
                    config.primaryGoal === goal.id ? "text-primary" : "text-muted-foreground"
                  )} />
                  <p className="font-medium text-sm">{goal.label}</p>
                  <p className="text-xs text-muted-foreground">{goal.description}</p>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Continue Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="pt-4"
          >
            <Button onClick={onContinue} className="w-full sm:w-auto gap-2">
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Summary Panel (Desktop) */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="hidden lg:block w-80"
      >
        <Card className="sticky top-8 p-6 bg-muted/30 border-border">
          <div className="text-3xl mb-4">{template.icon}</div>
          <h3 className="font-medium text-lg mb-1">{template.name}</h3>
          <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Year</span>
              <span className="font-medium">{template.year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subjects</span>
              <span className="font-medium">{template.subjects}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Topics</span>
              <span className="font-medium">{template.topics}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Level</span>
              <span className="font-medium capitalize">{template.level.replace('-', ' ')}</span>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
