import React, { useEffect } from "react";
import { 
  BarChart3, Target, TrendingUp, Award, AlertCircle,
  RefreshCw, Server, Layout, Cloud, GitBranch, Code, Building2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  useCareerReadiness, 
  useCalculateCareerReadiness,
  useTechUserProgress,
  useTechProjects,
  useTechDSAProgress
} from "@/hooks/useTechCareer";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

const skillAreas = [
  { key: 'backend_score', name: 'Backend', icon: Server, color: '#3B82F6' },
  { key: 'frontend_score', name: 'Frontend', icon: Layout, color: '#10B981' },
  { key: 'devops_score', name: 'DevOps', icon: GitBranch, color: '#F59E0B' },
  { key: 'cloud_score', name: 'Cloud', icon: Cloud, color: '#06B6D4' },
  { key: 'architecture_score', name: 'Architecture', icon: Building2, color: '#EC4899' },
  { key: 'dsa_score', name: 'DSA', icon: Code, color: '#6366F1' },
];

export default function TechCareerAnalytics() {
  const { data: readiness, isLoading: readinessLoading } = useCareerReadiness();
  const calculateReadiness = useCalculateCareerReadiness();
  const { data: progress } = useTechUserProgress();
  const { data: projects } = useTechProjects();
  const { data: dsaProgress } = useTechDSAProgress();

  // Auto-calculate on first load
  useEffect(() => {
    if (!readiness && progress?.length) {
      calculateReadiness.mutate();
    }
  }, [progress, readiness]);

  const radarData = skillAreas.map(skill => ({
    subject: skill.name,
    value: readiness?.[skill.key as keyof typeof readiness] as number || 0,
    fullMark: 100,
  }));

  const barData = skillAreas.map(skill => ({
    name: skill.name,
    score: readiness?.[skill.key as keyof typeof readiness] as number || 0,
    color: skill.color,
  }));

  // Calculate study stats
  const totalTopicsStudied = progress?.filter(p => 
    p.status !== 'not_started'
  ).length || 0;
  
  const completedTopics = progress?.filter(p => 
    p.status === 'completed' || p.status === 'mastered'
  ).length || 0;

  const totalTimeSpent = progress?.reduce((acc, p) => acc + (p.time_spent_minutes || 0), 0) || 0;

  const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;

  const dsaSolved = dsaProgress?.filter(p => 
    p.best_status === 'solved' || p.best_status === 'optimal'
  ).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Career Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Track your technical career readiness
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => calculateReadiness.mutate()}
          disabled={calculateReadiness.isPending}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${calculateReadiness.isPending ? 'animate-spin' : ''}`} />
          Recalculate
        </Button>
      </div>

      {/* Overall Score */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <svg className="w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(readiness?.overall_score || 0) * 3.52} 352`}
                  transform="rotate(-90 64 64)"
                  className="text-primary"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{readiness?.overall_score || 0}%</span>
                <span className="text-xs text-muted-foreground">Ready</span>
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-semibold mb-2">Career Readiness Score</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Based on your progress across all technical domains
              </p>
              
              {readiness?.weak_areas && readiness.weak_areas.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Focus areas:
                  </span>
                  {readiness.weak_areas.map((area, i) => (
                    <Badge key={i} variant="outline">{area}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedTopics}</p>
                <p className="text-xs text-muted-foreground">Topics Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Award className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedProjects}</p>
                <p className="text-xs text-muted-foreground">Projects Done</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <Code className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dsaSolved}</p>
                <p className="text-xs text-muted-foreground">DSA Solved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(totalTimeSpent / 60)}h</p>
                <p className="text-xs text-muted-foreground">Time Invested</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Skill Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid strokeDasharray="3 3" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fontSize: 12 }}
                  />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Domain Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Score']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skill Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detailed Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skillAreas.map((skill) => {
              const Icon = skill.icon;
              const score = readiness?.[skill.key as keyof typeof readiness] as number || 0;
              
              return (
                <div 
                  key={skill.key}
                  className="p-4 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${skill.color}20` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: skill.color }} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{skill.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {score < 30 ? 'Beginner' : score < 60 ? 'Intermediate' : score < 85 ? 'Advanced' : 'Expert'}
                      </p>
                    </div>
                    <span className="text-lg font-bold">{score}%</span>
                  </div>
                  <Progress 
                    value={score} 
                    className="h-2"
                    style={{ '--progress-color': skill.color } as React.CSSProperties}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
