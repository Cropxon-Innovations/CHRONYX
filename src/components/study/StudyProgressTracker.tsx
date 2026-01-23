import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  Clock,
  Trophy,
  Star,
  Flame,
  Target,
  Plus,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Sparkles,
  Medal,
  Zap,
  Share2,
  Upload,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StudyTopic {
  id: string;
  subject: string;
  chapter_name: string;
  topic_name: string;
  is_completed: boolean;
  completed_at: string | null;
  estimated_hours: number;
  time_spent_minutes: number;
  priority: number;
  notes: string | null;
  created_at: string;
  status: string | null;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  earned_at: string | null;
  requirement: number;
  current: number;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: "first_topic", title: "First Step", description: "Complete your first topic", icon: "🎯", points: 10, requirement: 1, current: 0, earned_at: null },
  { id: "five_topics", title: "Getting Started", description: "Complete 5 topics", icon: "📚", points: 25, requirement: 5, current: 0, earned_at: null },
  { id: "ten_topics", title: "Dedicated Learner", description: "Complete 10 topics", icon: "🌟", points: 50, requirement: 10, current: 0, earned_at: null },
  { id: "twenty_five", title: "Knowledge Seeker", description: "Complete 25 topics", icon: "🏆", points: 100, requirement: 25, current: 0, earned_at: null },
  { id: "fifty_topics", title: "Study Master", description: "Complete 50 topics", icon: "👑", points: 200, requirement: 50, current: 0, earned_at: null },
  { id: "streak_3", title: "On Fire", description: "3-day study streak", icon: "🔥", points: 30, requirement: 3, current: 0, earned_at: null },
  { id: "streak_7", title: "Consistent", description: "7-day study streak", icon: "⚡", points: 75, requirement: 7, current: 0, earned_at: null },
  { id: "chapter_complete", title: "Chapter Champion", description: "Complete an entire chapter", icon: "📖", points: 50, requirement: 1, current: 0, earned_at: null },
];

const SUBJECTS = ["Mathematics", "Programming", "Physics", "Chemistry", "Biology", "History", "Literature", "Language", "Other"];

