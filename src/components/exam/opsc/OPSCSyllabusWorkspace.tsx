import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  ChevronDown, ChevronRight, Search, BookOpen, FileText, Link2, 
  Plus, Calendar, RotateCcw, CircleDashed, CheckCircle2, Clock,
  Paperclip, ExternalLink, Trash2, Edit
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PRELIMS_SYLLABUS, CSAT_SYLLABUS, MAINS_SYLLABUS, OPTIONAL_SUBJECTS } from "./OPSCExamData";

type SyllabusStatus = "not_started" | "in_progress" | "completed" | "revised";

interface SyllabusItem {
  id: string;
  stage?: string;
  subject: string;
  topic: string;
  subtopic?: string;
  status: SyllabusStatus;
  notes?: string;
  estimated_hours: number;
  actual_hours: number;
  revision_count: number;
  last_revised_at?: string;
}

export const OPSCSyllabusWorkspace: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("prelims");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  // Fetch exam master
  const { data: examMaster } = useQuery({
    queryKey: ["opsc-exam-master", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("exam_master")
        .select("id")
        .eq("user_id", user?.id)
        .eq("exam_type", "opsc")
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch user's syllabus progress
  const { data: syllabusItems = [], isLoading } = useQuery({
    queryKey: ["opsc-syllabus", user?.id, examMaster?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_syllabus")
        .select("*")
        .eq("user_id", user?.id)
        .eq("exam_id", examMaster?.id);
      if (error) throw error;
      return data as SyllabusItem[];
    },
    enabled: !!user?.id && !!examMaster?.id,
  });

  // Initialize syllabus from template
  const initializeSyllabusMutation = useMutation({
    mutationFn: async (stage: "prelims" | "mains") => {
      if (!examMaster?.id) return;
      
      const syllabusData = stage === "prelims" 
        ? { ...PRELIMS_SYLLABUS, ...CSAT_SYLLABUS }
        : MAINS_SYLLABUS;
      
      const items: any[] = [];
      Object.entries(syllabusData).forEach(([subject, data]) => {
        data.topics.forEach((topic: any) => {
          if (topic.subtopics) {
            topic.subtopics.forEach((subtopic: string) => {
              items.push({
                user_id: user?.id,
                exam_id: examMaster.id,
                stage,
                subject,
                topic: topic.name,
                subtopic,
                status: "not_started",
                estimated_hours: 1,
              });
            });
          } else {
            items.push({
              user_id: user?.id,
              exam_id: examMaster.id,
              stage,
              subject,
              topic: topic.name,
              status: "not_started",
              estimated_hours: 1,
            });
          }
        });
      });

      const { error } = await supabase.from("exam_syllabus").insert(items);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opsc-syllabus"] });
      toast.success("Syllabus initialized");
    },
    onError: () => {
      toast.error("Failed to initialize syllabus");
    },
  });

  // Update syllabus item
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SyllabusItem> }) => {
      const { error } = await supabase
        .from("exam_syllabus")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opsc-syllabus"] });
    },
  });

  // Group items by stage, subject, topic
  const groupedSyllabus = useMemo(() => {
    const filtered = syllabusItems.filter(item => 
      !searchQuery || 
      item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtopic?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const grouped: Record<string, Record<string, Record<string, SyllabusItem[]>>> = {};
    
    filtered.forEach(item => {
      const stage = item.stage || "prelims";
      if (!grouped[stage]) grouped[stage] = {};
      if (!grouped[stage][item.subject]) grouped[stage][item.subject] = {};
      if (!grouped[stage][item.subject][item.topic]) grouped[stage][item.subject][item.topic] = [];
      grouped[stage][item.subject][item.topic].push(item);
    });

    return grouped;
  }, [syllabusItems, searchQuery]);

  // Calculate progress
  const calculateProgress = (stage: string) => {
    const stageItems = syllabusItems.filter(i => i.stage === stage);
    if (stageItems.length === 0) return { total: 0, completed: 0, percent: 0 };
    const completed = stageItems.filter(i => i.status === "completed" || i.status === "revised").length;
    return { 
      total: stageItems.length, 
      completed, 
      percent: Math.round((completed / stageItems.length) * 100) 
    };
  };

  const prelimsProgress = calculateProgress("prelims");
  const mainsProgress = calculateProgress("mains");

  const toggleSubject = (subject: string) => {
    const newSet = new Set(expandedSubjects);
    if (newSet.has(subject)) {
      newSet.delete(subject);
    } else {
      newSet.add(subject);
    }
    setExpandedSubjects(newSet);
  };

  const toggleTopic = (key: string) => {
    const newSet = new Set(expandedTopics);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedTopics(newSet);
  };

  const getStatusIcon = (status: SyllabusStatus) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "in_progress": return <CircleDashed className="w-4 h-4 text-amber-500" />;
      case "revised": return <RotateCcw className="w-4 h-4 text-blue-500" />;
      default: return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  const getStatusColor = (status: SyllabusStatus) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-500/10";
      case "in_progress": return "text-amber-600 bg-amber-500/10";
      case "revised": return "text-blue-600 bg-blue-500/10";
      default: return "text-muted-foreground bg-muted/30";
    }
  };

  const cycleStatus = (currentStatus: SyllabusStatus): SyllabusStatus => {
    const cycle: SyllabusStatus[] = ["not_started", "in_progress", "completed", "revised"];
    const idx = cycle.indexOf(currentStatus);
    return cycle[(idx + 1) % cycle.length];
  };

  const hasItems = (stage: string) => {
    return syllabusItems.some(i => i.stage === stage);
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Progress */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Prelims</p>
            <div className="flex items-center gap-2">
              <Progress value={prelimsProgress.percent} className="w-24 h-2" />
              <span className="text-sm font-medium">{prelimsProgress.percent}%</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Mains</p>
            <div className="flex items-center gap-2">
              <Progress value={mainsProgress.percent} className="w-24 h-2" />
              <span className="text-sm font-medium">{mainsProgress.percent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Syllabus Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/30 border border-border p-1">
          <TabsTrigger value="prelims" className="data-[state=active]:bg-card gap-2">
            <BookOpen className="w-4 h-4" />
            Prelims Syllabus
          </TabsTrigger>
          <TabsTrigger value="mains" className="data-[state=active]:bg-card gap-2">
            <FileText className="w-4 h-4" />
            Mains Syllabus
          </TabsTrigger>
          <TabsTrigger value="optional" className="data-[state=active]:bg-card gap-2">
            <BookOpen className="w-4 h-4" />
            Optional Subjects
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prelims" className="mt-6">
          {!hasItems("prelims") ? (
            <Card className="border-dashed border-2">
              <CardContent className="p-8 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Initialize Prelims Syllabus</h3>
                <p className="text-muted-foreground mb-4">
                  Load the complete OPSC Prelims syllabus with all topics and subtopics for tracking.
                </p>
                <Button 
                  onClick={() => initializeSyllabusMutation.mutate("prelims")}
                  disabled={initializeSyllabusMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Initialize Prelims Syllabus
                </Button>
              </CardContent>
            </Card>
          ) : (
            <SyllabusTree 
              data={groupedSyllabus.prelims || {}}
              expandedSubjects={expandedSubjects}
              expandedTopics={expandedTopics}
              onToggleSubject={toggleSubject}
              onToggleTopic={toggleTopic}
              onUpdateItem={(id, updates) => updateItemMutation.mutate({ id, updates })}
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
              cycleStatus={cycleStatus}
            />
          )}
        </TabsContent>

        <TabsContent value="mains" className="mt-6">
          {!hasItems("mains") ? (
            <Card className="border-dashed border-2">
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Initialize Mains Syllabus</h3>
                <p className="text-muted-foreground mb-4">
                  Load the complete OPSC Mains syllabus for all GS papers and Essay.
                </p>
                <Button 
                  onClick={() => initializeSyllabusMutation.mutate("mains")}
                  disabled={initializeSyllabusMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Initialize Mains Syllabus
                </Button>
              </CardContent>
            </Card>
          ) : (
            <SyllabusTree 
              data={groupedSyllabus.mains || {}}
              expandedSubjects={expandedSubjects}
              expandedTopics={expandedTopics}
              onToggleSubject={toggleSubject}
              onToggleTopic={toggleTopic}
              onUpdateItem={(id, updates) => updateItemMutation.mutate({ id, updates })}
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
              cycleStatus={cycleStatus}
            />
          )}
        </TabsContent>

        <TabsContent value="optional" className="mt-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Optional Subjects</CardTitle>
              <p className="text-sm text-muted-foreground">Select your optional subject to track its syllabus</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-3">
                {OPTIONAL_SUBJECTS.map((subject) => (
                  <Button
                    key={subject}
                    variant="outline"
                    className="justify-start h-auto py-3 text-left"
                  >
                    <BookOpen className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">{subject}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Syllabus Tree Component
interface SyllabusTreeProps {
  data: Record<string, Record<string, SyllabusItem[]>>;
  expandedSubjects: Set<string>;
  expandedTopics: Set<string>;
  onToggleSubject: (subject: string) => void;
  onToggleTopic: (key: string) => void;
  onUpdateItem: (id: string, updates: Partial<SyllabusItem>) => void;
  getStatusIcon: (status: SyllabusStatus) => React.ReactNode;
  getStatusColor: (status: SyllabusStatus) => string;
  cycleStatus: (status: SyllabusStatus) => SyllabusStatus;
}

const SyllabusTree: React.FC<SyllabusTreeProps> = ({
  data,
  expandedSubjects,
  expandedTopics,
  onToggleSubject,
  onToggleTopic,
  onUpdateItem,
  getStatusIcon,
  getStatusColor,
  cycleStatus,
}) => {
  const calculateSubjectProgress = (topics: Record<string, SyllabusItem[]>) => {
    const allItems = Object.values(topics).flat();
    const completed = allItems.filter(i => i.status === "completed" || i.status === "revised").length;
    return allItems.length > 0 ? Math.round((completed / allItems.length) * 100) : 0;
  };

  return (
    <div className="space-y-3">
      {Object.entries(data).map(([subject, topics]) => {
        const progress = calculateSubjectProgress(topics);
        const isExpanded = expandedSubjects.has(subject);

        return (
          <Collapsible key={subject} open={isExpanded} onOpenChange={() => onToggleSubject(subject)}>
            <Card className="border-border/50 overflow-hidden">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <CardTitle className="text-base">{subject}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {Object.values(topics).flat().length} topics
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={progress} className="w-20 h-2" />
                      <Badge variant="secondary" className="text-xs">{progress}%</Badge>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0 pb-4">
                  <div className="space-y-2 ml-6">
                    {Object.entries(topics).map(([topicName, items]) => {
                      const topicKey = `${subject}-${topicName}`;
                      const isTopicExpanded = expandedTopics.has(topicKey);
                      const topicCompleted = items.filter(i => i.status === "completed" || i.status === "revised").length;

                      return (
                        <Collapsible key={topicKey} open={isTopicExpanded} onOpenChange={() => onToggleTopic(topicKey)}>
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 cursor-pointer">
                              <div className="flex items-center gap-2">
                                {isTopicExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                                <span className="text-sm font-medium">{topicName}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {topicCompleted}/{items.length}
                              </Badge>
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="ml-6 space-y-1 mt-1">
                              {items.map((item) => (
                                <SyllabusItemRow
                                  key={item.id}
                                  item={item}
                                  onUpdateItem={onUpdateItem}
                                  getStatusIcon={getStatusIcon}
                                  getStatusColor={getStatusColor}
                                  cycleStatus={cycleStatus}
                                />
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
};

// Individual Syllabus Item Row
interface SyllabusItemRowProps {
  item: SyllabusItem;
  onUpdateItem: (id: string, updates: Partial<SyllabusItem>) => void;
  getStatusIcon: (status: SyllabusStatus) => React.ReactNode;
  getStatusColor: (status: SyllabusStatus) => string;
  cycleStatus: (status: SyllabusStatus) => SyllabusStatus;
}

const SyllabusItemRow: React.FC<SyllabusItemRowProps> = ({
  item,
  onUpdateItem,
  getStatusIcon,
  getStatusColor,
  cycleStatus,
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div 
      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/20 group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={() => onUpdateItem(item.id, { status: cycleStatus(item.status) })}
          className="flex-shrink-0"
        >
          {getStatusIcon(item.status)}
        </button>
        <span className="text-sm">{item.subtopic || item.topic}</span>
        {item.revision_count > 0 && (
          <Badge variant="outline" className="text-xs">
            <RotateCcw className="w-3 h-3 mr-1" />
            {item.revision_count}
          </Badge>
        )}
      </div>

      <div className={`flex items-center gap-2 transition-opacity ${showActions ? "opacity-100" : "opacity-0"}`}>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          <Calendar className="w-3 h-3 mr-1" />
          Add to Plan
        </Button>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          <Paperclip className="w-3 h-3 mr-1" />
          Notes
        </Button>
      </div>
    </div>
  );
};
