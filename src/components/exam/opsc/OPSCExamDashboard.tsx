import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, Calendar, Target, Trophy, Clock, FileText, 
  CheckCircle2, CircleDashed, Play, Brain, MessageSquare,
  GraduationCap, TrendingUp, Users, Award, Lightbulb, Sparkles, ArrowLeft
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { OPSC_EXAM_INFO, MAINS_TOTAL } from "./OPSCExamData";
import { OPSCExamOverview } from "./OPSCExamOverview";
import { OPSCExamPattern } from "./OPSCExamPattern";
import { OPSCSyllabusWorkspace } from "./OPSCSyllabusWorkspace";
import { OPSCStudyTimetable } from "./OPSCStudyTimetable";
import { OPSCNotesLibrary } from "./OPSCNotesLibrary";
import { OPSCPYQModule } from "./OPSCPYQModule";
import { OPSCToppersSection } from "./OPSCToppersSection";
import { NovaStudyBot } from "./NovaStudyBot";
import { FloatingNovaStudy } from "./FloatingNovaStudy";

export const OPSCExamDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string>("overview");
  
  // Fetch user's exam progress
  const { data: syllabusProgress } = useQuery({
    queryKey: ["opsc-syllabus-progress", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_syllabus")
        .select("status, estimated_hours, actual_hours")
        .eq("user_id", user?.id);
      
      if (error) return { total: 0, completed: 0, inProgress: 0, hours: 0 };
      
      const total = data?.length || 0;
      const completed = data?.filter(s => s.status === "completed").length || 0;
      const inProgress = data?.filter(s => s.status === "in_progress").length || 0;
      const hours = data?.reduce((sum, s) => sum + (Number(s.actual_hours) || 0), 0) || 0;
      
      return { total, completed, inProgress, hours };
    },
    enabled: !!user?.id,
  });

  // Fetch today's scheduled tasks
  const { data: todaysTasks = [] } = useQuery({
    queryKey: ["opsc-todays-tasks", user?.id],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data } = await supabase
        .from("exam_study_schedule")
        .select("*, exam_syllabus(topic, subject)")
        .eq("user_id", user?.id)
        .eq("schedule_date", today)
        .order("start_time");
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Calculate days until exam (placeholder date)
  const examDate = new Date("2026-06-15");
  const daysUntilExam = differenceInDays(examDate, new Date());

  const progressPercent = syllabusProgress?.total 
    ? Math.round((syllabusProgress.completed / syllabusProgress.total) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border/50 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <Badge variant="outline" className="mb-2 text-xs">
                <GraduationCap className="w-3 h-3 mr-1" />
                Exam Preparation Module
              </Badge>
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
                OPSC OAS / OFS 2026–2027
              </h1>
              <p className="text-muted-foreground mt-1">
                Complete Preparation Workspace • {OPSC_EXAM_INFO.conductingBody}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Days Until Prelims</p>
                <p className="text-3xl font-bold text-primary">{daysUntilExam}</p>
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
                    <p className="text-xs text-muted-foreground">Topics Completed</p>
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
                    <p className="text-2xl font-bold">{Math.round(syllabusProgress?.hours || 0)}h</p>
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
                    <p className="text-xs text-muted-foreground">Overall Progress</p>
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
              {todaysTasks.slice(0, 3).map((task: any) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.exam_syllabus?.subject} • {task.start_time?.slice(0, 5)} - {task.end_time?.slice(0, 5)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={task.status === "completed" ? "default" : "outline"} className="text-xs">
                    {task.status === "completed" ? "Done" : task.status === "in_progress" ? "In Progress" : "Pending"}
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
          <TabsTrigger value="pattern" className="data-[state=active]:bg-card gap-2 text-xs sm:text-sm">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Pattern</span>
          </TabsTrigger>
          <TabsTrigger value="syllabus" className="data-[state=active]:bg-card gap-2 text-xs sm:text-sm">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Syllabus</span>
          </TabsTrigger>
          <TabsTrigger value="timetable" className="data-[state=active]:bg-card gap-2 text-xs sm:text-sm">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Timetable</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="data-[state=active]:bg-card gap-2 text-xs sm:text-sm">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Notes</span>
          </TabsTrigger>
          <TabsTrigger value="pyq" className="data-[state=active]:bg-card gap-2 text-xs sm:text-sm">
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">PYQs</span>
          </TabsTrigger>
          <TabsTrigger value="toppers" className="data-[state=active]:bg-card gap-2 text-xs sm:text-sm">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Toppers</span>
          </TabsTrigger>
          <TabsTrigger value="nova" className="data-[state=active]:bg-card gap-2 text-xs sm:text-sm">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">NOVA Study</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OPSCExamOverview />
        </TabsContent>

        <TabsContent value="pattern">
          <OPSCExamPattern />
        </TabsContent>

        <TabsContent value="syllabus">
          <OPSCSyllabusWorkspace />
        </TabsContent>

        <TabsContent value="timetable">
          <OPSCStudyTimetable />
        </TabsContent>

        <TabsContent value="notes">
          <OPSCNotesLibrary />
        </TabsContent>

        <TabsContent value="pyq">
          <OPSCPYQModule />
        </TabsContent>

        <TabsContent value="toppers">
          <OPSCToppersSection />
        </TabsContent>

        <TabsContent value="nova">
          <NovaStudyBot 
            examType="OPSC"
            subjects={["Indian Polity", "History", "Geography", "Economy", "Odisha GK", "Ethics"]}
          />
        </TabsContent>
      </Tabs>

      {/* Floating NOVA Study button for inline doubt clearing */}
      <FloatingNovaStudy
        examType="OPSC"
        subjects={["Indian Polity", "History", "Geography", "Economy", "Odisha GK", "Ethics"]}
      />
    </div>
  );
};
