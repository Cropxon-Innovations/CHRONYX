import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen, 
  Clock, 
  Brain,
  FileText,
  TrendingUp,
  Calendar,
  BarChart3,
  Sparkles,
  Lock
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { format, startOfWeek, startOfMonth, subDays, differenceInMinutes } from "date-fns";
import { cn } from "@/lib/utils";

export const StudyAnalytics = () => {
  const { user } = useAuth();
  const { isPro } = useSubscription();

  // Fetch study logs
  const { data: studyLogs = [] } = useQuery({
    queryKey: ['study-analytics-logs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('study_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', format(subDays(new Date(), 30), 'yyyy-MM-dd'))
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch library items with progress
  const { data: libraryItems = [] } = useQuery({
    queryKey: ['study-analytics-library', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('library_items')
        .select('*, reading_state(*)')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch vocabulary count
  const { data: vocabCount = 0 } = useQuery({
    queryKey: ['study-analytics-vocab', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('vocabulary')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Fetch explanations count
  const { data: explanationsCount = 0 } = useQuery({
    queryKey: ['study-analytics-explanations', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('study_explanations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id && isPro(),
  });

  // Fetch notes count
  const { data: notesCount = 0 } = useQuery({
    queryKey: ['study-analytics-notes', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('type', 'study_note');
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Calculate metrics
  const today = new Date();
  const weekStart = startOfWeek(today);
  const monthStart = startOfMonth(today);

  const weeklyMinutes = studyLogs
    .filter(log => new Date(log.date) >= weekStart)
    .reduce((acc, log) => acc + log.duration, 0);

  const monthlyMinutes = studyLogs
    .filter(log => new Date(log.date) >= monthStart)
    .reduce((acc, log) => acc + log.duration, 0);

  const booksInProgress = libraryItems.filter((item: any) => {
    const progress = item.reading_state?.[0]?.progress_percent || 0;
    return progress > 0 && progress < 100;
  });

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Study Analytics
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your learning journey at a glance
        </p>
      </div>

      {/* Time Investment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Time Investment
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">{formatDuration(weeklyMinutes)}</p>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">{formatDuration(monthlyMinutes)}</p>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </div>
        </CardContent>
      </Card>

      {/* Reading Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Books in Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {booksInProgress.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No books in progress. Start reading!
            </p>
          ) : (
            <div className="space-y-3">
              {booksInProgress.slice(0, 5).map((item: any) => {
                const progress = item.reading_state?.[0]?.progress_percent || 0;
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{progress}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Understanding Depth (Pro) */}
      <Card className={cn(!isPro() && "opacity-75")}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            Understanding Depth
            {!isPro() && (
              <Badge variant="secondary" className="ml-auto text-xs">
                <Lock className="w-3 h-3 mr-1" />
                Pro
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isPro() ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xl font-bold text-primary">{explanationsCount}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Concepts explained</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xl font-bold text-primary">{notesCount}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Notes written</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xl font-bold text-primary">{vocabCount}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Words learned</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">
                Unlock deep insights about your learning
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="/pricing">See Pro Features</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vocabulary Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Vocabulary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary">{vocabCount}</p>
              <p className="text-xs text-muted-foreground">words learned</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/app/study?tab=vocabulary">Review</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
