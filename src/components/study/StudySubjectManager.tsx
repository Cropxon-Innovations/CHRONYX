import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  Trophy,
  Star,
  Flame,
  Plus,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Medal,
  Edit2,
  Trash2,
  BookOpen,
  GraduationCap,
  Code,
  Calculator,
  Beaker,
  Dna,
  History,
  Languages,
  Globe,
  Music,
  Palette,
  Briefcase,
  Heart,
  Lightbulb,
  FolderOpen,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Default subject icons mapping
const SUBJECT_ICONS: Record<string, { icon: string; color: string }> = {
  "Mathematics": { icon: "📐", color: "#3B82F6" },
  "Programming": { icon: "💻", color: "#10B981" },
  "Physics": { icon: "⚛️", color: "#8B5CF6" },
  "Chemistry": { icon: "🧪", color: "#F59E0B" },
  "Biology": { icon: "🧬", color: "#22C55E" },
  "History": { icon: "📜", color: "#A78BFA" },
  "Literature": { icon: "📖", color: "#EC4899" },
  "Language": { icon: "🗣️", color: "#14B8A6" },
  "Geography": { icon: "🌍", color: "#06B6D4" },
  "Music": { icon: "🎵", color: "#F97316" },
  "Art": { icon: "🎨", color: "#D946EF" },
  "Business": { icon: "💼", color: "#6366F1" },
  "Health": { icon: "❤️", color: "#EF4444" },
  "Science": { icon: "🔬", color: "#0EA5E9" },
  "Other": { icon: "📚", color: "#64748B" },
};

const AVAILABLE_ICONS = ["📐", "💻", "⚛️", "🧪", "🧬", "📜", "📖", "🗣️", "🌍", "🎵", "🎨", "💼", "❤️", "🔬", "📚", "✏️", "🎓", "💡", "📊", "🗂️"];
const AVAILABLE_COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#22C55E", "#A78BFA", "#EC4899", "#14B8A6", "#06B6D4", "#F97316", "#D946EF", "#6366F1", "#EF4444", "#0EA5E9", "#64748B"];

interface StudySubject {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  sort_order: number;
}

interface StudyChapter {
  id: string;
  subject_id: string;
  name: string;
  sort_order: number;
}

interface StudyModule {
  id: string;
  chapter_id: string;
  name: string;
  sort_order: number;
}

interface StudyTopic {
  id: string;
  subject: string;
  chapter_name: string;
  topic_name: string;
  is_completed: boolean;
  completed_at: string | null;
  estimated_hours: number;
  time_spent_minutes: number;
  module_id: string | null;
  subject_id: string | null;
  chapter_id: string | null;
}

interface SubjectWithProgress extends StudySubject {
  chapters: ChapterWithProgress[];
  totalTopics: number;
  completedTopics: number;
  progress: number;
}

interface ChapterWithProgress extends StudyChapter {
  modules: ModuleWithProgress[];
  topics: StudyTopic[];
  totalTopics: number;
  completedTopics: number;
  progress: number;
}

interface ModuleWithProgress extends StudyModule {
  topics: StudyTopic[];
  completedTopics: number;
  progress: number;
}

