import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, ChevronDown, ChevronRight, Check, Clock, BookOpen, 
  Play, Target, Star, Lock, Sparkles, FileText, Link2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { 
  useTechCategories, 
  useTechTracks, 
  useTechTrackWithDetails,
  useTechUserProgress,
  useUpdateTopicProgress,
  TechUserProgress
} from "@/hooks/useTechCareer";
import { cn } from "@/lib/utils";

interface Props {
  categoryId?: string | null;
  trackId?: string | null;
  onBack: () => void;
}

const statusColors: Record<string, string> = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  revised: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  mastered: 'bg-violet-500/10 text-violet-600 border-violet-500/30',
};

const statusLabels: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  revised: 'Revised',
  mastered: 'Mastered',
};

export default function TechCategoryExplorer({ categoryId, trackId, onBack }: Props) {
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(trackId || null);
  const [expandedLevels, setExpandedLevels] = useState<string[]>([]);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [topicNotes, setTopicNotes] = useState<string>("");

  const { data: categories } = useTechCategories();
  const { data: tracks } = useTechTracks(categoryId || undefined);
  const { data: trackDetails, isLoading: trackLoading } = useTechTrackWithDetails(selectedTrackId || '');
  const { data: userProgress } = useTechUserProgress();
  const updateProgress = useUpdateTopicProgress();

  const category = categories?.find(c => c.id === categoryId);

  const getTopicProgress = (topicId: string): TechUserProgress | undefined => {
    return userProgress?.find(p => p.topic_id === topicId);
  };

  const handleStatusChange = (topicId: string, newStatus: TechUserProgress['status']) => {
    updateProgress.mutate({
      topicId,
      status: newStatus,
      notes: topicNotes || undefined,
    });
  };

  const toggleLevel = (levelId: string) => {
    setExpandedLevels(prev => 
      prev.includes(levelId) 
        ? prev.filter(id => id !== levelId)
        : [...prev, levelId]
    );
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  // Calculate progress for a level
  const getLevelProgress = (levelId: string) => {
    const levelModules = trackDetails?.modules.filter(m => m.level_id === levelId) || [];
    const moduleIds = levelModules.map(m => m.id);
    const levelTopics = trackDetails?.topics.filter(t => moduleIds.includes(t.module_id)) || [];
    
    if (levelTopics.length === 0) return 0;
    
    const completed = levelTopics.filter(t => {
      const p = getTopicProgress(t.id);
      return p?.status === 'completed' || p?.status === 'mastered';
    }).length;
    
    return Math.round((completed / levelTopics.length) * 100);
  };

  // If no track selected, show track list
  if (!selectedTrackId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container max-w-7xl mx-auto px-4 py-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold">{category?.name || 'Technical Tracks'}</h1>
            <p className="text-sm text-muted-foreground">{category?.description}</p>
          </div>
        </div>

        <div className="container max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tracks?.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                  onClick={() => setSelectedTrackId(track.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{track.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {track.description}
                        </p>
                      </div>
                      {track.is_premium && (
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                          <Star className="h-3 w-3 mr-1" />
                          Pro
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1 capitalize">
                        <Target className="h-4 w-4" />
                        {track.difficulty_level}
                      </span>
                      {track.estimated_hours && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {track.estimated_hours}h
                        </span>
                      )}
                    </div>

                    {track.career_relevance && (
                      <p className="text-xs text-muted-foreground border-t pt-3">
                        <span className="font-medium">Career:</span> {track.career_relevance}
                      </p>
                    )}

                    <Button className="w-full mt-4" variant="outline">
                      <Play className="h-4 w-4 mr-2" />
                      Start Learning
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show track details with syllabus tree
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => categoryId ? setSelectedTrackId(null) : onBack()} 
            className="gap-2 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {categoryId ? 'Back to Tracks' : 'Back to Dashboard'}
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{trackDetails?.track?.name}</h1>
              <p className="text-sm text-muted-foreground">{trackDetails?.track?.description}</p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {trackDetails?.track?.difficulty_level}
              </Badge>
              {trackDetails?.track?.estimated_hours && (
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  {trackDetails.track.estimated_hours}h
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Syllabus Tree */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Syllabus
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trackLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {trackDetails?.levels?.map((level) => {
                      const levelProgress = getLevelProgress(level.id);
                      const isExpanded = expandedLevels.includes(level.id);
                      const levelModules = trackDetails.modules.filter(m => m.level_id === level.id);

                      return (
                        <Collapsible key={level.id} open={isExpanded} onOpenChange={() => toggleLevel(level.id)}>
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors">
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{level.name}</h4>
                                  <Badge variant="secondary" className="text-xs">
                                    {levelModules.length} modules
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Progress value={levelProgress} className="h-1.5 flex-1 max-w-32" />
                                  <span className="text-xs text-muted-foreground">{levelProgress}%</span>
                                </div>
                              </div>
                              {level.estimated_hours && (
                                <span className="text-sm text-muted-foreground hidden sm:flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {level.estimated_hours}h
                                </span>
                              )}
                            </div>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent>
                            <div className="ml-8 mt-2 space-y-2">
                              {levelModules.map((module) => {
                                const isModuleExpanded = expandedModules.includes(module.id);
                                const moduleTopics = trackDetails.topics.filter(t => t.module_id === module.id);

                                return (
                                  <Collapsible 
                                    key={module.id} 
                                    open={isModuleExpanded} 
                                    onOpenChange={() => toggleModule(module.id)}
                                  >
                                    <CollapsibleTrigger asChild>
                                      <div className="flex items-center gap-2 p-3 rounded-lg hover:bg-muted/30 cursor-pointer">
                                        {isModuleExpanded ? (
                                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className="font-medium text-sm">{module.name}</span>
                                        <Badge variant="outline" className="text-xs ml-auto">
                                          {moduleTopics.length} topics
                                        </Badge>
                                      </div>
                                    </CollapsibleTrigger>

                                    <CollapsibleContent>
                                      <div className="ml-6 mt-1 space-y-1">
                                        {moduleTopics.map((topic) => {
                                          const progress = getTopicProgress(topic.id);
                                          const status = progress?.status || 'not_started';
                                          const isSelected = selectedTopic === topic.id;

                                          return (
                                            <div
                                              key={topic.id}
                                              className={cn(
                                                "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
                                                isSelected ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/30"
                                              )}
                                              onClick={() => {
                                                setSelectedTopic(topic.id);
                                                setTopicNotes(progress?.notes || "");
                                              }}
                                            >
                                              <div className={cn(
                                                "w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0",
                                                status === 'completed' || status === 'mastered' 
                                                  ? "bg-emerald-500 text-white" 
                                                  : status === 'in_progress'
                                                  ? "bg-amber-500 text-white"
                                                  : "border-2 border-muted-foreground/30"
                                              )}>
                                                {(status === 'completed' || status === 'mastered') && (
                                                  <Check className="h-3 w-3" />
                                                )}
                                              </div>
                                              <span className="text-sm flex-1">{topic.name}</span>
                                              <Badge 
                                                variant="outline" 
                                                className={cn("text-xs capitalize", statusColors[status])}
                                              >
                                                {topic.difficulty}
                                              </Badge>
                                              <span className="text-xs text-muted-foreground">
                                                {topic.estimated_minutes}m
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                );
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Topic Details Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Topic Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTopic ? (
                  <div className="space-y-4">
                    {(() => {
                      const topic = trackDetails?.topics.find(t => t.id === selectedTopic);
                      const progress = getTopicProgress(selectedTopic);
                      if (!topic) return null;

                      return (
                        <>
                          <div>
                            <h4 className="font-semibold">{topic.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{topic.description}</p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="capitalize">{topic.difficulty}</Badge>
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              {topic.estimated_minutes}m
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              Interview: {topic.interview_frequency}
                            </Badge>
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">Status</label>
                            <div className="grid grid-cols-2 gap-2">
                              {(['not_started', 'in_progress', 'completed', 'mastered'] as const).map((status) => (
                                <Button
                                  key={status}
                                  variant={progress?.status === status ? "default" : "outline"}
                                  size="sm"
                                  className="text-xs capitalize"
                                  onClick={() => handleStatusChange(selectedTopic, status)}
                                >
                                  {statusLabels[status]}
                                </Button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">Notes</label>
                            <Textarea
                              value={topicNotes}
                              onChange={(e) => setTopicNotes(e.target.value)}
                              placeholder="Add your notes here..."
                              className="min-h-[100px]"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              <FileText className="h-4 w-4 mr-1" />
                              Attach Notes
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Link2 className="h-4 w-4 mr-1" />
                              Add Resource
                            </Button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Select a topic to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
