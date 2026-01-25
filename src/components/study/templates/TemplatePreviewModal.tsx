import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  Clock,
  GraduationCap,
  Target,
  CheckCircle2,
  FileText,
  Award,
  Users,
  TrendingUp,
  ChevronRight,
  Star,
  Sparkles,
  Plus,
} from "lucide-react";
import { StudyTemplate } from "@/hooks/useStudyOnboarding";
import { cn } from "@/lib/utils";

interface TemplatePreviewModalProps {
  template: StudyTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTemplate: () => void;
  isAdded: boolean;
  isAdding: boolean;
}

// Sample syllabus structure for preview
const getSampleSyllabus = (template: StudyTemplate | null) => {
  if (!template) return [];
  
  // Generate realistic syllabus based on template category
  const syllabusStructures: Record<string, Array<{
    subject: string;
    topics: string[];
    weight: string;
    difficulty: "Easy" | "Medium" | "Hard";
  }>> = {
    "upsc-cse": [
      {
        subject: "Indian Polity & Governance",
        topics: [
          "Constitution - Historical Background",
          "Preamble & Salient Features",
          "Fundamental Rights & Duties",
          "Directive Principles",
          "Parliament & State Legislature",
          "Judiciary System",
          "Constitutional Bodies",
          "Local Self Government"
        ],
        weight: "15-20%",
        difficulty: "Hard"
      },
      {
        subject: "Indian Economy",
        topics: [
          "Planning & Economic Development",
          "Monetary Policy & Banking",
          "Fiscal Policy & Budget",
          "Agriculture & Industry",
          "External Sector & Trade",
          "Inflation & Poverty",
          "Government Schemes"
        ],
        weight: "12-15%",
        difficulty: "Medium"
      },
      {
        subject: "Geography",
        topics: [
          "Physical Geography of India",
          "Climate & Monsoons",
          "Natural Resources",
          "Agriculture & Irrigation",
          "Industrial Development",
          "World Geography Basics"
        ],
        weight: "10-12%",
        difficulty: "Medium"
      },
      {
        subject: "History",
        topics: [
          "Ancient India",
          "Medieval India",
          "Modern India - Freedom Struggle",
          "Post-Independence India",
          "Art & Culture",
          "World History"
        ],
        weight: "12-15%",
        difficulty: "Medium"
      }
    ],
    "ssc-cgl": [
      {
        subject: "Quantitative Aptitude",
        topics: [
          "Number System & Simplification",
          "Percentage & Ratio",
          "Profit, Loss & Discount",
          "Time, Speed & Distance",
          "Mensuration & Geometry",
          "Algebra & Trigonometry",
          "Data Interpretation"
        ],
        weight: "25%",
        difficulty: "Medium"
      },
      {
        subject: "English Language",
        topics: [
          "Reading Comprehension",
          "Vocabulary & Synonyms",
          "Grammar & Sentence Correction",
          "Error Detection",
          "Idioms & Phrases",
          "One Word Substitution"
        ],
        weight: "25%",
        difficulty: "Easy"
      },
      {
        subject: "General Intelligence",
        topics: [
          "Analogy & Classification",
          "Series & Coding-Decoding",
          "Logical Reasoning",
          "Blood Relations",
          "Direction Sense",
          "Syllogisms"
        ],
        weight: "25%",
        difficulty: "Medium"
      }
    ],
    "gate-cs": [
      {
        subject: "Data Structures & Algorithms",
        topics: [
          "Arrays, Linked Lists, Stacks, Queues",
          "Trees - Binary, BST, AVL, B-Trees",
          "Graphs - BFS, DFS, Shortest Path",
          "Hashing & Hash Tables",
          "Sorting & Searching Algorithms",
          "Dynamic Programming",
          "Greedy Algorithms"
        ],
        weight: "15-18%",
        difficulty: "Hard"
      },
      {
        subject: "Operating Systems",
        topics: [
          "Process Management",
          "CPU Scheduling",
          "Memory Management",
          "Virtual Memory",
          "File Systems",
          "Deadlocks",
          "Synchronization"
        ],
        weight: "10-12%",
        difficulty: "Medium"
      },
      {
        subject: "Database Management",
        topics: [
          "ER Model & Relational Model",
          "SQL & Relational Algebra",
          "Normalization",
          "Transactions & Concurrency",
          "Indexing & Query Optimization"
        ],
        weight: "8-10%",
        difficulty: "Medium"
      }
    ],
    default: [
      {
        subject: "Core Subject 1",
        topics: [
          "Fundamental Concepts",
          "Advanced Topics",
          "Practice Problems",
          "Case Studies",
          "Applied Learning"
        ],
        weight: "30%",
        difficulty: "Medium" as const
      },
      {
        subject: "Core Subject 2",
        topics: [
          "Basic Theory",
          "Practical Applications",
          "Problem Solving",
          "Analysis Techniques"
        ],
        weight: "25%",
        difficulty: "Medium" as const
      }
    ]
  };
  
  return syllabusStructures[template.id] || syllabusStructures.default;
};