export const StudySubjectManager = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Dialogs
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [showAddModule, setShowAddModule] = useState(false);
  const [showAddTopic, setShowAddTopic] = useState(false);

  // Form states
  const [newSubject, setNewSubject] = useState({ name: "", icon: "📚", color: "#6366F1" });
  const [newChapter, setNewChapter] = useState({ subjectId: "", name: "" });
  const [newModule, setNewModule] = useState({ chapterId: "", name: "" });
  const [newTopic, setNewTopic] = useState({ moduleId: "", chapterId: "", name: "", hours: "1" });

  // Selected context for adding
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ["study-subjects", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_subjects")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as StudySubject[];
    },
    enabled: !!user,
  });

  // Fetch chapters
  const { data: chapters = [] } = useQuery({
    queryKey: ["study-chapters", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_chapters")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as StudyChapter[];
    },
    enabled: !!user,
  });

  // Fetch modules
  const { data: modules = [] } = useQuery({
    queryKey: ["study-modules", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_modules")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as StudyModule[];
    },
    enabled: !!user,
  });

  // Fetch topics
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

  // Build hierarchical data
  const hierarchicalData = useMemo(() => {
    const subjectsWithProgress: SubjectWithProgress[] = subjects.map(subject => {
      const subjectChapters = chapters.filter(c => c.subject_id === subject.id);
      const subjectTopicsLegacy = topics.filter(t => t.subject === subject.name && !t.chapter_id);
      
      const chaptersWithProgress: ChapterWithProgress[] = subjectChapters.map(chapter => {
        const chapterModules = modules.filter(m => m.chapter_id === chapter.id);
        const chapterTopicsLegacy = topics.filter(t => t.chapter_name === chapter.name && t.subject === subject.name && !t.module_id);
        const chapterTopicsNew = topics.filter(t => t.chapter_id === chapter.id && !t.module_id);
        const allChapterTopics = [...chapterTopicsLegacy, ...chapterTopicsNew];

        const modulesWithProgress: ModuleWithProgress[] = chapterModules.map(mod => {
          const moduleTopics = topics.filter(t => t.module_id === mod.id);
          return {
            ...mod,
            topics: moduleTopics,
            completedTopics: moduleTopics.filter(t => t.is_completed).length,
            progress: moduleTopics.length > 0 
              ? (moduleTopics.filter(t => t.is_completed).length / moduleTopics.length) * 100 
              : 0,
          };
        });

        const allTopicsInChapter = [...allChapterTopics, ...modulesWithProgress.flatMap(m => m.topics)];

        return {
          ...chapter,
          modules: modulesWithProgress,
          topics: allChapterTopics,
          totalTopics: allTopicsInChapter.length,
          completedTopics: allTopicsInChapter.filter(t => t.is_completed).length,
          progress: allTopicsInChapter.length > 0 
            ? (allTopicsInChapter.filter(t => t.is_completed).length / allTopicsInChapter.length) * 100 
            : 0,
        };
      });

      // Also include legacy topics that match by subject name but not chapter
      const allSubjectTopics = [
        ...subjectTopicsLegacy,
        ...chaptersWithProgress.flatMap(c => [...c.topics, ...c.modules.flatMap(m => m.topics)]),
      ];

      return {
        ...subject,
        chapters: chaptersWithProgress,
        totalTopics: allSubjectTopics.length,
        completedTopics: allSubjectTopics.filter(t => t.is_completed).length,
        progress: allSubjectTopics.length > 0 
          ? (allSubjectTopics.filter(t => t.is_completed).length / allSubjectTopics.length) * 100 
          : 0,
      };
    });

    // Also add legacy subjects (from topics that have subject name but no subject_id)
    const legacySubjectNames = [...new Set(topics.filter(t => !t.subject_id && t.subject).map(t => t.subject))];
    legacySubjectNames.forEach(subjectName => {
      if (!subjects.find(s => s.name === subjectName)) {
        const subjectTopics = topics.filter(t => t.subject === subjectName);
        const iconConfig = SUBJECT_ICONS[subjectName] || SUBJECT_ICONS["Other"];
        
        // Group by chapter_name
        const chapterNames = [...new Set(subjectTopics.map(t => t.chapter_name))];
        const legacyChapters: ChapterWithProgress[] = chapterNames.map((chapterName, idx) => {
          const chapterTopics = subjectTopics.filter(t => t.chapter_name === chapterName);
          return {
            id: `legacy-${subjectName}-${idx}`,
            subject_id: `legacy-${subjectName}`,
            name: chapterName,
            sort_order: idx,
            modules: [],
            topics: chapterTopics,
            totalTopics: chapterTopics.length,
            completedTopics: chapterTopics.filter(t => t.is_completed).length,
            progress: chapterTopics.length > 0 
              ? (chapterTopics.filter(t => t.is_completed).length / chapterTopics.length) * 100 
              : 0,
          };
        });

        subjectsWithProgress.push({
          id: `legacy-${subjectName}`,
          name: subjectName,
          icon: iconConfig.icon,
          color: iconConfig.color,
          is_default: false,
          sort_order: 999,
          chapters: legacyChapters,
          totalTopics: subjectTopics.length,
          completedTopics: subjectTopics.filter(t => t.is_completed).length,
          progress: subjectTopics.length > 0 
            ? (subjectTopics.filter(t => t.is_completed).length / subjectTopics.length) * 100 
            : 0,
        });
      }
    });

    return subjectsWithProgress;
  }, [subjects, chapters, modules, topics]);

  // Stats
  const stats = useMemo(() => {
    const completed = topics.filter(t => t.is_completed).length;
    const total = topics.length;
    const totalHours = topics.reduce((acc, t) => acc + ((t.time_spent_minutes || 0) / 60), 0);
    const points = completed * 10;
    const dates = [...new Set(topics.filter(t => t.completed_at).map(t => format(new Date(t.completed_at!), "yyyy-MM-dd")))];
    let streak = dates.includes(format(new Date(), "yyyy-MM-dd")) ? 1 : 0;

    return { completed, total, totalHours, points, streak, progress: total > 0 ? (completed / total) * 100 : 0 };
  }, [topics]);

  // Mutations
  const addSubjectMutation = useMutation({
    mutationFn: async (data: { name: string; icon: string; color: string }) => {
      const { error } = await supabase.from("study_subjects").insert({
        user_id: user!.id,
        name: data.name,
        icon: data.icon,
        color: data.color,
        sort_order: subjects.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-subjects"] });
      toast.success("Subject added!");
      setShowAddSubject(false);
      setNewSubject({ name: "", icon: "📚", color: "#6366F1" });
    },
  });

  const addChapterMutation = useMutation({
    mutationFn: async (data: { subject_id: string; name: string }) => {
      const subjectChapters = chapters.filter(c => c.subject_id === data.subject_id);
      const { error } = await supabase.from("study_chapters").insert({
        user_id: user!.id,
        subject_id: data.subject_id,
        name: data.name,
        sort_order: subjectChapters.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-chapters"] });
      toast.success("Chapter added!");
      setShowAddChapter(false);
      setNewChapter({ subjectId: "", name: "" });
    },
  });

  const addModuleMutation = useMutation({
    mutationFn: async (data: { chapter_id: string; name: string }) => {
      const chapterModules = modules.filter(m => m.chapter_id === data.chapter_id);
      const { error } = await supabase.from("study_modules").insert({
        user_id: user!.id,
        chapter_id: data.chapter_id,
        name: data.name,
        sort_order: chapterModules.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-modules"] });
      toast.success("Module added!");
      setShowAddModule(false);
      setNewModule({ chapterId: "", name: "" });
    },
  });

  const addTopicMutation = useMutation({
    mutationFn: async (data: { module_id?: string; chapter_id?: string; subject_id?: string; subject: string; chapter_name: string; topic_name: string; estimated_hours: number }) => {
      const { error } = await supabase.from("syllabus_topics").insert({
        user_id: user!.id,
        subject: data.subject,
        chapter_name: data.chapter_name,
        topic_name: data.topic_name,
        estimated_hours: data.estimated_hours,
        priority: 5,
        is_completed: false,
        module_id: data.module_id || null,
        chapter_id: data.chapter_id || null,
        subject_id: data.subject_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["syllabus-topics"] });
      toast.success("Topic added! +10 pts when completed 🎯");
      setShowAddTopic(false);
      setNewTopic({ moduleId: "", chapterId: "", name: "", hours: "1" });
    },
  });

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

  const toggleExpand = (type: "subject" | "chapter" | "module", id: string) => {
    const setFn = type === "subject" 
      ? setExpandedSubjects 
      : type === "chapter" 
        ? setExpandedChapters 
        : setExpandedModules;
    
    setFn(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-muted rounded-xl" />
        <div className="h-64 bg-muted rounded-xl" />
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
        </div>
        
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-muted-foreground">Study Hours</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.totalHours.toFixed(1)}h</p>
        </div>
      </div>

      {/* Quick Add Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowAddSubject(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Subject
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowAddChapter(true)} className="gap-2" disabled={subjects.length === 0}>
          <Plus className="w-4 h-4" />
          Add Chapter
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowAddModule(true)} className="gap-2" disabled={chapters.length === 0}>
          <Plus className="w-4 h-4" />
          Add Module
        </Button>
        <Button variant="default" size="sm" onClick={() => setShowAddTopic(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Topic
        </Button>
      </div>

      {/* Hierarchical Tree */}
      {hierarchicalData.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <GraduationCap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No subjects yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Start by adding your first subject</p>
          <Button onClick={() => setShowAddSubject(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Subject
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {hierarchicalData.map(subject => (
            <div key={subject.id} className="rounded-xl border border-border overflow-hidden bg-card">
              {/* Subject Header */}
              <Collapsible open={expandedSubjects.has(subject.id)} onOpenChange={() => toggleExpand("subject", subject.id)}>
                <CollapsibleTrigger className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                  {expandedSubjects.has(subject.id) ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-2xl">{subject.icon}</span>
                  <span className="font-semibold text-foreground flex-1 text-left">{subject.name}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={subject.progress} className="w-20 h-2" />
                    <Badge 
                      variant={subject.progress === 100 ? "default" : "outline"} 
                      className={cn("text-xs", subject.progress === 100 && "bg-emerald-500")}
                    >
                      {subject.completedTopics}/{subject.totalTopics}
                    </Badge>
                    {subject.progress === 100 && <Sparkles className="w-4 h-4 text-amber-500" />}
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="border-t border-border">
                    {subject.chapters.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No chapters yet. 
                        <Button 
                          variant="link" 
                          size="sm" 
                          onClick={() => { 
                            setSelectedSubjectId(subject.id); 
                            setNewChapter({ ...newChapter, subjectId: subject.id });
                            setShowAddChapter(true); 
                          }}
                        >
                          Add one
                        </Button>
                      </div>
                    ) : (
                      subject.chapters.map(chapter => (
                        <Collapsible 
                          key={chapter.id} 
                          open={expandedChapters.has(chapter.id)} 
                          onOpenChange={() => toggleExpand("chapter", chapter.id)}
                        >
                          <CollapsibleTrigger className="w-full px-6 py-2.5 flex items-center gap-3 hover:bg-muted/20 transition-colors border-b border-border/50">
                            {expandedChapters.has(chapter.id) ? (
                              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                            <BookOpen className="w-4 h-4 text-primary/70" />
                            <span className="font-medium text-sm text-foreground flex-1 text-left">{chapter.name}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={chapter.progress} className="w-16 h-1.5" />
                              <Badge variant="secondary" className="text-[10px]">
                                {chapter.completedTopics}/{chapter.totalTopics}
                              </Badge>
                              {chapter.progress === 100 && <Medal className="w-3.5 h-3.5 text-amber-500" />}
                            </div>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent>
                            <div className="pl-10 pr-4 py-2 space-y-1 bg-muted/10">
                              {/* Modules */}
                              {chapter.modules.map(mod => (
                                <Collapsible
                                  key={mod.id}
                                  open={expandedModules.has(mod.id)}
                                  onOpenChange={() => toggleExpand("module", mod.id)}
                                >
                                  <CollapsibleTrigger className="w-full px-3 py-2 flex items-center gap-2 hover:bg-muted/30 rounded-lg transition-colors">
                                    {expandedModules.has(mod.id) ? (
                                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                    )}
                                    <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-sm text-foreground flex-1 text-left">{mod.name}</span>
                                    <Badge variant="outline" className="text-[10px]">
                                      {mod.completedTopics}/{mod.topics.length}
                                    </Badge>
                                  </CollapsibleTrigger>
                                  
                                  <CollapsibleContent>
                                    <div className="pl-6 space-y-1 py-1">
                                      {mod.topics.map(topic => (
                                        <TopicItem 
                                          key={topic.id} 
                                          topic={topic} 
                                          onToggle={(completed) => toggleTopicMutation.mutate({ id: topic.id, completed })} 
                                        />
                                      ))}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              ))}

                              {/* Topics directly under chapter (no module) */}
                              {chapter.topics.map(topic => (
                                <TopicItem 
                                  key={topic.id} 
                                  topic={topic} 
                                  onToggle={(completed) => toggleTopicMutation.mutate({ id: topic.id, completed })} 
                                />
                              ))}

                              {chapter.modules.length === 0 && chapter.topics.length === 0 && (
                                <p className="text-xs text-muted-foreground py-2 px-3">No topics yet</p>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}
        </div>
      )}

      {/* Add Subject Dialog */}
      <Dialog open={showAddSubject} onOpenChange={setShowAddSubject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subject Name</Label>
              <Input 
                value={newSubject.name} 
                onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })} 
                placeholder="e.g., Mathematics"
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_ICONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setNewSubject({ ...newSubject, icon })}
                    className={cn(
                      "w-10 h-10 rounded-lg border text-xl flex items-center justify-center transition-all",
                      newSubject.icon === icon ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewSubject({ ...newSubject, color })}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      newSubject.color === color ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSubject(false)}>Cancel</Button>
            <Button 
              onClick={() => addSubjectMutation.mutate(newSubject)} 
              disabled={!newSubject.name.trim()}
            >
              Add Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Chapter Dialog */}
      <Dialog open={showAddChapter} onOpenChange={setShowAddChapter}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Chapter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select 
                value={newChapter.subjectId} 
                onValueChange={(v) => setNewChapter({ ...newChapter, subjectId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.icon} {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Chapter Name</Label>
              <Input 
                value={newChapter.name} 
                onChange={(e) => setNewChapter({ ...newChapter, name: e.target.value })} 
                placeholder="e.g., Introduction to Algebra"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddChapter(false)}>Cancel</Button>
            <Button 
              onClick={() => addChapterMutation.mutate({ subject_id: newChapter.subjectId, name: newChapter.name })} 
              disabled={!newChapter.name.trim() || !newChapter.subjectId}
            >
              Add Chapter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Module Dialog */}
      <Dialog open={showAddModule} onOpenChange={setShowAddModule}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Module</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Chapter</Label>
              <Select 
                value={newModule.chapterId} 
                onValueChange={(v) => setNewModule({ ...newModule, chapterId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select chapter" />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map(c => {
                    const subj = subjects.find(s => s.id === c.subject_id);
                    return (
                      <SelectItem key={c.id} value={c.id}>
                        {subj?.icon} {c.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Module Name</Label>
              <Input 
                value={newModule.name} 
                onChange={(e) => setNewModule({ ...newModule, name: e.target.value })} 
                placeholder="e.g., Linear Equations"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModule(false)}>Cancel</Button>
            <Button 
              onClick={() => addModuleMutation.mutate({ chapter_id: newModule.chapterId, name: newModule.name })} 
              disabled={!newModule.name.trim() || !newModule.chapterId}
            >
              Add Module
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Topic Dialog */}
      <Dialog open={showAddTopic} onOpenChange={setShowAddTopic}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Topic</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select 
                value={selectedSubjectId || ""} 
                onValueChange={(v) => {
                  setSelectedSubjectId(v);
                  setSelectedChapterId(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.icon} {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSubjectId && (
              <div className="space-y-2">
                <Label>Chapter</Label>
                <Select 
                  value={selectedChapterId || ""} 
                  onValueChange={(v) => setSelectedChapterId(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    {chapters.filter(c => c.subject_id === selectedSubjectId).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedChapterId && (
              <div className="space-y-2">
                <Label>Module (optional)</Label>
                <Select 
                  value={newTopic.moduleId || "none"} 
                  onValueChange={(v) => setNewTopic({ ...newTopic, moduleId: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No module</SelectItem>
                    {modules.filter(m => m.chapter_id === selectedChapterId).map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Topic Name</Label>
              <Input 
                value={newTopic.name} 
                onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })} 
                placeholder="e.g., Solving quadratic equations"
              />
            </div>

            <div className="space-y-2">
              <Label>Estimated Hours</Label>
              <Input 
                type="number" 
                value={newTopic.hours} 
                onChange={(e) => setNewTopic({ ...newTopic, hours: e.target.value })} 
                min="0.5" 
                step="0.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTopic(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                const subject = subjects.find(s => s.id === selectedSubjectId);
                const chapter = chapters.find(c => c.id === selectedChapterId);
                if (subject && chapter) {
                  addTopicMutation.mutate({
                    subject: subject.name,
                    chapter_name: chapter.name,
                    topic_name: newTopic.name,
                    estimated_hours: parseFloat(newTopic.hours) || 1,
                    subject_id: selectedSubjectId || undefined,
                    chapter_id: selectedChapterId || undefined,
                    module_id: newTopic.moduleId || undefined,
                  });
                }
              }} 
              disabled={!newTopic.name.trim() || !selectedSubjectId || !selectedChapterId}
            >
              Add Topic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Topic Item Component
const TopicItem = ({ topic, onToggle }: { topic: StudyTopic; onToggle: (completed: boolean) => void }) => {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
        topic.is_completed 
          ? "bg-emerald-500/10 border border-emerald-500/20" 
          : "bg-background border border-border hover:border-primary/30"
      )}
    >
      <Checkbox
        checked={topic.is_completed}
        onCheckedChange={(checked) => onToggle(!!checked)}
        className={cn("h-4 w-4", topic.is_completed && "bg-emerald-500 border-emerald-500")}
      />
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm",
          topic.is_completed && "text-muted-foreground line-through"
        )}>
          {topic.topic_name}
        </p>
        {topic.completed_at && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {formatDistanceToNow(new Date(topic.completed_at), { addSuffix: true })}
          </p>
        )}
      </div>
      
      <Badge variant="outline" className="text-[10px]">{topic.estimated_hours}h</Badge>
      {topic.is_completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
    </div>
  );
};

export default StudySubjectManager;
