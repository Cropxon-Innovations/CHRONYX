import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Code, Filter, Search, Check, Clock, Target, 
  Building2, ChevronRight, Play, BookOpen, Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTechDSAProblems, useTechDSAProgress, TechDSAProblem } from "@/hooks/useTechCareer";

const difficultyColors: Record<string, string> = {
  easy: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  hard: 'bg-red-500/10 text-red-600 border-red-500/30',
};

const categories = [
  { id: 'arrays', name: 'Arrays & Strings', icon: '📊' },
  { id: 'linked-lists', name: 'Linked Lists', icon: '🔗' },
  { id: 'trees', name: 'Trees & Graphs', icon: '🌳' },
  { id: 'dynamic-programming', name: 'Dynamic Programming', icon: '📈' },
  { id: 'recursion', name: 'Recursion & Backtracking', icon: '🔄' },
  { id: 'sorting', name: 'Sorting & Searching', icon: '🔍' },
  { id: 'stacks-queues', name: 'Stacks & Queues', icon: '📚' },
  { id: 'math', name: 'Math & Bit Manipulation', icon: '🧮' },
];

export default function TechDSAPractice() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProblem, setSelectedProblem] = useState<TechDSAProblem | null>(null);

  const { data: problems, isLoading } = useTechDSAProblems({
    category: selectedCategory || undefined,
    difficulty: selectedDifficulty || undefined,
  });
  const { data: userProgress } = useTechDSAProgress();

  const filteredProblems = problems?.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getProblemStatus = (problemId: string) => {
    const progress = userProgress?.find(p => p.problem_id === problemId);
    return progress?.best_status || 'not_attempted';
  };

  // Calculate stats
  const totalProblems = problems?.length || 0;
  const solvedProblems = userProgress?.filter(p => 
    p.best_status === 'solved' || p.best_status === 'optimal'
  ).length || 0;
  const attemptedProblems = userProgress?.filter(p => 
    p.best_status !== 'not_attempted'
  ).length || 0;

  const categoryStats = categories.map(cat => {
    const catProblems = problems?.filter(p => p.category === cat.id) || [];
    const solved = catProblems.filter(p => {
      const status = getProblemStatus(p.id);
      return status === 'solved' || status === 'optimal';
    }).length;
    return { ...cat, total: catProblems.length, solved };
  });

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Code className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalProblems}</p>
                <p className="text-xs text-muted-foreground">Total Problems</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Check className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{solvedProblems}</p>
                <p className="text-xs text-muted-foreground">Solved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Target className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{attemptedProblems}</p>
                <p className="text-xs text-muted-foreground">Attempted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500/5 to-violet-500/10 border-violet-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <Sparkles className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {totalProblems > 0 ? Math.round((solvedProblems / totalProblems) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant={selectedCategory === "" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedCategory("")}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                All Problems
              </Button>
              {categoryStats.map(cat => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "ghost"}
                  className="w-full justify-between"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <span className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span className="text-sm truncate">{cat.name}</span>
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {cat.solved}/{cat.total}
                  </Badge>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Problems List */}
        <div className="lg:col-span-3">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search problems..."
                className="pl-9"
              />
            </div>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Problems */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 h-16" />
                </Card>
              ))}
            </div>
          ) : filteredProblems?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Code className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg mb-1">No Problems Found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Try a different search' : 'Check back later for new problems'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-2 pr-4">
                {filteredProblems?.map((problem, index) => {
                  const status = getProblemStatus(problem.id);
                  const isSolved = status === 'solved' || status === 'optimal';
                  
                  return (
                    <motion.div
                      key={problem.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <Card 
                        className={`cursor-pointer hover:shadow-sm transition-all ${
                          isSolved ? 'border-emerald-500/30 bg-emerald-500/5' : ''
                        }`}
                        onClick={() => setSelectedProblem(problem)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                              isSolved 
                                ? 'bg-emerald-500 text-white' 
                                : status === 'attempted' || status === 'partially_solved'
                                ? 'bg-amber-500 text-white'
                                : 'border-2 border-muted-foreground/30'
                            }`}>
                              {isSolved && <Check className="h-3.5 w-3.5" />}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm truncate">{problem.title}</h4>
                                {problem.is_premium && (
                                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs">
                                    Pro
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs capitalize ${difficultyColors[problem.difficulty]}`}
                                >
                                  {problem.difficulty}
                                </Badge>
                                <span className="text-xs text-muted-foreground capitalize">
                                  {problem.category.replace('-', ' ')}
                                </span>
                                {problem.company_tags?.slice(0, 2).map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs hidden sm:inline-flex">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <Button variant="ghost" size="icon" className="shrink-0">
                              <Play className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}
