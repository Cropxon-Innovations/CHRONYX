import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const STUDY_ONBOARDING_KEY = "chronyx_study_onboarding_complete";
const STUDY_TOUR_KEY = "chronyx_study_tour_complete";

export type StudyOnboardingStep = 
  | "welcome"
  | "category"
  | "templates"
  | "configure"
  | "summary"
  | "creating"
  | "complete";

export type StudyCategory = 
  | "government"
  | "technical"
  | "international";

export type StudyMode = 
  | "template"
  | "blank"
  | "ai-parse";

export interface StudyTemplate {
  id: string;
  name: string;
  category: StudyCategory;
  subcategory: string;
  level: "beginner" | "intermediate" | "advanced" | "full-prep";
  year: number;
  description: string;
  subjects: number;
  topics: number;
  isPopular?: boolean;
  isNew?: boolean;
  isRecommended?: boolean;
  lastUpdated: string;
  icon: string;
}

export interface StudyConfig {
  studyName: string;
  template: StudyTemplate | null;
  targetDate: Date | null;
  dailyHours: number;
  experienceLevel: "beginner" | "intermediate" | "advanced";
  primaryGoal: "exam" | "interview" | "skill-mastery";
}

export const STUDY_TEMPLATES: StudyTemplate[] = [
  // Government Exams
  {
    id: "upsc-prelims-2026",
    name: "UPSC Prelims 2026",
    category: "government",
    subcategory: "UPSC",
    level: "full-prep",
    year: 2026,
    description: "Complete preliminary exam syllabus with GS Paper I & CSAT",
    subjects: 8,
    topics: 245,
    isPopular: true,
    lastUpdated: "2025-01-15",
    icon: "🏛️"
  },
  {
    id: "upsc-mains-2026",
    name: "UPSC Mains 2026",
    category: "government",
    subcategory: "UPSC",
    level: "advanced",
    year: 2026,
    description: "Complete mains exam syllabus with all GS papers and Essay",
    subjects: 12,
    topics: 380,
    isRecommended: true,
    lastUpdated: "2025-01-10",
    icon: "📜"
  },
  {
    id: "opsc-oas-2026",
    name: "OPSC OAS 2026",
    category: "government",
    subcategory: "State PSC",
    level: "full-prep",
    year: 2026,
    description: "Odisha Administrative Service complete preparation",
    subjects: 10,
    topics: 198,
    isNew: true,
    lastUpdated: "2025-01-20",
    icon: "🎯"
  },
  {
    id: "opsc-ofs-2026",
    name: "OPSC OFS 2026",
    category: "government",
    subcategory: "State PSC",
    level: "full-prep",
    year: 2026,
    description: "Odisha Forest Service complete preparation",
    subjects: 10,
    topics: 185,
    isNew: true,
    lastUpdated: "2025-01-20",
    icon: "🌲"
  },
  {
    id: "ssc-cgl-2026",
    name: "SSC CGL 2026",
    category: "government",
    subcategory: "SSC",
    level: "intermediate",
    year: 2026,
    description: "Staff Selection Commission Combined Graduate Level",
    subjects: 4,
    topics: 120,
    isPopular: true,
    lastUpdated: "2025-01-08",
    icon: "📊"
  },
  
  // Technical Careers
  {
    id: "go-backend-master",
    name: "Go Backend Master",
    category: "technical",
    subcategory: "Backend",
    level: "advanced",
    year: 2026,
    description: "Complete Go/Golang backend development from basics to microservices",
    subjects: 12,
    topics: 156,
    isPopular: true,
    lastUpdated: "2025-01-18",
    icon: "🔷"
  },
  {
    id: "java-backend-master",
    name: "Java Backend Master",
    category: "technical",
    subcategory: "Backend",
    level: "advanced",
    year: 2026,
    description: "Spring Boot, Microservices, and enterprise Java patterns",
    subjects: 15,
    topics: 210,
    isRecommended: true,
    lastUpdated: "2025-01-12",
    icon: "☕"
  },
  {
    id: "kubernetes-architect",
    name: "Kubernetes Architect",
    category: "technical",
    subcategory: "DevOps",
    level: "advanced",
    year: 2026,
    description: "Complete K8s from pods to production clusters",
    subjects: 8,
    topics: 95,
    isNew: true,
    lastUpdated: "2025-01-22",
    icon: "☸️"
  },
  {
    id: "aws-solutions-architect",
    name: "AWS Solutions Architect",
    category: "technical",
    subcategory: "Cloud",
    level: "intermediate",
    year: 2026,
    description: "AWS SA Professional certification preparation",
    subjects: 14,
    topics: 178,
    isPopular: true,
    lastUpdated: "2025-01-14",
    icon: "☁️"
  },
  {
    id: "azure-architect",
    name: "Azure Architect",
    category: "technical",
    subcategory: "Cloud",
    level: "intermediate",
    year: 2026,
    description: "Microsoft Azure architecture and design patterns",
    subjects: 12,
    topics: 145,
    lastUpdated: "2025-01-11",
    icon: "🔷"
  },
  {
    id: "ml-engineer",
    name: "ML Engineer Path",
    category: "technical",
    subcategory: "AI/ML",
    level: "advanced",
    year: 2026,
    description: "Machine Learning engineering from fundamentals to production",
    subjects: 10,
    topics: 134,
    isRecommended: true,
    lastUpdated: "2025-01-16",
    icon: "🤖"
  },
  {
    id: "rag-agentic-ai",
    name: "RAG & Agentic AI",
    category: "technical",
    subcategory: "AI/ML",
    level: "advanced",
    year: 2026,
    description: "Retrieval Augmented Generation and AI Agents",
    subjects: 6,
    topics: 78,
    isNew: true,
    lastUpdated: "2025-01-24",
    icon: "🧠"
  },
  {
    id: "nextjs-fullstack",
    name: "Next.js Full-Stack",
    category: "technical",
    subcategory: "Frontend",
    level: "intermediate",
    year: 2026,
    description: "Modern React with Next.js App Router and Server Components",
    subjects: 8,
    topics: 98,
    isPopular: true,
    lastUpdated: "2025-01-19",
    icon: "▲"
  },
  {
    id: "docker-mastery",
    name: "Docker Mastery",
    category: "technical",
    subcategory: "DevOps",
    level: "beginner",
    year: 2026,
    description: "Containerization from basics to multi-stage builds",
    subjects: 5,
    topics: 62,
    lastUpdated: "2025-01-13",
    icon: "🐳"
  },
  {
    id: "kafka-streaming",
    name: "Kafka & Event Streaming",
    category: "technical",
    subcategory: "Backend",
    level: "advanced",
    year: 2026,
    description: "Apache Kafka, event-driven architecture, and stream processing",
    subjects: 7,
    topics: 84,
    lastUpdated: "2025-01-17",
    icon: "📨"
  },
  
  // International Exams
  {
    id: "gmat-full-prep",
    name: "GMAT Full Prep",
    category: "international",
    subcategory: "MBA",
    level: "full-prep",
    year: 2026,
    description: "Complete GMAT preparation with Quant, Verbal, and IR",
    subjects: 4,
    topics: 156,
    isPopular: true,
    lastUpdated: "2025-01-09",
    icon: "📈"
  },
  {
    id: "gre-complete",
    name: "GRE Complete",
    category: "international",
    subcategory: "Graduate",
    level: "full-prep",
    year: 2026,
    description: "GRE General Test complete preparation",
    subjects: 3,
    topics: 124,
    lastUpdated: "2025-01-07",
    icon: "🎓"
  },
  {
    id: "ielts-academic",
    name: "IELTS Academic",
    category: "international",
    subcategory: "English",
    level: "intermediate",
    year: 2026,
    description: "Academic IELTS with all 4 modules",
    subjects: 4,
    topics: 88,
    isRecommended: true,
    lastUpdated: "2025-01-06",
    icon: "🇬🇧"
  },
  {
    id: "toefl-ibt",
    name: "TOEFL iBT",
    category: "international",
    subcategory: "English",
    level: "intermediate",
    year: 2026,
    description: "Internet-based TOEFL complete preparation",
    subjects: 4,
    topics: 76,
    lastUpdated: "2025-01-05",
    icon: "🌐"
  }
];