// Learning outcomes based on template
const getLearningOutcomes = (template: StudyTemplate | null) => {
  if (!template) return [];
  
  const outcomes: Record<string, string[]> = {
    "upsc-cse": [
      "Master all UPSC Prelims subjects with in-depth coverage",
      "Develop answer writing skills for Mains examination",
      "Build strong foundation in Current Affairs integration",
      "Learn effective time management for 3-stage examination",
      "Gain expertise in optional subject preparation",
      "Prepare comprehensively for Interview/Personality Test"
    ],
    "ssc-cgl": [
      "Achieve proficiency in Quantitative Aptitude shortcuts",
      "Master English grammar and vocabulary",
      "Develop strong reasoning and analytical skills",
      "Learn exam-specific strategies and time management",
      "Practice with previous year question papers"
    ],
    "gate-cs": [
      "Master all GATE CS core subjects",
      "Solve complex algorithmic problems efficiently",
      "Understand system design principles",
      "Prepare for PSU and M.Tech admissions",
      "Build strong problem-solving foundation"
    ],
    default: [
      "Comprehensive subject mastery",
      "Practical application skills",
      "Exam preparation strategies",
      "Time management techniques",
      "Regular progress tracking"
    ]
  };
  
  return outcomes[template.id] || outcomes.default;
};

// Study resources included
const getStudyResources = (template: StudyTemplate | null) => {
  return [
    { icon: FileText, label: "Detailed Notes", count: template?.topics || 50 },
    { icon: Target, label: "Practice Questions", count: (template?.topics || 50) * 10 },
    { icon: Award, label: "Mock Tests", count: Math.ceil((template?.subjects || 5) * 3) },
    { icon: TrendingUp, label: "Progress Analytics", count: 1 },
  ];
};

export const TemplatePreviewModal = ({
  template,
  open,
  onOpenChange,
  onAddTemplate,
  isAdded,
  isAdding,
}: TemplatePreviewModalProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const syllabus = getSampleSyllabus(template);
  const outcomes = getLearningOutcomes(template);
  const resources = getStudyResources(template);

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 border-b">
          <div className="flex items-start gap-4">
            <div className="text-4xl">{template.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {template.isPopular && (
                  <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
                    <Star className="w-3 h-3" />
                    Popular
                  </Badge>
                )}
                {template.isNew && (
                  <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    <Sparkles className="w-3 h-3" />
                    New
                  </Badge>
                )}
                <Badge variant="outline" className="capitalize">
                  {template.level.replace("-", " ")}
                </Badge>
              </div>
              <DialogTitle className="text-xl font-semibold mb-1">
                {template.name}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {template.description}
              </DialogDescription>
              
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {template.subjects} Subjects
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {template.topics} Topics
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {template.year}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  10K+ Users
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="border-b px-6">
            <TabsList className="h-12 bg-transparent p-0 gap-6">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="syllabus"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3"
              >
                Syllabus Preview
              </TabsTrigger>
              <TabsTrigger 
                value="outcomes"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3"
              >
                Learning Outcomes
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="p-6">
              <TabsContent value="overview" className="mt-0 space-y-6">
                {/* What you'll get */}
                <div>
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    What's Included
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {resources.map((resource, i) => (
                      <Card key={i} className="border-border/50">
                        <CardContent className="p-4 text-center">
                          <resource.icon className="w-8 h-8 mx-auto mb-2 text-primary/70" />
                          <div className="text-2xl font-bold text-foreground">{resource.count}+</div>
                          <div className="text-xs text-muted-foreground">{resource.label}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Quick highlights */}
                <div>
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Template Highlights
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium">Complete Syllabus Coverage</div>
                        <div className="text-xs text-muted-foreground">All topics mapped to latest exam pattern</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium">Progress Tracking</div>
                        <div className="text-xs text-muted-foreground">Visual analytics for each subject</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium">Structured Learning Path</div>
                        <div className="text-xs text-muted-foreground">Topic-wise organized content</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium">Regular Updates</div>
                        <div className="text-xs text-muted-foreground">Latest syllabus changes reflected</div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="syllabus" className="mt-0 space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Preview the complete syllabus structure you'll get with this template:
                </p>
                {syllabus.map((subject, index) => (
                  <Card key={index} className="border-border/50 overflow-hidden">
                    <CardHeader className="py-3 px-4 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-primary" />
                          {subject.subject}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              subject.difficulty === "Easy" && "border-emerald-500/30 text-emerald-600",
                              subject.difficulty === "Medium" && "border-amber-500/30 text-amber-600",
                              subject.difficulty === "Hard" && "border-red-500/30 text-red-600"
                            )}
                          >
                            {subject.difficulty}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {subject.weight}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid md:grid-cols-2 gap-2">
                        {subject.topics.map((topic, topicIdx) => (
                          <div 
                            key={topicIdx}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                          >
                            <ChevronRight className="w-3 h-3 text-primary/50" />
                            {topic}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="outcomes" className="mt-0 space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  By completing this template, you will achieve:
                </p>
                <div className="space-y-3">
                  {outcomes.map((outcome, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border border-primary/10"
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="text-sm text-foreground">{outcome}</span>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        {/* Footer */}
        <div className="border-t p-4 bg-muted/30 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{template.subjects}</span> subjects • 
            <span className="font-medium text-foreground ml-1">{template.topics}</span> topics to master
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button 
              onClick={onAddTemplate}
              disabled={isAdded || isAdding}
              className="gap-2"
            >
              {isAdded ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Already Added
                </>
              ) : isAdding ? (
                "Adding..."
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Template
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplatePreviewModal;
