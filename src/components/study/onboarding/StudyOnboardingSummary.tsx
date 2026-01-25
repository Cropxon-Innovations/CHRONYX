import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft,
  Check,
  Calendar,
  Clock,
  Target,
  BookOpen,
  Sparkles
} from "lucide-react";
import { StudyConfig, StudyTemplate } from "@/hooks/useStudyOnboarding";
import { format } from "date-fns";

interface Props {
  config: StudyConfig;
  template: StudyTemplate;
  onUpdateStudyName: (name: string) => void;
  onCreate: () => void;
  onBack: () => void;
  isCreating: boolean;
}

export const StudyOnboardingSummary = ({ 
  config, 
  template, 
  onUpdateStudyName, 
  onCreate, 
  onBack,
  isCreating 
}: Props) => {
  const summaryItems = [
    {
      icon: BookOpen,
      label: "Template",
      value: template.name
    },
    {
      icon: Target,
      label: "Category",
      value: template.subcategory
    },
    {
      icon: Calendar,
      label: "Target Date",
      value: config.targetDate ? format(config.targetDate, "PPP") : "Not set"
    },
    {
      icon: Clock,
      label: "Daily Hours",
      value: `${config.dailyHours} hours/day`
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
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
        <div className="text-center mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full mb-4"
          >
            <span>Step 4 of 4</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <span>Review & Create</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl font-light tracking-tight text-foreground mb-2"
          >
            Ready to Create
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground"
          >
            Review your study configuration
          </motion.p>
        </div>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 mb-6">
            {/* Template icon and name input */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
              <div className="text-4xl">{template.icon}</div>
              <div className="flex-1">
                <Label htmlFor="studyName" className="text-xs text-muted-foreground mb-1 block">
                  Study Name
                </Label>
                <Input
                  id="studyName"
                  value={config.studyName}
                  onChange={(e) => onUpdateStudyName(e.target.value)}
                  placeholder="Enter study name"
                  className="font-medium text-lg border-none p-0 h-auto focus-visible:ring-0 bg-transparent"
                />
              </div>
            </div>

            {/* Summary items */}
            <div className="space-y-4">
              {summaryItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.value}</span>
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-light text-primary">{template.subjects}</p>
                  <p className="text-xs text-muted-foreground">Subjects</p>
                </div>
                <div>
                  <p className="text-2xl font-light text-primary">{template.topics}</p>
                  <p className="text-xs text-muted-foreground">Topics</p>
                </div>
                <div>
                  <p className="text-2xl font-light text-primary">{template.year}</p>
                  <p className="text-xs text-muted-foreground">Year</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Create Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Button 
            onClick={onCreate} 
            className="w-full gap-2"
            size="lg"
            disabled={isCreating || !config.studyName.trim()}
          >
            {isCreating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Create Study Workspace
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};
