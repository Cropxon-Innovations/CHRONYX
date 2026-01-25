import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, Calendar, Target, Trophy, Clock, FileText, 
  CheckCircle2, CircleDashed, Play, Brain, TrendingUp, Sparkles
} from "lucide-react";
import { format, differenceInDays, addMonths } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { StudySubjectManager } from "@/components/study/StudySubjectManager";
import { FloatingNovaStudy } from "@/components/exam/opsc/FloatingNovaStudy";
import { NovaStudyBot } from "@/components/exam/opsc/NovaStudyBot";

interface GenericExamWorkspaceProps {
  templateId: string;
  templateName: string;
  templateIcon: string;
  templateCategory: string;
  templateSubcategory: string;
  examYear: number;
  subjects: string[];
  totalTopics: number;
  examDate?: Date;
  description?: string;
}

export const GenericExamWorkspace: React.FC<GenericExamWorkspaceProps> = ({
  templateId,
  templateName,
  templateIcon,
  templateCategory,
  templateSubcategory,
  examYear,
  subjects,
  totalTopics,
  examDate,
  description
}) => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string>("overview");
  
  // Default exam date to 6 months from now if not provided
  const targetDate = examDate || addMonths(new Date(), 6);
  const daysUntilExam = differenceInDays(targetDate, new Date());

  // Fetch user's progress for this template
  const { data: syllabusProgress } = useQuery({
    queryKey: ["template-syllabus-progress", user?.id, templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_subjects")
        .select(`
          id,
          study_chapters(
            id,
            study_modules(
              id,
              syllabus_topics(id, status)
            )
          )
        `)
        .eq("user_id", user?.id);
      
      if (error) return { total: 0, completed: 0, inProgress: 0, hours: 0 };
      
      let total = 0;
      let completed = 0;
      let inProgress = 0;
      
      data?.forEach(subject => {
        subject.study_chapters?.forEach((chapter: any) => {
          chapter.study_modules?.forEach((module: any) => {
            module.syllabus_topics?.forEach((topic: any) => {
              total++;
              if (topic.status === "completed") completed++;
              else if (topic.status === "in_progress") inProgress++;
            });
          });
        });
      });
      
      return { total: total || totalTopics, completed, inProgress, hours: Math.round(completed * 0.5) };
    },
    enabled: !!user?.id,
  });

  // Fetch today's scheduled tasks
  const { data: todaysTasks = [] } = useQuery({
    queryKey: ["template-todays-tasks", user?.id, templateId],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", user?.id)
        .eq("category", "Study")
        .gte("due_date", today)
        .order("due_date");
      return data?.slice(0, 5) || [];
    },
    enabled: !!user?.id,
  });

  const progressPercent = syllabusProgress?.total 
    ? Math.round((syllabusProgress.completed / syllabusProgress.total) * 100) 
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border/50 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <Badge variant="outline" className="mb-2 text-xs">
                <span className="mr-1">{templateIcon}</span>
                {templateCategory} • {templateSubcategory}
              </Badge>
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
                {templateName}
              </h1>
              {description && (
                <p className="text-muted-foreground mt-1 max-w-xl">
                  {description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Days Remaining</p>
                <p className="text-3xl font-bold text-primary">{Math.max(0, daysUntilExam)}</p>
              </div>
              <Button size="sm" className="gap-2" onClick={() => setActiveSection("syllabus")}>
                <Play className="w-4 h-4" />
                Continue Study
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{syllabusProgress?.completed || 0}</p>
                    <p className="text-xs text-muted-foreground">Topics Done</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <CircleDashed className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{syllabusProgress?.inProgress || 0}</p>
                    <p className="text-xs text-muted-foreground">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Clock className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{syllabusProgress?.hours || 0}h</p>
                    <p className="text-xs text-muted-foreground">Study Hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{progressPercent}%</p>
                    <p className="text-xs text-muted-foreground">Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Syllabus Completion</span>
              <span className="font-medium">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>
      </div>

      {/* Today's Agenda */}
      {todaysTasks.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Today's Study Agenda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todaysTasks.map((task: any) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.due_date ? format(new Date(task.due_date), "MMM d") : "No due date"}
                      </p>
                    </div>
                  </div>
                  <Badge variant={task.completed ? "default" : "outline"} className="text-xs">
                    {task.completed ? "Done" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Navigation Tabs */}
      <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-6">
        <TabsList className="bg-muted/30 border border-border p-1 h-auto flex-wrap gap-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-card gap-2 text-xs sm:text-sm">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="syllabus" className="data-[state=active]:bg-card gap-2 text-xs sm:text-sm">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Syllabus</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="data-[state=active]:bg-card gap-2 text-xs sm:text-sm">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="data-[state=active]:bg-card gap-2 text-xs sm:text-sm">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Notes</span>
          </TabsTrigger>
          <TabsTrigger value="practice" className="data-[state=active]:bg-card gap-2 text-xs sm:text-sm">
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">Practice</span>
          </TabsTrigger>
          <TabsTrigger value="nova" className="data-[state=active]:bg-card gap-2 text-xs sm:text-sm">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">NOVA Study</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">About This Preparation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {description || `Comprehensive preparation workspace for ${templateName}. Track your progress, manage your syllabus, and prepare systematically.`}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Subjects</p>
                    <p className="font-semibold">{subjects.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Topics</p>
                    <p className="font-semibold">{totalTopics}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Target Year</p>
                    <p className="font-semibold">{examYear}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Category</p>
                    <p className="font-semibold">{templateSubcategory}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Subjects Covered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="syllabus">
          <StudySubjectManager />
        </TabsContent>

        <TabsContent value="schedule">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Study Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your personalized study schedule will appear here. Start by adding topics to your syllabus.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Study Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your notes for {templateName} will appear here. Create notes as you study each topic.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="practice">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Practice & Revision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Practice questions and revision materials for {templateName} will appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nova">
          <NovaStudyBot 
            examType={templateName}
            subjects={subjects}
          />
        </TabsContent>
      </Tabs>

      {/* Floating NOVA Study button */}
      <FloatingNovaStudy
        examType={templateName}
        subjects={subjects}
      />
    </div>
  );
};
