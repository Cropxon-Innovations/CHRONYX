import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Plus, MessageSquare, Filter, Search, Building2, 
  Tag, ChevronDown, Eye, EyeOff, Check, X, Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  useTechInterviewQuestions, 
  useTechTracks,
  useCreateInterviewQuestion,
  TechInterviewQuestion 
} from "@/hooks/useTechCareer";

const difficultyColors: Record<string, string> = {
  easy: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  hard: 'bg-red-500/10 text-red-600 border-red-500/30',
  expert: 'bg-violet-500/10 text-violet-600 border-violet-500/30',
};

export default function TechInterviewPrep() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedTrack, setSelectedTrack] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    question: '',
    hint: '',
    answer: '',
    difficulty: 'medium',
    company_tags: '',
    custom_tags: '',
  });

  const { data: questions, isLoading } = useTechInterviewQuestions({
    trackId: selectedTrack === "all" ? undefined : selectedTrack || undefined,
    difficulty: selectedDifficulty === "all" ? undefined : selectedDifficulty || undefined,
  });
  const { data: tracks } = useTechTracks();
  const createQuestion = useCreateInterviewQuestion();

  const filteredQuestions = questions?.filter(q => 
    q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.company_tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSubmit = () => {
    createQuestion.mutate({
      question: formData.question,
      hint: formData.hint || null,
      answer: formData.answer || null,
      difficulty: formData.difficulty,
      company_tags: formData.company_tags.split(',').map(s => s.trim()).filter(Boolean),
      custom_tags: formData.custom_tags.split(',').map(s => s.trim()).filter(Boolean),
      track_id: selectedTrack || null,
      module_id: null,
      topic_id: null,
      is_public: false,
      frequency: 'common',
    });
    setIsDialogOpen(false);
    setFormData({
      question: '',
      hint: '',
      answer: '',
      difficulty: 'medium',
      company_tags: '',
      custom_tags: '',
    });
  };

  const toggleAnswer = (id: string) => {
    setShowAnswers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Interview Question Bank</h2>
          <p className="text-sm text-muted-foreground">
            Practice and master interview questions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Interview Question</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Question</Label>
                <Textarea
                  value={formData.question}
                  onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="What is the difference between...?"
                  className="min-h-[80px]"
                />
              </div>
              <div>
                <Label>Hint (optional)</Label>
                <Input
                  value={formData.hint}
                  onChange={(e) => setFormData(prev => ({ ...prev, hint: e.target.value }))}
                  placeholder="Think about..."
                />
              </div>
              <div>
                <Label>Answer (optional)</Label>
                <Textarea
                  value={formData.answer}
                  onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                  placeholder="The answer is..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Difficulty</Label>
                  <Select 
                    value={formData.difficulty} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, difficulty: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Company Tags</Label>
                  <Input
                    value={formData.company_tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_tags: e.target.value }))}
                    placeholder="Google, Amazon..."
                  />
                </div>
              </div>
              <div>
                <Label>Custom Tags</Label>
                <Input
                  value={formData.custom_tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_tags: e.target.value }))}
                  placeholder="system-design, coding..."
                />
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={!formData.question}>
                Add Question
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions or company..."
            className="pl-9"
          />
        </div>
        <Select value={selectedTrack} onValueChange={setSelectedTrack}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Tracks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tracks</SelectItem>
            {tracks?.map(track => (
              <SelectItem key={track.id} value={track.id}>{track.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
            <SelectItem value="expert">Expert</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Questions List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-20" />
            </Card>
          ))}
        </div>
      ) : filteredQuestions?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-1">No Questions Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? 'Try a different search' : 'Start building your question bank'}
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Question
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-3 pr-4">
            {filteredQuestions?.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card className="hover:shadow-sm transition-all">
                  <Collapsible 
                    open={expandedQuestion === question.id}
                    onOpenChange={() => setExpandedQuestion(
                      expandedQuestion === question.id ? null : question.id
                    )}
                  >
                    <CollapsibleTrigger asChild>
                      <CardContent className="p-4 cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm leading-relaxed">
                              {question.question}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge 
                                variant="outline" 
                                className={`text-xs capitalize ${difficultyColors[question.difficulty]}`}
                              >
                                {question.difficulty}
                              </Badge>
                              {question.company_tags?.slice(0, 3).map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  <Building2 className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                              {question.is_system && (
                                <Badge variant="outline" className="text-xs">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  System
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${
                            expandedQuestion === question.id ? 'rotate-180' : ''
                          }`} />
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-0 border-t">
                        {question.hint && (
                          <div className="mt-3 p-3 bg-amber-500/5 rounded-lg border border-amber-500/20">
                            <p className="text-sm text-amber-700 dark:text-amber-400">
                              <span className="font-medium">💡 Hint:</span> {question.hint}
                            </p>
                          </div>
                        )}

                        {question.answer && (
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAnswer(question.id);
                              }}
                              className="gap-2 mb-2"
                            >
                              {showAnswers[question.id] ? (
                                <>
                                  <EyeOff className="h-4 w-4" />
                                  Hide Answer
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4" />
                                  Show Answer
                                </>
                              )}
                            </Button>
                            {showAnswers[question.id] && (
                              <div className="p-3 bg-muted/50 rounded-lg">
                                <p className="text-sm whitespace-pre-wrap">{question.answer}</p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-4">
                          <Button size="sm" variant="outline" className="gap-1">
                            <X className="h-3 w-3" />
                            Unknown
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1">
                            <Check className="h-3 w-3" />
                            Known
                          </Button>
                          <Button size="sm" variant="default" className="gap-1 ml-auto">
                            <Sparkles className="h-3 w-3" />
                            Mastered
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
