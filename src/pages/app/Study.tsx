import { useState, useMemo } from "react";
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
import { StudyGoals } from "@/components/study/StudyGoals";
import { Clock, BookOpen, Target, BarChart3 } from "lucide-react";

const subjects = ["Mathematics", "Programming", "Philosophy", "Language", "Science", "History", "Literature", "Art", "Music", "Other"];

const Study = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logActivity } = useActivityLog();
  
  const [activeTab, setActiveTab] = useState("timeline");
  const [showTimer, setShowTimer] = useState(false);
  const [showAddBook, setShowAddBook] = useState(false);
  const [readingItem, setReadingItem] = useState<LibraryItem | null>(null);

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
    mutationFn: async (data: { file: File; title: string; author: string; totalPages?: number }) => {
      const fileExt = data.file.name.split('.').pop();
      const filePath = `${user!.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("library")
        .upload(filePath, data.file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("library")
        .getPublicUrl(filePath);

      const { error } = await supabase.from("library_items").insert({
        user_id: user!.id,
        title: data.title,
        author: data.author,
        format: fileExt === "epub" ? "epub" : "pdf",
        file_url: publicUrl,
        total_pages: data.totalPages || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library-items"] });
      toast({ title: "Book added to library" });
      setShowAddBook(false);
    },
    onError: () => {
      toast({ title: "Failed to upload", variant: "destructive" });
    },
  });

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
        <TabsList className="bg-muted/30 border border-border p-1 h-auto">
          <TabsTrigger value="timeline" className="data-[state=active]:bg-card gap-2">
            <Clock className="w-4 h-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="library" className="data-[state=active]:bg-card gap-2">
            <BookOpen className="w-4 h-4" />
            Library
          </TabsTrigger>
          <TabsTrigger value="goals" className="data-[state=active]:bg-card gap-2">
            <Target className="w-4 h-4" />
            Goals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <StudyTimeline sessions={studyLogs} />
        </TabsContent>

        <TabsContent value="library">
          <LibraryGrid
            items={libraryItems}
            onItemClick={setReadingItem}
            onUpload={() => setShowAddBook(true)}
            isLoading={libraryLoading}
          />
        </TabsContent>

        <TabsContent value="goals">
          <StudyGoals studyLogs={studyLogs} />
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
    </div>
  );
};

export default Study;
