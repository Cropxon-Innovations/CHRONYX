import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useStudyOnboarding, 
  StudyOnboardingStep, 
  StudyMode, 
  StudyCategory, 
  StudyTemplate,
  StudyConfig,
  STUDY_TEMPLATES
} from "@/hooks/useStudyOnboarding";

import { StudyOnboardingWelcome } from "./StudyOnboardingWelcome";
import { StudyOnboardingCategory } from "./StudyOnboardingCategory";
import { StudyOnboardingTemplates } from "./StudyOnboardingTemplates";
import { StudyOnboardingConfigure } from "./StudyOnboardingConfigure";
import { StudyOnboardingSummary } from "./StudyOnboardingSummary";
import { StudyOnboardingCreating } from "./StudyOnboardingCreating";
import { StudyOnboardingBlank } from "./StudyOnboardingBlank";
import { StudyOnboardingAIParse } from "./StudyOnboardingAIParse";

interface Props {
  onComplete: () => void;
}

export const StudyOnboardingFlow = ({ onComplete }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState<StudyOnboardingStep>("welcome");
  const [selectedMode, setSelectedMode] = useState<StudyMode | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<StudyCategory | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<StudyTemplate | null>(null);
  const [config, setConfig] = useState<StudyConfig>({
    studyName: "",
    template: null,
    targetDate: null,
    dailyHours: 4,
    experienceLevel: "beginner",
    primaryGoal: "exam"
  });
  const [isCreating, setIsCreating] = useState(false);
  const [creatingProgress, setCreatingProgress] = useState(0);

  // Handle mode selection
  const handleModeSelect = (mode: StudyMode) => {
    setSelectedMode(mode);
    if (mode === "template") {
      setStep("category");
    } else if (mode === "blank") {
      setStep("configure"); // Using configure step for blank flow
    } else if (mode === "ai-parse") {
      setStep("configure"); // Using configure step for AI parse flow
    }
  };

  // Handle category selection
  const handleCategorySelect = (category: StudyCategory) => {
    setSelectedCategory(category);
    setStep("templates");
  };

  // Handle template selection
  const handleTemplateSelect = (template: StudyTemplate) => {
    setSelectedTemplate(template);
    setConfig(prev => ({ ...prev, template, studyName: template.name }));
    setStep("configure");
  };

  // Handle config update
  const handleConfigUpdate = (updates: Partial<StudyConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  // Create study from template
  const createStudyFromTemplate = async () => {
    if (!user || !selectedTemplate) return;
    
    setIsCreating(true);
    setStep("creating");
    setCreatingProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setCreatingProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      // Create the study subject (main entry)
      const { data: subject, error: subjectError } = await supabase
        .from("study_subjects")
        .insert({
          user_id: user.id,
          name: config.studyName || selectedTemplate.name,
          icon: selectedTemplate.icon,
          color: "#6366f1", // Default primary color
        })
        .select()
        .single();

      if (subjectError) throw subjectError;

      // Create some initial chapters based on template
      const initialChapters = [
        { name: "Getting Started", order_index: 0 },
        { name: "Core Concepts", order_index: 1 },
        { name: "Practice & Review", order_index: 2 },
      ];

      for (const chapter of initialChapters) {
        await supabase.from("study_chapters").insert({
          user_id: user.id,
          subject_id: subject.id,
          name: chapter.name,
          order_index: chapter.order_index,
        });
      }

      clearInterval(progressInterval);
      setCreatingProgress(100);

      // Short delay to show 100%
      await new Promise(resolve => setTimeout(resolve, 500));

      // Invalidate queries and complete
      queryClient.invalidateQueries({ queryKey: ["study-subjects"] });
      queryClient.invalidateQueries({ queryKey: ["study-chapters"] });
      
      toast({
        title: "Study workspace created!",
        description: `${config.studyName} is ready to go.`,
      });

      onComplete();
    } catch (error) {
      console.error("Error creating study:", error);
      toast({
        title: "Error creating study",
        description: "Please try again.",
        variant: "destructive",
      });
      setStep("summary");
      setIsCreating(false);
    }
  };

  // Create blank study
  const createBlankStudy = async (studyName: string, category: StudyCategory | null) => {
    if (!user) return;
    
    setIsCreating(true);

    try {
      const { error } = await supabase
        .from("study_subjects")
        .insert({
          user_id: user.id,
          name: studyName,
          icon: category === "government" ? "🏛️" : category === "technical" ? "💻" : category === "international" ? "🌍" : "📚",
          color: "#6366f1",
        });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["study-subjects"] });
      
      toast({
        title: "Study created!",
        description: `${studyName} is ready. Start adding subjects and topics.`,
      });

      onComplete();
    } catch (error) {
      console.error("Error creating study:", error);
      toast({
        title: "Error creating study",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // AI Parse syllabus
  const handleAIParse = async (file: File | null, text: string, studyName: string) => {
    if (!user) return;
    
    setIsCreating(true);

    try {
      // For now, create a basic study structure
      // In the future, this would call an AI endpoint to parse the syllabus
      const { error } = await supabase
        .from("study_subjects")
        .insert({
          user_id: user.id,
          name: studyName,
          icon: "🧠",
          color: "#6366f1",
        });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["study-subjects"] });
      
      toast({
        title: "Study created!",
        description: `${studyName} has been created. AI parsing will be available soon.`,
      });

      onComplete();
    } catch (error) {
      console.error("Error creating study:", error);
      toast({
        title: "Error creating study",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Navigation handlers
  const goBack = () => {
    switch (step) {
      case "category":
        setStep("welcome");
        break;
      case "templates":
        setStep("category");
        break;
      case "configure":
        if (selectedMode === "template") {
          setStep("templates");
        } else {
          setStep("welcome");
        }
        break;
      case "summary":
        setStep("configure");
        break;
      default:
        setStep("welcome");
    }
  };

  // Render current step
  const renderStep = () => {
    switch (step) {
      case "welcome":
        return (
          <StudyOnboardingWelcome 
            onSelectMode={handleModeSelect}
            onSkip={onComplete}
          />
        );
      
      case "category":
        return (
          <StudyOnboardingCategory
            onSelectCategory={handleCategorySelect}
            onBack={goBack}
          />
        );
      
      case "templates":
        return (
          <StudyOnboardingTemplates
            category={selectedCategory!}
            templates={STUDY_TEMPLATES}
            onSelectTemplate={handleTemplateSelect}
            onBack={goBack}
          />
        );
      
      case "configure":
        if (selectedMode === "blank") {
          return (
            <StudyOnboardingBlank
              onCreate={createBlankStudy}
              onBack={goBack}
              isCreating={isCreating}
            />
          );
        }
        if (selectedMode === "ai-parse") {
          return (
            <StudyOnboardingAIParse
              onParse={handleAIParse}
              onBack={goBack}
              isParsing={isCreating}
            />
          );
        }
        return (
          <StudyOnboardingConfigure
            template={selectedTemplate!}
            config={config}
            onUpdateConfig={handleConfigUpdate}
            onContinue={() => setStep("summary")}
            onBack={goBack}
          />
        );
      
      case "summary":
        return (
          <StudyOnboardingSummary
            config={config}
            template={selectedTemplate!}
            onUpdateStudyName={(name) => handleConfigUpdate({ studyName: name })}
            onCreate={createStudyFromTemplate}
            onBack={goBack}
            isCreating={isCreating}
          />
        );
      
      case "creating":
        return (
          <StudyOnboardingCreating
            template={selectedTemplate!}
            config={config}
            progress={creatingProgress}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="min-h-screen"
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