export const StudyProgressTracker = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTopic, setNewTopic] = useState({ subject: "", chapter: "", topic: "", hours: "1" });

  // Fetch syllabus topics
  const { data: topics = [], isLoading } = useQuery({
    queryKey: ["syllabus-topics", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("syllabus_topics")
        .select("*")
        .order("priority", { ascending: true });
      if (error) throw error;
      return data as StudyTopic[];
    },
    enabled: !!user,
  });

  // Group topics by subject and chapter
  const groupedTopics = useMemo(() => {
    const groups: Record<string, Record<string, StudyTopic[]>> = {};
    topics.forEach(topic => {
      if (!groups[topic.subject]) groups[topic.subject] = {};
      if (!groups[topic.subject][topic.chapter_name]) groups[topic.subject][topic.chapter_name] = [];
      groups[topic.subject][topic.chapter_name].push(topic);
    });
    return groups;
  }, [topics]);

  // Calculate stats
  const stats = useMemo(() => {
    const completed = topics.filter(t => t.is_completed).length;
    const total = topics.length;
    const totalHours = topics.reduce((acc, t) => acc + ((t.time_spent_minutes || 0) / 60), 0);
    const points = completed * 10; // 10 points per topic
    
    // Calculate streak (simplified)
    const dates = [...new Set(topics.filter(t => t.completed_at).map(t => format(new Date(t.completed_at!), "yyyy-MM-dd")))];
    let streak = 0;
    const today = format(new Date(), "yyyy-MM-dd");
    if (dates.includes(today)) streak = 1;
    
    return { completed, total, totalHours, points, streak, progress: total > 0 ? (completed / total) * 100 : 0 };
  }, [topics]);

  // Get unlocked achievements
  const achievements = useMemo(() => {
    return ACHIEVEMENTS.map(a => ({
      ...a,
      current: a.id.includes("topic") ? stats.completed : a.id.includes("streak") ? stats.streak : 0,
      earned_at: a.current >= a.requirement ? new Date().toISOString() : null,
    }));
  }, [stats]);

  // Toggle topic completion
  const toggleTopicMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from("syllabus_topics")
        .update({
          is_completed: completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { completed }) => {
      queryClient.invalidateQueries({ queryKey: ["syllabus-topics"] });
      if (completed) {
        toast.success("Topic completed! +10 points 🎉");
      }
    },
  });

  // Add topic mutation
  const addTopicMutation = useMutation({
    mutationFn: async (data: { subject: string; chapter_name: string; topic_name: string; estimated_hours: number }) => {
      const { error } = await supabase.from("syllabus_topics").insert({
        user_id: user!.id,
        subject: data.subject,
        chapter_name: data.chapter_name,
        topic_name: data.topic_name,
        estimated_hours: data.estimated_hours,
        priority: 5,
        is_completed: false,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["syllabus-topics"] });
      toast.success("Topic added");
      setShowAddDialog(false);
      setNewTopic({ subject: "", chapter: "", topic: "", hours: "1" });
    },
  });

  const toggleChapter = (key: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const subjects = Object.keys(groupedTopics);
  const filteredSubjects = selectedSubject ? [selectedSubject] : subjects;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-muted rounded-xl" />
        <div className="h-48 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="text-sm text-muted-foreground">Completed</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.completed}/{stats.total}</p>
          <Progress value={stats.progress} className="mt-2 h-1.5" />
        </div>
        
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-muted-foreground">Points</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.points}</p>
          <p className="text-xs text-muted-foreground mt-1">+10 per topic</p>
        </div>
        
        <div className="p-4 rounded-xl bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-rose-500" />
            <span className="text-sm text-muted-foreground">Streak</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.streak} days</p>
          <p className="text-xs text-muted-foreground mt-1">Keep going!</p>
        </div>
        
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-muted-foreground">Study Hours</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.totalHours.toFixed(1)}h</p>
          <p className="text-xs text-muted-foreground mt-1">Logged time</p>
        </div>
      </div>

      {/* Achievements */}
      <div className="p-4 rounded-xl border border-border bg-card">
        <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Achievements
        </h3>
        <div className="flex flex-wrap gap-2">
          {achievements.slice(0, 6).map(achievement => {
            const isUnlocked = achievement.current >= achievement.requirement;
            return (
              <div
                key={achievement.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                  isUnlocked 
                    ? "bg-amber-500/10 border-amber-500/30" 
                    : "bg-muted/30 border-border opacity-60"
                )}
              >
                <span className="text-xl">{achievement.icon}</span>
                <div>
                  <p className={cn("text-sm font-medium", isUnlocked && "text-amber-600 dark:text-amber-400")}>
                    {achievement.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {achievement.current}/{achievement.requirement} • {achievement.points} pts
                  </p>
                </div>
                {isUnlocked && <Medal className="w-4 h-4 text-amber-500 ml-1" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter & Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedSubject || "all"} onValueChange={(v) => setSelectedSubject(v === "all" ? null : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4" />
          Add Topic
        </Button>
        
        <Button variant="ghost" size="sm" className="gap-2 ml-auto">
          <Share2 className="w-4 h-4" />
          Share Progress
        </Button>
      </div>

      {/* Topics List */}
      {topics.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No topics yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your syllabus topics to start tracking progress
          </p>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Your First Topic
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubjects.map(subject => (
            <div key={subject} className="rounded-xl border border-border overflow-hidden">
              {/* Subject Header */}
              <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">{subject}</span>
                  <Badge variant="secondary" className="text-xs">
                    {Object.values(groupedTopics[subject]).flat().filter(t => t.is_completed).length}/
                    {Object.values(groupedTopics[subject]).flat().length}
                  </Badge>
                </div>
              </div>
              
              {/* Chapters */}
              <div className="divide-y divide-border">
                {Object.entries(groupedTopics[subject]).map(([chapter, chapterTopics]) => {
                  const chapterKey = `${subject}-${chapter}`;
                  const isExpanded = expandedChapters.has(chapterKey);
                  const completedInChapter = chapterTopics.filter(t => t.is_completed).length;
                  const chapterProgress = (completedInChapter / chapterTopics.length) * 100;
                  
                  return (
                    <Collapsible key={chapterKey} open={isExpanded} onOpenChange={() => toggleChapter(chapterKey)}>
                      <CollapsibleTrigger className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="font-medium text-foreground flex-1 text-left">{chapter}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={chapterProgress} className="w-20 h-1.5" />
                          <Badge variant={completedInChapter === chapterTopics.length ? "default" : "outline"} className="text-xs">
                            {completedInChapter}/{chapterTopics.length}
                          </Badge>
                          {completedInChapter === chapterTopics.length && (
                            <Sparkles className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="px-4 pb-3 space-y-2">
                          {chapterTopics.map((topic, idx) => (
                            <div
                              key={topic.id}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                                topic.is_completed 
                                  ? "bg-emerald-500/5 border-emerald-500/20" 
                                  : "bg-card border-border hover:border-primary/30"
                              )}
                            >
                              <Checkbox
                                checked={topic.is_completed}
                                onCheckedChange={(checked) => {
                                  toggleTopicMutation.mutate({ id: topic.id, completed: !!checked });
                                }}
                                className={cn(
                                  "h-5 w-5",
                                  topic.is_completed && "bg-emerald-500 border-emerald-500"
                                )}
                              />
                              
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  "text-sm font-medium",
                                  topic.is_completed && "text-muted-foreground line-through"
                                )}>
                                  {topic.topic_name}
                                </p>
                                {topic.completed_at && (
                                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3" />
                                    Completed {formatDistanceToNow(new Date(topic.completed_at), { addSuffix: true })}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px]">
                                  {topic.estimated_hours}h
                                </Badge>
                                {topic.is_completed && (
                                  <div className="flex items-center gap-1 text-emerald-500">
                                    <Zap className="w-3 h-3" />
                                    <span className="text-[10px] font-medium">+10</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Topic Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Study Topic
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={newTopic.subject} onValueChange={(v) => setNewTopic({ ...newTopic, subject: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Chapter/Module</Label>
              <Input
                value={newTopic.chapter}
                onChange={(e) => setNewTopic({ ...newTopic, chapter: e.target.value })}
                placeholder="e.g., Chapter 1: Introduction"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Topic</Label>
              <Input
                value={newTopic.topic}
                onChange={(e) => setNewTopic({ ...newTopic, topic: e.target.value })}
                placeholder="e.g., Basic Concepts"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Estimated Hours</Label>
              <Input
                type="number"
                value={newTopic.hours}
                onChange={(e) => setNewTopic({ ...newTopic, hours: e.target.value })}
                placeholder="1"
                min="0.5"
                step="0.5"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (newTopic.subject && newTopic.chapter && newTopic.topic) {
                  addTopicMutation.mutate({
                    subject: newTopic.subject,
                    chapter_name: newTopic.chapter,
                    topic_name: newTopic.topic,
                    estimated_hours: parseFloat(newTopic.hours) || 1,
                  });
                }
              }}
              disabled={!newTopic.subject || !newTopic.chapter || !newTopic.topic}
            >
              Add Topic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