export const useStudyOnboarding = () => {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<StudyOnboardingStep>("welcome");
  const [selectedMode, setSelectedMode] = useState<StudyMode | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<StudyCategory | null>(null);
  const [config, setConfig] = useState<StudyConfig>({
    studyName: "",
    template: null,
    targetDate: null,
    dailyHours: 4,
    experienceLevel: "beginner",
    primaryGoal: "exam"
  });

  const checkOnboardingStatus = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Check local storage first
      const localComplete = localStorage.getItem(`${STUDY_ONBOARDING_KEY}_${user.id}`);
      if (localComplete === "true") {
        // Check if tour should be shown
        const tourComplete = localStorage.getItem(`${STUDY_TOUR_KEY}_${user.id}`);
        if (tourComplete !== "true") {
          setShowTour(true);
        }
        setShowOnboarding(false);
        setIsLoading(false);
        return;
      }

      // Check if user has any study subjects
      const { data: subjects, error } = await supabase
        .from("study_subjects")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (error) throw error;

      if (subjects && subjects.length > 0) {
        // User has study data, mark onboarding complete
        localStorage.setItem(`${STUDY_ONBOARDING_KEY}_${user.id}`, "true");
        setShowOnboarding(false);
      } else {
        // No study data, show onboarding
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error("Error checking study onboarding status:", error);
      setShowOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  const completeOnboarding = useCallback(() => {
    if (user) {
      localStorage.setItem(`${STUDY_ONBOARDING_KEY}_${user.id}`, "true");
    }
    setShowOnboarding(false);
    setShowTour(true);
  }, [user]);

  const completeTour = useCallback(() => {
    if (user) {
      localStorage.setItem(`${STUDY_TOUR_KEY}_${user.id}`, "true");
    }
    setShowTour(false);
  }, [user]);

  const skipOnboarding = useCallback(() => {
    if (user) {
      localStorage.setItem(`${STUDY_ONBOARDING_KEY}_${user.id}`, "true");
      localStorage.setItem(`${STUDY_TOUR_KEY}_${user.id}`, "true");
    }
    setShowOnboarding(false);
    setShowTour(false);
  }, [user]);

  const resetOnboarding = useCallback(() => {
    if (user) {
      localStorage.removeItem(`${STUDY_ONBOARDING_KEY}_${user.id}`);
      localStorage.removeItem(`${STUDY_TOUR_KEY}_${user.id}`);
    }
    setCurrentStep("welcome");
    setSelectedMode(null);
    setSelectedCategory(null);
    setConfig({
      studyName: "",
      template: null,
      targetDate: null,
      dailyHours: 4,
      experienceLevel: "beginner",
      primaryGoal: "exam"
    });
    setShowOnboarding(true);
  }, [user]);

  const goToStep = useCallback((step: StudyOnboardingStep) => {
    setCurrentStep(step);
  }, []);

  const selectTemplate = useCallback((template: StudyTemplate) => {
    setConfig(prev => ({
      ...prev,
      template,
      studyName: template.name
    }));
  }, []);

  const updateConfig = useCallback((updates: Partial<StudyConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    showOnboarding,
    showTour,
    isLoading,
    currentStep,
    selectedMode,
    selectedCategory,
    config,
    templates: STUDY_TEMPLATES,
    setSelectedMode,
    setSelectedCategory,
    goToStep,
    selectTemplate,
    updateConfig,
    completeOnboarding,
    completeTour,
    skipOnboarding,
    resetOnboarding,
  };
};
