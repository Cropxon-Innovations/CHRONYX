import React, { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useActivityLog } from "@/hooks/useActivityLog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FocusContextCard } from "@/components/study/FocusContextCard";
import { CalmFocusTimer } from "@/components/study/CalmFocusTimer";
import { StudyTimeline } from "@/components/study/StudyTimeline";
import { LibraryGrid, LibraryItem } from "@/components/study/LibraryGrid";
import { BookReader } from "@/components/study/BookReader";
import { AddBookDialog } from "@/components/study/AddBookDialog";
import { EditBookDialog } from "@/components/study/EditBookDialog";
import { StudyGoals } from "@/components/study/StudyGoals";
import { VocabularyScreen } from "@/components/study/VocabularyScreen";
import { StudyAnalytics } from "@/components/study/StudyAnalytics";
import { StudyLeaderboard } from "@/components/study/StudyLeaderboard";
import { SpacedRepetitionReminders } from "@/components/study/SpacedRepetitionReminders";
import { SyllabusAIParser } from "@/components/study/SyllabusAIParser";
import { StudySubjectManager } from "@/components/study/StudySubjectManager";
import { StudyTodosWidget } from "@/components/study/StudyTodosWidget";
import { StudyTemplatesLibrary } from "@/components/study/templates/StudyTemplatesLibrary";
import { GenericExamWorkspace, StudyWorkspaceBreadcrumb } from "@/components/study/workspaces";
import { OPSCExamDashboard } from "@/components/exam/opsc/OPSCExamDashboard";
import TemplatesGallery from "@/components/study/TemplatesGallery";
import { Clock, BookOpen, Target, Archive, BookMarked, BarChart3, CheckSquare, Trophy, Brain, LayoutTemplate, Layout } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { StudyOnboardingFlow, StudyGuidedTour } from "@/components/study/onboarding";
import { useStudyOnboarding, STUDY_TEMPLATES } from "@/hooks/useStudyOnboarding";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Template metadata for workspace configuration
const TEMPLATE_CONFIG: Record<string, {
  subjects: string[];
  hasCustomWorkspace?: boolean;
}> = {
  "opsc-oas-2026": {
    subjects: ["Indian Polity", "History", "Geography", "Economy", "Odisha GK", "Ethics", "Science", "Current Affairs"],
    hasCustomWorkspace: true,
  },
  "opsc-ofs-2026": {
    subjects: ["Indian Polity", "History", "Geography", "Economy", "Odisha GK", "Ethics", "Forestry", "Current Affairs"],
    hasCustomWorkspace: true,
  },
  "upsc-prelims-2026": {
    subjects: ["Indian Polity", "History", "Geography", "Economy", "Environment", "Science & Tech", "Current Affairs", "CSAT"],
  },
  "upsc-mains-2026": {
    subjects: ["Essay", "GS I", "GS II", "GS III", "GS IV", "Optional Paper I", "Optional Paper II", "English", "Hindi"],
  },
  "ssc-cgl-2026": {
    subjects: ["Quantitative Aptitude", "English", "General Intelligence", "General Awareness"],
  },
  "go-backend-master": {
    subjects: ["Go Fundamentals", "Concurrency", "Web Frameworks", "Database", "Testing", "Microservices", "gRPC", "Docker", "Kubernetes", "CI/CD", "Monitoring", "Best Practices"],
  },
  "java-backend-master": {
    subjects: ["Core Java", "Spring Boot", "Spring Security", "JPA/Hibernate", "Microservices", "REST APIs", "Testing", "Docker", "Kubernetes", "Kafka", "CI/CD", "Performance", "Design Patterns", "System Design", "Interview Prep"],
  },
  "kubernetes-architect": {
    subjects: ["K8s Fundamentals", "Pods & Workloads", "Services & Networking", "Storage", "Security", "Helm", "Operators", "Production"],
  },
  "aws-solutions-architect": {
    subjects: ["Compute", "Storage", "Database", "Networking", "Security", "IAM", "Serverless", "Containers", "CDN", "Migration", "Cost Optimization", "High Availability", "Disaster Recovery", "Best Practices"],
  },
  "azure-architect": {
    subjects: ["Compute", "Storage", "Database", "Networking", "Security", "Identity", "Serverless", "Containers", "DevOps", "Monitoring", "Cost Management", "Governance"],
  },
  "ml-engineer": {
    subjects: ["Mathematics", "Python", "Data Processing", "Classical ML", "Deep Learning", "NLP", "Computer Vision", "MLOps", "Deployment", "Ethics"],
  },
  "rag-agentic-ai": {
    subjects: ["LLM Fundamentals", "Vector Databases", "RAG Architecture", "Agents", "Tool Use", "Evaluation"],
  },
  "nextjs-fullstack": {
    subjects: ["React Fundamentals", "Next.js Basics", "App Router", "Server Components", "Data Fetching", "Authentication", "Database", "Deployment"],
  },
  "docker-mastery": {
    subjects: ["Docker Basics", "Images", "Containers", "Networking", "Volumes"],
  },
  "kafka-streaming": {
    subjects: ["Kafka Basics", "Producers", "Consumers", "Streams", "Connect", "Schema Registry", "Monitoring"],
  },
  "gmat-full-prep": {
    subjects: ["Quantitative", "Verbal", "Integrated Reasoning", "Analytical Writing"],
  },
  "gre-complete": {
    subjects: ["Quantitative Reasoning", "Verbal Reasoning", "Analytical Writing"],
  },
  "ielts-academic": {
    subjects: ["Listening", "Reading", "Writing", "Speaking"],
  },
  "toefl-ibt": {
    subjects: ["Reading", "Listening", "Speaking", "Writing"],
  },
  "cat-mba-prep": {
    subjects: ["Quantitative Aptitude", "Verbal Ability", "Data Interpretation", "Logical Reasoning"],
  },
};

