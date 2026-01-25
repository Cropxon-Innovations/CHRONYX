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
    subjects: ["Quantitative", "Verbal", "Analytical Writing"],
  },
  "ielts-academic": {
    subjects: ["Listening", "Reading", "Writing", "Speaking"],
  },
  "toefl-ibt": {
    subjects: ["Listening", "Reading", "Writing", "Speaking"],
  },
};

interface UserTemplate {
  id: string;
  template_id: string;
  template_name: string;
  template_category: string;
  template_subcategory: string | null;
  template_level: string;
  template_year: number | null;
  template_icon: string;
  total_subjects: number;
  total_topics: number;
  is_active: boolean;
  progress_percent: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

const subjects = ["Mathematics", "Programming", "Philosophy", "Language", "Science", "History", "Literature", "Art", "Music", "Other"];

const Study = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logActivity } = useActivityLog();
  const [searchParams] = useSearchParams();
  
  // Study onboarding
  const { 
    showOnboarding, 
    showTour, 
    isLoading: onboardingLoading,
    completeOnboarding,
    completeTour 
  } = useStudyOnboarding();
  
  const initialTab = searchParams.get('tab') || "progress";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showTimer, setShowTimer] = useState(false);
  const [showAddBook, setShowAddBook] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [readingItem, setReadingItem] = useState<LibraryItem | null>(null);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<LibraryItem | null>(null);
  const [activeUserTemplate, setActiveUserTemplate] = useState<UserTemplate | null>(null);
  const [showWorkspace, setShowWorkspace] = useState(false);

  // Scroll to top when workspace opens
  useEffect(() => {
    if (showWorkspace) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showWorkspace]);

  // Fetch user's active templates
  const { data: userTemplates = [] } = useQuery({
    queryKey: ["user-study-templates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_study_templates")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as UserTemplate[];
    },
    enabled: !!user,
  });

  // Fetch study logs
  const { data: studyLogs = [], isLoading } = useQuery({
    queryKey: ["study-logs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_logs")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch library items
  const { data: libraryItems = [], isLoading: libraryLoading } = useQuery({
    queryKey: ["library-items", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("library_items")
        .select("*, reading_state(*)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data.map((item: any) => ({
        ...item,
        current_page: item.reading_state?.[0]?.last_page || 1,
        progress_percent: item.reading_state?.[0]?.progress_percent || 0,
      })) as LibraryItem[];
    },
    enabled: !!user,
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const todayMinutes = studyLogs
      .filter(log => log.date === today)
      .reduce((acc, log) => acc + log.duration, 0);
    return { todayMinutes };
  }, [studyLogs]);

  // Current reading item
  const currentReading = useMemo(() => {
    const recent = libraryItems.find(item => 
      item.progress_percent && item.progress_percent > 0 && item.progress_percent < 100
    );
    if (recent) {
      return {
        id: recent.id,
        title: recent.title,
        author: recent.author,
        type: "book" as const,
        currentPage: recent.current_page,
        totalPages: recent.total_pages,
      };
    }
    return null;
  }, [libraryItems]);

  // Add study log mutation
  const addLogMutation = useMutation({
    mutationFn: async (params: { duration: number; subject: string }) => {
      const { error } = await supabase.from("study_logs").insert({
        user_id: user!.id,
        subject: params.subject,
        duration: params.duration,
        date: format(new Date(), "yyyy-MM-dd"),
        focus_level: "medium",
        is_timer_session: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-logs"] });
      toast({ title: "Study session logged" });
    },
  });

  // Upload book mutation
  const uploadBookMutation = useMutation({
    mutationFn: async (data: { file: File; title: string; author: string; cover?: File; totalPages?: number }) => {
      const fileExt = data.file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const timestamp = Date.now();
      const filePath = `${user!.id}/${timestamp}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("library")
        .upload(filePath, data.file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("library")
        .getPublicUrl(filePath);

      let coverUrl: string | null = null;
      if (data.cover) {
        const coverPath = `${user!.id}/covers/${timestamp}.jpg`;
        const { error: coverError } = await supabase.storage
          .from("library")
          .upload(coverPath, data.cover);
        
        if (!coverError) {
          const { data: { publicUrl: coverPublicUrl } } = supabase.storage
            .from("library")
            .getPublicUrl(coverPath);
          coverUrl = coverPublicUrl;
        }
      }

      let format: string = 'pdf';
      if (['epub'].includes(fileExt)) format = 'epub';
      else if (['doc', 'docx'].includes(fileExt)) format = fileExt;
      else if (['ppt', 'pptx'].includes(fileExt)) format = fileExt;
      else if (['xls', 'xlsx'].includes(fileExt)) format = fileExt;
      else if (['txt', 'rtf'].includes(fileExt)) format = 'txt';

      const { error } = await supabase.from("library_items").insert({
        user_id: user!.id,
        title: data.title,
        author: data.author,
        format,
        file_url: publicUrl,
        cover_url: coverUrl,
        total_pages: data.totalPages || null,
        file_size: data.file.size,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library-items"] });
      toast({ title: "Added to library" });
      setShowAddBook(false);
    },
    onError: () => {
      toast({ title: "Failed to upload", variant: "destructive" });
    },
  });

  // Edit book mutation
  const editBookMutation = useMutation({
    mutationFn: async (data: { 
      id: string; 
      title: string; 
      author: string; 
      totalPages?: number; 
      notes?: string; 
      tags?: string[];
      coverFile?: File;
      coverUrl?: string;
    }) => {
      const updateData: any = {
        title: data.title,
        author: data.author,
        total_pages: data.totalPages || null,
        notes: data.notes || null,
        tags: data.tags || null,
        updated_at: new Date().toISOString(),
      };
      
      if (data.coverUrl) {
        updateData.cover_url = data.coverUrl;
      }
      
      const { error } = await supabase.from("library_items").update(updateData).eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library-items"] });
      toast({ title: "Changes saved" });
      setEditingItem(null);
    },
    onError: () => {
      toast({ title: "Failed to save", variant: "destructive" });
    },
  });

  // Delete book mutation
  const deleteBookMutation = useMutation({
    mutationFn: async (item: LibraryItem) => {
      if (item.file_url) {
        const pathMatch = item.file_url.match(/library\/(.+)$/);
        if (pathMatch) {
          await supabase.storage.from("library").remove([pathMatch[1]]);
        }
      }
      const { error } = await supabase.from("library_items").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library-items"] });
      toast({ title: "Deleted from library" });
      setDeletingItem(null);
    },
    onError: () => {
      toast({ title: "Failed to delete", variant: "destructive" });
    },
  });

  // Archive/Restore mutation
  const toggleArchiveMutation = useMutation({
    mutationFn: async (item: LibraryItem) => {
      const { error } = await supabase.from("library_items").update({
        is_shared: !item.is_archived,
        updated_at: new Date().toISOString(),
      }).eq("id", item.id);
      if (error) throw error;
      return !item.is_archived;
    },
    onSuccess: (wasArchived) => {
      queryClient.invalidateQueries({ queryKey: ["library-items"] });
      toast({ title: wasArchived ? "Archived" : "Restored" });
    },
  });

  // Lock/Unlock mutation
  const toggleLockMutation = useMutation({
    mutationFn: async (item: LibraryItem) => {
      const { error } = await supabase.from("library_items").update({
        is_locked: !item.is_locked,
        updated_at: new Date().toISOString(),
      }).eq("id", item.id);
      if (error) throw error;
      return !item.is_locked;
    },
    onSuccess: (isNowLocked) => {
      queryClient.invalidateQueries({ queryKey: ["library-items"] });
      toast({ title: isNowLocked ? "Locked" : "Unlocked" });
    },
  });

  const handleDownload = (item: LibraryItem) => {
    if (item.file_url) {
      const link = document.createElement('a');
      link.href = item.file_url;
      link.download = item.title || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = (item: LibraryItem) => {
    if (item.file_url) {
      navigator.clipboard.writeText(item.file_url);
      toast({ title: "Link copied to clipboard" });
    }
  };

  const handleTimerComplete = (duration: number, subject: string) => {
    addLogMutation.mutate({ duration, subject });
    setShowTimer(false);
  };

  const handleBackFromWorkspace = () => {
    setShowWorkspace(false);
    setActiveUserTemplate(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Show onboarding for new users
  if (showOnboarding && !onboardingLoading) {
    return <StudyOnboardingFlow onComplete={completeOnboarding} />;
  }

  // Reading view
  if (readingItem) {
    return (
      <BookReader
        item={readingItem}
        fileUrl=""
        onClose={() => setReadingItem(null)}
        onProgressUpdate={(page, progress) => {}}
      />
    );
  }

  // Dedicated workspace view - clean full page with breadcrumb
  if (showWorkspace && activeUserTemplate) {
    const templateConfig = TEMPLATE_CONFIG[activeUserTemplate.template_id];
    const templateMeta = STUDY_TEMPLATES.find(t => t.id === activeUserTemplate.template_id);
    
    // Check for custom workspaces (OPSC)
    if (templateConfig?.hasCustomWorkspace && (activeUserTemplate.template_id === "opsc-oas-2026" || activeUserTemplate.template_id === "opsc-ofs-2026")) {
      return (
        <div className="animate-fade-in">
          <StudyWorkspaceBreadcrumb 
            templateName={activeUserTemplate.template_name}
            templateIcon={activeUserTemplate.template_icon}
            onBack={handleBackFromWorkspace}
          />
          <OPSCExamDashboard />
        </div>
      );
    }
    
    // Generic workspace for all other templates
    return (
      <div className="animate-fade-in">
        <StudyWorkspaceBreadcrumb 
          templateName={activeUserTemplate.template_name}
          templateIcon={activeUserTemplate.template_icon}
          onBack={handleBackFromWorkspace}
        />
        <GenericExamWorkspace
          templateId={activeUserTemplate.template_id}
          templateName={activeUserTemplate.template_name}
          templateIcon={activeUserTemplate.template_icon}
          templateCategory={activeUserTemplate.template_category}
          templateSubcategory={activeUserTemplate.template_subcategory || "General"}
          examYear={activeUserTemplate.template_year || 2026}
          subjects={templateConfig?.subjects || ["General Topics"]}
          totalTopics={activeUserTemplate.total_topics}
          description={templateMeta?.description}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in w-full">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-light text-foreground tracking-wide">Study</h1>
          <p className="text-sm text-muted-foreground mt-1">
            A quiet record of time and attention
          </p>
        </div>
      </header>

      {/* Focus Context Card */}
      <FocusContextCard
        currentItem={currentReading}
        onContinue={() => {
          const item = libraryItems.find(i => i.id === currentReading?.id);
          if (item) setReadingItem(item);
        }}
        onStartSession={() => setShowTimer(true)}
      />

      {/* Today's summary */}
      {metrics.todayMinutes > 0 && (
        <p className="text-sm text-muted-foreground">
          {metrics.todayMinutes} minutes studied today
        </p>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/30 border border-border p-1 h-auto flex-wrap w-full sm:w-auto">
          <TabsTrigger value="progress" className="data-[state=active]:bg-card gap-2">
            <CheckSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Study Timetable</span>
          </TabsTrigger>
          <TabsTrigger value="gallery" className="data-[state=active]:bg-card gap-2">
            <Layout className="w-4 h-4" />
            <span className="hidden sm:inline">Templates Gallery</span>
          </TabsTrigger>
          <TabsTrigger value="reviews" className="data-[state=active]:bg-card gap-2">
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">Reviews</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="data-[state=active]:bg-card gap-2">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Leaderboard</span>
          </TabsTrigger>
          <TabsTrigger value="library" className="data-[state=active]:bg-card gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Library</span>
          </TabsTrigger>
          <TabsTrigger value="vocabulary" className="data-[state=active]:bg-card gap-2">
            <BookMarked className="w-4 h-4" />
            <span className="hidden sm:inline">Vocabulary</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-card gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <StudyTimeline sessions={studyLogs} />
        </TabsContent>

        <TabsContent value="progress">
          <div className="space-y-6">
            {activeUserTemplate && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                <span className="text-2xl">{activeUserTemplate.template_icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{activeUserTemplate.template_name}</p>
                  <p className="text-xs text-muted-foreground">{activeUserTemplate.progress_percent.toFixed(0)}% complete</p>
                </div>
              </div>
            )}
            
            <StudyTodosWidget />
            
            <div className="flex gap-2 flex-wrap">
              <SyllabusAIParser onSuccess={() => queryClient.invalidateQueries({ queryKey: ["syllabus-topics"] })} />
            </div>
            
            <StudySubjectManager />
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <StudyTemplatesLibrary 
            onSelectTemplate={(template) => {
              setActiveUserTemplate(template);
              setShowWorkspace(true);
              toast({ title: `Opened ${template.template_name}` });
            }}
            activeTemplateId={activeUserTemplate?.id}
          />
        </TabsContent>

        <TabsContent value="gallery">
          <TemplatesGallery />
        </TabsContent>

        <TabsContent value="reviews">
          <SpacedRepetitionReminders />
        </TabsContent>

        <TabsContent value="leaderboard">
          <StudyLeaderboard />
        </TabsContent>

        <TabsContent value="library">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                variant={showArchived ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
                className="gap-2"
              >
                <Archive className="w-4 h-4" />
                {showArchived ? "Show Active" : "Show Archived"}
              </Button>
            </div>
            <LibraryGrid
              items={libraryItems}
              onItemClick={(item) => setReadingItem(item)}
              onUpload={() => setShowAddBook(true)}
              onEdit={(item) => setEditingItem(item)}
              onDelete={(item) => setDeletingItem(item)}
              onArchive={(item) => toggleArchiveMutation.mutate(item)}
              onLock={(item) => toggleLockMutation.mutate(item)}
              onDownload={handleDownload}
              onShare={handleShare}
              showArchived={showArchived}
              isLoading={libraryLoading}
            />
          </div>
        </TabsContent>

        <TabsContent value="vocabulary">
          <VocabularyScreen />
        </TabsContent>

        <TabsContent value="goals">
          <StudyGoals studyLogs={studyLogs} />
        </TabsContent>

        <TabsContent value="analytics">
          <StudyAnalytics />
        </TabsContent>
      </Tabs>

      {/* Calm Focus Timer */}
      {showTimer && (
        <CalmFocusTimer
          onComplete={handleTimerComplete}
          onClose={() => setShowTimer(false)}
          subjects={subjects}
          isOpen={showTimer}
        />
      )}

      {/* Add Book Dialog */}
      <AddBookDialog
        open={showAddBook}
        onOpenChange={setShowAddBook}
        onUpload={(data) => uploadBookMutation.mutate(data)}
        isUploading={uploadBookMutation.isPending}
      />

      {/* Edit Book Dialog */}
      <EditBookDialog
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        item={editingItem}
        onSave={(data) => editBookMutation.mutate(data)}
        isSaving={editBookMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deletingItem?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this item from your library. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingItem && deleteBookMutation.mutate(deletingItem)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Study;
