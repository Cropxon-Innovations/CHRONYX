import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Server, Layout, TestTube, GitBranch, Cloud, Building2, AlertTriangle, Code,
  ChevronRight, BookOpen, FolderGit2, MessageSquare, BarChart3, Sparkles,
  Clock, Target, TrendingUp, Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTechCategories, useTechTracks, useCareerReadiness, useTechProjects, useTechUserProgress } from "@/hooks/useTechCareer";
import TechCategoryExplorer from "./TechCategoryExplorer";
import TechProjectTracker from "./TechProjectTracker";
import TechInterviewPrep from "./TechInterviewPrep";
import TechDSAPractice from "./TechDSAPractice";
import TechCareerAnalytics from "./TechCareerAnalytics";

const iconMap: Record<string, React.ElementType> = {
  Server, Layout, TestTube, GitBranch, Cloud, Building2, AlertTriangle, Code,
  Hash: Code, Coffee: Code, FileCode: Code, Zap: Code, Share2: Code, Cpu: Code,
  Globe: Layout, Hexagon: Layout, Atom: Layout, Triangle: Layout,
  MousePointer: TestTube, Play: TestTube, Network: TestTube,
  Workflow: GitBranch, Container: GitBranch, Ship: GitBranch, Activity: GitBranch,
  CloudCog: Cloud, CloudLightning: Cloud,
  Boxes: Building2, Radio: Building2, Database: Building2,
  Gauge: AlertTriangle, AlertCircle: AlertTriangle,
  List: Code, Link: Code, GitFork: Code, Layers: Code, Repeat: Code, Coins: Code,
};

const colorMap: Record<string, string> = {
  '#3B82F6': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  '#10B981': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  '#8B5CF6': 'bg-violet-500/10 text-violet-500 border-violet-500/20',
  '#F59E0B': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  '#06B6D4': 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  '#EC4899': 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  '#EF4444': 'bg-red-500/10 text-red-500 border-red-500/20',
  '#6366F1': 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
};

export default function TechCareerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  const { data: categories, isLoading: categoriesLoading } = useTechCategories();
  const { data: tracks } = useTechTracks();
  const { data: readiness } = useCareerReadiness();
  const { data: projects } = useTechProjects();
  const { data: progress } = useTechUserProgress();

  // Calculate stats
  const totalTracks = tracks?.length || 0;
  const tracksInProgress = new Set(progress?.filter(p => p.status !== 'not_started').map(p => p.topic_id)).size;
  const completedTopics = progress?.filter(p => p.status === 'completed' || p.status === 'mastered').length || 0;
  const totalProjects = projects?.length || 0;
  const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;

  if (selectedCategory || selectedTrack) {
    return (
      <TechCategoryExplorer 
        categoryId={selectedCategory}
        trackId={selectedTrack}
        onBack={() => {
          setSelectedCategory(null);
          setSelectedTrack(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Code className="h-6 w-6 text-primary" />
                Technical Career OS
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Master your technical journey from Beginner to Architect
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Target className="h-3 w-3" />
                {readiness?.overall_score || 0}% Ready
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="overview" className="gap-1.5">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Syllabus</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-1.5">
              <FolderGit2 className="h-4 w-4" />
              <span className="hidden sm:inline">Projects</span>
            </TabsTrigger>
            <TabsTrigger value="interview" className="gap-1.5">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Interview</span>
            </TabsTrigger>
            <TabsTrigger value="dsa" className="gap-1.5">
              <Code className="h-4 w-4" />
              <span className="hidden sm:inline">DSA</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <BookOpen className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalTracks}</p>
                      <p className="text-xs text-muted-foreground">Learning Tracks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <Target className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{completedTopics}</p>
                      <p className="text-xs text-muted-foreground">Topics Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-violet-500/5 to-violet-500/10 border-violet-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-500/10">
                      <FolderGit2 className="h-5 w-5 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{completedProjects}/{totalProjects}</p>
                      <p className="text-xs text-muted-foreground">Projects</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <TrendingUp className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{readiness?.overall_score || 0}%</p>
                      <p className="text-xs text-muted-foreground">Career Ready</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Categories Grid */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Technical Categories
              </h2>
              
              {categoriesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6 h-40" />
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {categories?.map((category, index) => {
                    const IconComponent = iconMap[category.icon || 'Code'] || Code;
                    const colorClass = colorMap[category.color || '#6366F1'] || colorMap['#6366F1'];
                    const categoryTracks = tracks?.filter(t => t.category_id === category.id) || [];
                    
                    return (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card 
                          className={`cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border ${colorClass.split(' ')[2]}`}
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          <CardContent className="p-6">
                            <div className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center mb-4`}>
                              <IconComponent className="h-6 w-6" />
                            </div>
                            <h3 className="font-semibold text-base mb-1">{category.name}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                              {category.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="text-xs">
                                {categoryTracks.length} Tracks
                              </Badge>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recommended Next Steps */}
            {readiness?.weak_areas && readiness.weak_areas.length > 0 && (
              <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Recommended Focus Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {readiness.weak_areas.map((area, i) => (
                      <Badge key={i} variant="outline" className="gap-1">
                        <Target className="h-3 w-3" />
                        {area}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Focus on these areas to improve your overall career readiness score.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Recent Tracks */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Popular Tracks</h2>
              <ScrollArea className="pb-4">
                <div className="flex gap-4 pb-2">
                  {tracks?.slice(0, 6).map((track) => {
                    const IconComponent = iconMap[track.icon || 'Code'] || Code;
                    const colorClass = colorMap[track.color || '#6366F1'] || colorMap['#6366F1'];
                    
                    return (
                      <Card 
                        key={track.id}
                        className="min-w-[280px] cursor-pointer hover:shadow-md transition-all"
                        onClick={() => setSelectedTrack(track.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center shrink-0`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{track.name}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {track.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {track.difficulty_level}
                                </Badge>
                                {track.estimated_hours && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {track.estimated_hours}h
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="projects">
            <TechProjectTracker />
          </TabsContent>

          <TabsContent value="interview">
            <TechInterviewPrep />
          </TabsContent>

          <TabsContent value="dsa">
            <TechDSAPractice />
          </TabsContent>

          <TabsContent value="analytics">
            <TechCareerAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
