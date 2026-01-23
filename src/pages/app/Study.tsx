import React, { useState, useMemo } from "react";
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
import { StudyProgressTracker } from "@/components/study/StudyProgressTracker";
import { StudyLeaderboard } from "@/components/study/StudyLeaderboard";
import { SpacedRepetitionReminders } from "@/components/study/SpacedRepetitionReminders";
import { SyllabusAIParser } from "@/components/study/SyllabusAIParser";
import { StudySubjectManager } from "@/components/study/StudySubjectManager";
import { StudyTodosWidget } from "@/components/study/StudyTodosWidget";
import { Clock, BookOpen, Target, Archive, BookMarked, BarChart3, CheckSquare, Trophy, Brain } from "lucide-react";
import { useSearchParams } from "react-router-dom";
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

const subjects = ["Mathematics", "Programming", "Philosophy", "Language", "Science", "History", "Literature", "Art", "Music", "Other"];

const Study = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logActivity } = useActivityLog();
  const [searchParams] = useSearchParams();
  
  const initialTab = searchParams.get('tab') || "progress";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showTimer, setShowTimer] = useState(false);
  const [showAddBook, setShowAddBook] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [readingItem, setReadingItem] = useState<LibraryItem | null>(null);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<LibraryItem | null>(null);

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
      
      // Upload main file
      const { error: uploadError } = await supabase.storage
        .from("library")
        .upload(filePath, data.file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("library")
        .getPublicUrl(filePath);

      // Upload cover image if provided
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

      // Determine format based on extension
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
      
      // Add cover URL if provided (already uploaded in dialog)
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
      // Delete from storage if file_url exists
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
        is_shared: !item.is_archived, // Using is_shared as archive flag since no is_archived column
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

  // Reading view
  if (readingItem) {
    return (
      <BookReader
        item={readingItem}
        fileUrl="" // Would come from library item
        onClose={() => setReadingItem(null)}
        onProgressUpdate={(page, progress) => {
          // Update reading state in database
        }}
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-light text-foreground tracking-wide">Study</h1>
        <p className="text-sm text-muted-foreground mt-1">
          A quiet record of time and attention
        </p>
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

      {/* Today's summary - subtle */}
      {metrics.todayMinutes > 0 && (
        <p className="text-sm text-muted-foreground">
          {metrics.todayMinutes} minutes studied today
        </p>
      )}

      {/* Tabs - Calm, minimal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/30 border border-border p-1 h-auto flex-wrap">
          <TabsTrigger value="progress" className="data-[state=active]:bg-card gap-2">
            <CheckSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Progress</span>
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
            {/* Today's Study Tasks from Todos */}
            <StudyTodosWidget />
            
            <div className="flex gap-2 flex-wrap">
              <SyllabusAIParser onSuccess={() => queryClient.invalidateQueries({ queryKey: ["syllabus-topics"] })} />
            </div>
            
            {/* Hierarchical Subject Manager */}
            <StudySubjectManager />
          </div>
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
