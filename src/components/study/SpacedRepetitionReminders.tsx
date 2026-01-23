import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { format, formatDistanceToNow, isToday, isBefore, addDays, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Bell,
  BellRing,
  Clock,
  Brain,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ReviewTopic {
  id: string;
  subject: string;
  chapter_name: string;
  topic_name: string;
  next_review_date: string | null;
  review_count: number;
  ease_factor: number;
  interval_days: number;
  completed_at: string | null;
  is_completed: boolean;
}

// SM-2 Algorithm for calculating next review
const calculateNextReview = (
  currentInterval: number,
  easeFactor: number,
  quality: number // 0-5 scale
): { interval: number; easeFactor: number } => {
  let newInterval = currentInterval;
  let newEaseFactor = easeFactor;

  if (quality >= 3) {
    if (currentInterval === 0) {
      newInterval = 1;
    } else if (currentInterval === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * newEaseFactor);
    }
  } else {
    newInterval = 1; // Reset to 1 day if failed
  }

  // Update ease factor
  newEaseFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  return { interval: newInterval, easeFactor: newEaseFactor };
};

export const SpacedRepetitionReminders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch topics with review data
  const { data: topics = [], isLoading } = useQuery({
    queryKey: ["review-topics", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("syllabus_topics")
        .select("*")
        .eq("is_completed", true)
        .order("next_review_date", { ascending: true, nullsFirst: true });
      if (error) throw error;
      return data as ReviewTopic[];
    },
    enabled: !!user,
  });

  // Categorize topics by review status
  const categorizedTopics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdue: ReviewTopic[] = [];
    const dueToday: ReviewTopic[] = [];
    const upcoming: ReviewTopic[] = [];
    const newlyCompleted: ReviewTopic[] = [];

    topics.forEach(topic => {
      if (!topic.next_review_date) {
        // Never reviewed - schedule first review
        newlyCompleted.push(topic);
      } else {
        const reviewDate = new Date(topic.next_review_date);
        reviewDate.setHours(0, 0, 0, 0);
        
        if (isBefore(reviewDate, today)) {
          overdue.push(topic);
        } else if (isToday(reviewDate)) {
          dueToday.push(topic);
        } else if (differenceInDays(reviewDate, today) <= 7) {
          upcoming.push(topic);
        }
      }
    });

    return { overdue, dueToday, upcoming, newlyCompleted };
  }, [topics]);

  // Record review mutation
  const recordReviewMutation = useMutation({
    mutationFn: async ({ topicId, quality }: { topicId: string; quality: number }) => {
      const topic = topics.find(t => t.id === topicId);
      if (!topic) throw new Error("Topic not found");

      const currentInterval = topic.interval_days || 0;
      const currentEaseFactor = topic.ease_factor || 2.5;
      
      const { interval, easeFactor } = calculateNextReview(currentInterval, currentEaseFactor, quality);
      const nextReviewDate = addDays(new Date(), interval);

      const { error } = await supabase
        .from("syllabus_topics")
        .update({
          interval_days: interval,
          ease_factor: easeFactor,
          review_count: (topic.review_count || 0) + 1,
          next_review_date: format(nextReviewDate, "yyyy-MM-dd"),
        })
        .eq("id", topicId);

      if (error) throw error;
      return { interval, quality };
    },
    onSuccess: ({ interval, quality }) => {
      queryClient.invalidateQueries({ queryKey: ["review-topics"] });
      const message = quality >= 3 
        ? `Review recorded! Next review in ${interval} days 🎯`
        : "Topic reset for review tomorrow. Keep practicing! 💪";
      toast.success(message);
    },
    onError: () => {
      toast.error("Failed to record review");
    },
  });

  // Schedule initial review for newly completed topics
  const scheduleInitialReview = useMutation({
    mutationFn: async (topicId: string) => {
      const nextReviewDate = addDays(new Date(), 1); // First review tomorrow
      const { error } = await supabase
        .from("syllabus_topics")
        .update({
          interval_days: 1,
          ease_factor: 2.5,
          review_count: 0,
          next_review_date: format(nextReviewDate, "yyyy-MM-dd"),
        })
        .eq("id", topicId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-topics"] });
      toast.success("Review scheduled for tomorrow!");
    },
  });

  const totalDue = categorizedTopics.overdue.length + categorizedTopics.dueToday.length;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-muted rounded-xl" />
        <div className="h-40 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className={cn(
        "p-4 rounded-xl border transition-all",
        totalDue > 0 
          ? "bg-gradient-to-br from-amber-500/10 to-rose-500/5 border-amber-500/20" 
          : "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-xl",
            totalDue > 0 ? "bg-amber-500/20" : "bg-emerald-500/20"
          )}>
            {totalDue > 0 ? (
              <BellRing className="w-6 h-6 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">
              {totalDue > 0 ? `${totalDue} topics need review` : "All caught up!"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {totalDue > 0 
                ? "Complete reviews to reinforce your learning"
                : "Great job keeping up with your reviews"}
            </p>
          </div>
          {totalDue > 0 && (
            <Badge variant="secondary" className="text-amber-600 bg-amber-500/10">
              {categorizedTopics.overdue.length} overdue
            </Badge>
          )}
        </div>
      </div>

      {/* Newly Completed Topics */}
      {categorizedTopics.newlyCompleted.length > 0 && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-medium">New Completions</span>
              <Badge variant="secondary">{categorizedTopics.newlyCompleted.length}</Badge>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-2 mt-2">
              {categorizedTopics.newlyCompleted.slice(0, 5).map(topic => (
                <div key={topic.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{topic.topic_name}</p>
                    <p className="text-xs text-muted-foreground">{topic.subject} • {topic.chapter_name}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => scheduleInitialReview.mutate(topic.id)}
                    className="gap-1"
                  >
                    <Bell className="w-3 h-3" />
                    Schedule
                  </Button>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Overdue Reviews */}
      {categorizedTopics.overdue.length > 0 && (
        <ReviewSection
          title="Overdue"
          icon={<AlertTriangle className="w-4 h-4 text-rose-500" />}
          topics={categorizedTopics.overdue}
          variant="overdue"
          onReview={(id, quality) => recordReviewMutation.mutate({ topicId: id, quality })}
          isReviewing={recordReviewMutation.isPending}
        />
      )}

      {/* Due Today */}
      {categorizedTopics.dueToday.length > 0 && (
        <ReviewSection
          title="Due Today"
          icon={<Clock className="w-4 h-4 text-amber-500" />}
          topics={categorizedTopics.dueToday}
          variant="today"
          onReview={(id, quality) => recordReviewMutation.mutate({ topicId: id, quality })}
          isReviewing={recordReviewMutation.isPending}
        />
      )}

      {/* Upcoming */}
      {categorizedTopics.upcoming.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-500" />
              <span className="font-medium">Upcoming Reviews</span>
              <Badge variant="secondary">{categorizedTopics.upcoming.length}</Badge>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-2 mt-2">
              {categorizedTopics.upcoming.map(topic => (
                <div key={topic.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{topic.topic_name}</p>
                    <p className="text-xs text-muted-foreground">{topic.subject}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {topic.next_review_date && formatDistanceToNow(new Date(topic.next_review_date), { addSuffix: true })}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Review #{(topic.review_count || 0) + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Empty State */}
      {topics.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <Brain className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Complete topics to start spaced repetition</p>
          <p className="text-xs text-muted-foreground mt-1">Reviews help you remember what you've learned</p>
        </div>
      )}
    </div>
  );
};

// Review Section Component
const ReviewSection = ({
  title,
  icon,
  topics,
  variant,
  onReview,
  isReviewing,
}: {
  title: string;
  icon: React.ReactNode;
  topics: ReviewTopic[];
  variant: "overdue" | "today";
  onReview: (id: string, quality: number) => void;
  isReviewing: boolean;
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="font-medium text-foreground">{title}</h4>
        <Badge variant={variant === "overdue" ? "destructive" : "secondary"}>
          {topics.length}
        </Badge>
      </div>
      
      <div className="space-y-2">
        {topics.map(topic => (
          <div
            key={topic.id}
            className={cn(
              "p-4 rounded-xl border transition-all",
              variant === "overdue" 
                ? "bg-rose-500/5 border-rose-500/20" 
                : "bg-amber-500/5 border-amber-500/20"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{topic.topic_name}</p>
                <p className="text-sm text-muted-foreground">{topic.subject} • {topic.chapter_name}</p>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {topic.review_count || 0} reviews
                  </Badge>
                  {topic.next_review_date && (
                    <span className="text-xs text-muted-foreground">
                      Due {formatDistanceToNow(new Date(topic.next_review_date), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Review Quality Buttons */}
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReview(topic.id, 1)}
                disabled={isReviewing}
                className="flex-1 text-rose-500 hover:text-rose-600"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Again
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReview(topic.id, 3)}
                disabled={isReviewing}
                className="flex-1"
              >
                Hard
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReview(topic.id, 4)}
                disabled={isReviewing}
                className="flex-1 text-emerald-500 hover:text-emerald-600"
              >
                Good
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={() => onReview(topic.id, 5)}
                disabled={isReviewing}
                className="flex-1"
              >
                Easy
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