// Workspace navigation component
const WorkspaceNavigation = ({ 
  activeTemplate, 
  onBack 
}: { 
  activeTemplate: string;
  onBack: () => void;
}) => {
  const templateLabel = STUDY_TEMPLATES.find(t => t.id === activeTemplate)?.label || activeTemplate;
  
  return (
    <StudyWorkspaceBreadcrumb
      templateId={activeTemplate}
      templateLabel={templateLabel}
      onBack={onBack}
    />
  );
};

const Study = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logActivity } = useActivityLog();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Tab and view state
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "gallery");
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [showTemplatesLibrary, setShowTemplatesLibrary] = useState(false);
  
  // Reader states
  const [selectedBook, setSelectedBook] = useState<LibraryItem | null>(null);
  const [editingBook, setEditingBook] = useState<LibraryItem | null>(null);
  const [showAddBook, setShowAddBook] = useState(false);
  
  // Onboarding states
  const { 
    showOnboarding, 
    hasCompletedOnboarding, 
    completeOnboarding 
  } = useStudyOnboarding();
  const [showGuidedTour, setShowGuidedTour] = useState(false);
  
  // Delete confirmation
  const [bookToDelete, setBookToDelete] = useState<LibraryItem | null>(null);

  // Fetch library items
  const { data: libraryItems = [], isLoading: libraryLoading, refetch: refetchLibrary } = useQuery({
    queryKey: ["library-items", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("library_items")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LibraryItem[];
    },
    enabled: !!user,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("library_items")
        .delete()
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library-items"] });
      toast({
        title: "Item deleted",
        description: "The item has been removed from your library.",
      });
      setBookToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Stats
  const stats = useMemo(() => {
    const books = libraryItems.filter(item => item.item_type === "epub" || item.item_type === "pdf");
    const notes = libraryItems.filter(item => item.item_type === "note");
    const archived = libraryItems.filter(item => item.is_archived);
    return { books: books.length, notes: notes.length, archived: archived.length };
  }, [libraryItems]);

  // Handlers
  const handleOpenBook = (item: LibraryItem) => {
    setSelectedBook(item);
    logActivity?.("library", `Opened "${item.title}"`);
  };

  const handleCloseReader = () => {
    setSelectedBook(null);
  };

  const handleBookAdded = () => {
    setShowAddBook(false);
    refetchLibrary();
    toast({
      title: "Book added",
      description: "Your book has been added to the library.",
    });
  };

  const handleBookEdited = () => {
    setEditingBook(null);
    refetchLibrary();
    toast({
      title: "Book updated",
      description: "Your book has been updated successfully.",
    });
  };

  const handleDeleteBook = (item: LibraryItem) => {
    setBookToDelete(item);
  };

  const handleToggleArchive = async (item: LibraryItem) => {
    const { error } = await supabase
      .from("library_items")
      .update({ is_archived: !item.is_archived })
      .eq("id", item.id);
    
    if (!error) {
      refetchLibrary();
      toast({
        title: item.is_archived ? "Unarchived" : "Archived",
        description: `"${item.title}" has been ${item.is_archived ? "restored" : "archived"}.`,
      });
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setActiveTemplate(templateId);
    logActivity?.("study", `Started ${templateId} template`);
  };

  const handleBackToDashboard = () => {
    setActiveTemplate(null);
  };

  const handleOnboardingComplete = (selectedTemplate: string | null) => {
    completeOnboarding();
    if (selectedTemplate) {
      setActiveTemplate(selectedTemplate);
    }
    setShowGuidedTour(true);
  };

  // Update URL when tab changes
  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);

  // Render template workspace if a template is active
  if (activeTemplate) {
    const config = TEMPLATE_CONFIG[activeTemplate];
    const templateInfo = STUDY_TEMPLATES.find(t => t.id === activeTemplate);
    
    // Use OPSC dashboard for OPSC templates
    if (config?.hasCustomWorkspace && activeTemplate.startsWith("opsc")) {
      return (
        <div className="w-full">
          <WorkspaceNavigation activeTemplate={activeTemplate} onBack={handleBackToDashboard} />
          <OPSCExamDashboard 
            examType={activeTemplate === "opsc-oas-2026" ? "OAS" : "OFS"}
            onBack={handleBackToDashboard}
          />
        </div>
      );
    }
    
    // Use generic workspace for other templates
    return (
      <div className="w-full">
        <WorkspaceNavigation activeTemplate={activeTemplate} onBack={handleBackToDashboard} />
        <GenericExamWorkspace
          templateId={activeTemplate}
          templateName={templateInfo?.label || activeTemplate}
          subjects={config?.subjects || ["General"]}
          onBack={handleBackToDashboard}
        />
      </div>
    );
  }

  // Show onboarding if needed
  if (showOnboarding && !hasCompletedOnboarding) {
    return (
      <div className="w-full">
        <StudyOnboardingFlow 
          onComplete={handleOnboardingComplete}
          onSkip={() => completeOnboarding()}
        />
      </div>
    );
  }

  // Show book reader if a book is selected
  if (selectedBook) {
    return (
      <BookReader 
        item={selectedBook} 
        onClose={handleCloseReader} 
      />
    );
  }

  // Show templates library modal
  if (showTemplatesLibrary) {
    return (
      <div className="w-full">
        <StudyTemplatesLibrary
          onSelect={(templateId) => {
            setShowTemplatesLibrary(false);
            handleTemplateSelect(templateId);
          }}
          onClose={() => setShowTemplatesLibrary(false)}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Top Header with Templates Gallery Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Study</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Your personal learning workspace
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "gallery" ? "default" : "outline"}
            onClick={() => setActiveTab("gallery")}
            className="gap-2"
          >
            <Layout className="w-4 h-4" />
            Templates Gallery
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowTemplatesLibrary(true)}
            className="gap-2"
          >
            <LayoutTemplate className="w-4 h-4" />
            My Templates
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 gap-1 bg-muted/50 p-1">
            <TabsTrigger value="gallery" className="data-[state=active]:bg-card gap-2">
              <Layout className="w-4 h-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="timetable" className="data-[state=active]:bg-card gap-2">
              <CheckSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Study Timetable</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-card gap-2">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Reviews</span>
            </TabsTrigger>
            <TabsTrigger value="focus" className="data-[state=active]:bg-card gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Focus</span>
            </TabsTrigger>
            <TabsTrigger value="library" className="data-[state=active]:bg-card gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Library</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="data-[state=active]:bg-card gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Goals</span>
            </TabsTrigger>
            <TabsTrigger value="vocabulary" className="data-[state=active]:bg-card gap-2">
              <BookMarked className="w-4 h-4" />
              <span className="hidden sm:inline">Vocabulary</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-card gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-card gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Leaderboard</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Templates Gallery Tab */}
        <TabsContent value="gallery" className="mt-6">
          <TemplatesGallery />
        </TabsContent>

        {/* Study Timetable Tab */}
        <TabsContent value="timetable" className="mt-6">
          <div className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2 space-y-6">
              <StudyTimeline />
              <StudySubjectManager />
            </div>
            <div className="space-y-6">
              <StudyTodosWidget />
              <SyllabusAIParser />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <SpacedRepetitionReminders />
        </TabsContent>

        <TabsContent value="focus" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <CalmFocusTimer />
            <FocusContextCard />
          </div>
        </TabsContent>

        <TabsContent value="library" className="mt-6">
          <LibraryGrid
            items={libraryItems}
            isLoading={libraryLoading}
            onOpenBook={handleOpenBook}
            onEditBook={setEditingBook}
            onDeleteBook={handleDeleteBook}
            onToggleArchive={handleToggleArchive}
            onAddBook={() => setShowAddBook(true)}
          />
        </TabsContent>

        <TabsContent value="goals" className="mt-6">
          <StudyGoals />
        </TabsContent>

        <TabsContent value="vocabulary" className="mt-6">
          <VocabularyScreen />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <StudyAnalytics />
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-6">
          <StudyLeaderboard />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddBookDialog
        open={showAddBook}
        onOpenChange={setShowAddBook}
        onSuccess={handleBookAdded}
      />

      {editingBook && (
        <EditBookDialog
          open={!!editingBook}
          onOpenChange={(open) => !open && setEditingBook(null)}
          book={editingBook}
          onSuccess={handleBookEdited}
        />
      )}

      <AlertDialog open={!!bookToDelete} onOpenChange={(open) => !open && setBookToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{bookToDelete?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this item from your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bookToDelete && deleteMutation.mutate(bookToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Guided Tour */}
      {showGuidedTour && (
        <StudyGuidedTour onComplete={() => setShowGuidedTour(false)} />
      )}
    </div>
  );
};

export default Study;
