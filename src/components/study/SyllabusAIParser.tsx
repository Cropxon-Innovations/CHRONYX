import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Upload,
  FileText,
  Loader2,
  Sparkles,
  BookOpen,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit2,
  Brain,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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

interface ParsedTopic {
  id: string;
  name: string;
  estimatedHours: number;
  selected: boolean;
}

interface ParsedChapter {
  id: string;
  name: string;
  topics: ParsedTopic[];
  expanded: boolean;
}

interface ParsedSyllabus {
  subject: string;
  chapters: ParsedChapter[];
}

const SUBJECTS = ["Mathematics", "Programming", "Physics", "Chemistry", "Biology", "History", "Literature", "Language", "Computer Science", "Other"];

export const SyllabusAIParser = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "parsing" | "review" | "saving">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const [parsedData, setParsedData] = useState<ParsedSyllabus | null>(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [parseProgress, setParseProgress] = useState(0);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    
    // Read file content
    if (selectedFile.type === "text/plain" || selectedFile.name.endsWith(".txt") || selectedFile.name.endsWith(".md")) {
      const text = await selectedFile.text();
      setTextContent(text);
    } else if (selectedFile.type === "application/pdf") {
      // PDF parsing will be done by edge function
      setTextContent("[PDF content will be extracted]");
    }
  };

  const parseSyllabusMutation = useMutation({
    mutationFn: async () => {
      setStep("parsing");
      setParseProgress(20);

      let contentToProcess = textContent;

      // For PDFs, extract text first using edge function
      if (file?.type === "application/pdf") {
        setParseProgress(30);
        
        // Upload file temporarily
        const filePath = `temp/${user!.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("syllabus")
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from("syllabus")
          .getPublicUrl(filePath);

        // Call edge function to extract and parse
        const { data, error } = await supabase.functions.invoke("parse-syllabus", {
          body: { 
            fileUrl: urlData.publicUrl,
            fileName: file.name,
            subject: selectedSubject || "General",
          },
        });

        if (error) throw error;
        setParseProgress(80);
        
        // Clean up temp file
        await supabase.storage.from("syllabus").remove([filePath]);
        
        return data as ParsedSyllabus;
      } else {
        // Parse text content with edge function
        setParseProgress(50);
        
        const { data, error } = await supabase.functions.invoke("parse-syllabus", {
          body: { 
            textContent: contentToProcess,
            subject: selectedSubject || "General",
          },
        });

        if (error) throw error;
        setParseProgress(90);
        
        return data as ParsedSyllabus;
      }
    },
    onSuccess: (data) => {
      setParseProgress(100);
      setParsedData(data);
      setStep("review");
    },
    onError: (error) => {
      console.error("Parse error:", error);
      toast.error("Failed to parse syllabus. Try a different format.");
      setStep("upload");
    },
  });

  const saveSyllabusMutation = useMutation({
    mutationFn: async () => {
      if (!parsedData || !user) throw new Error("No data to save");
      
      setStep("saving");
      const topicsToInsert: any[] = [];

      parsedData.chapters.forEach(chapter => {
        chapter.topics.filter(t => t.selected).forEach(topic => {
          topicsToInsert.push({
            user_id: user.id,
            subject: parsedData.subject,
            chapter_name: chapter.name,
            topic_name: topic.name,
            estimated_hours: topic.estimatedHours,
            priority: 5,
            is_completed: false,
            status: "pending",
          });
        });
      });

      if (topicsToInsert.length === 0) {
        throw new Error("No topics selected");
      }

      const { error } = await supabase
        .from("syllabus_topics")
        .insert(topicsToInsert);

      if (error) throw error;
      
      return topicsToInsert.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["syllabus-topics"] });
      toast.success(`Added ${count} topics to your syllabus!`);
      resetDialog();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save topics");
      setStep("review");
    },
  });

  const resetDialog = () => {
    setOpen(false);
    setStep("upload");
    setFile(null);
    setTextContent("");
    setParsedData(null);
    setSelectedSubject("");
    setParseProgress(0);
  };

  const toggleChapter = (chapterId: string) => {
    if (!parsedData) return;
    setParsedData({
      ...parsedData,
      chapters: parsedData.chapters.map(ch =>
        ch.id === chapterId ? { ...ch, expanded: !ch.expanded } : ch
      ),
    });
  };

  const toggleTopic = (chapterId: string, topicId: string) => {
    if (!parsedData) return;
    setParsedData({
      ...parsedData,
      chapters: parsedData.chapters.map(ch =>
        ch.id === chapterId
          ? {
              ...ch,
              topics: ch.topics.map(t =>
                t.id === topicId ? { ...t, selected: !t.selected } : t
              ),
            }
          : ch
      ),
    });
  };

  const toggleAllInChapter = (chapterId: string, selected: boolean) => {
    if (!parsedData) return;
    setParsedData({
      ...parsedData,
      chapters: parsedData.chapters.map(ch =>
        ch.id === chapterId
          ? { ...ch, topics: ch.topics.map(t => ({ ...t, selected })) }
          : ch
      ),
    });
  };

  const updateTopicHours = (chapterId: string, topicId: string, hours: number) => {
    if (!parsedData) return;
    setParsedData({
      ...parsedData,
      chapters: parsedData.chapters.map(ch =>
        ch.id === chapterId
          ? {
              ...ch,
              topics: ch.topics.map(t =>
                t.id === topicId ? { ...t, estimatedHours: hours } : t
              ),
            }
          : ch
      ),
    });
  };

  const selectedCount = parsedData?.chapters.reduce(
    (acc, ch) => acc + ch.topics.filter(t => t.selected).length,
    0
  ) || 0;

  const totalCount = parsedData?.chapters.reduce(
    (acc, ch) => acc + ch.topics.length,
    0
  ) || 0;

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" className="gap-2">
        <Brain className="w-4 h-4" />
        AI Parse Syllabus
      </Button>

      <Dialog open={open} onOpenChange={(o) => o ? setOpen(true) : resetDialog()}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Syllabus Parser
            </DialogTitle>
            <DialogDescription>
              Upload a PDF, text file, or paste your syllabus content to automatically extract topics
            </DialogDescription>
          </DialogHeader>

          {/* Upload Step */}
          {step === "upload" && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload Area */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
                  file ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,text/plain"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium text-foreground">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setTextContent("");
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-foreground font-medium">Drop syllabus file here</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Supports PDF, TXT, Markdown files
                    </p>
                  </>
                )}
              </div>

              {/* Or paste content */}
              <div className="relative">
                <div className="absolute inset-x-0 top-1/2 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or paste content</span>
                </div>
              </div>

              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste your syllabus content here...&#10;&#10;Example:&#10;Chapter 1: Introduction&#10;- Topic 1.1: Basic Concepts&#10;- Topic 1.2: Getting Started"
                className="w-full h-32 p-3 rounded-lg border border-border bg-card text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              />

              <DialogFooter>
                <Button variant="outline" onClick={resetDialog}>Cancel</Button>
                <Button
                  onClick={() => parseSyllabusMutation.mutate()}
                  disabled={!selectedSubject || (!file && !textContent.trim())}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Parse with AI
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Parsing Step */}
          {step === "parsing" && (
            <div className="py-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">Analyzing syllabus...</p>
              <p className="text-sm text-muted-foreground mb-4">
                AI is extracting chapters and topics
              </p>
              <Progress value={parseProgress} className="w-48 mx-auto" />
            </div>
          )}

          {/* Review Step */}
          {step === "review" && parsedData && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span className="font-medium">{parsedData.subject}</span>
                </div>
                <Badge variant="secondary">
                  {selectedCount}/{totalCount} topics selected
                </Badge>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {parsedData.chapters.map((chapter) => {
                  const selectedInChapter = chapter.topics.filter(t => t.selected).length;
                  const allSelected = selectedInChapter === chapter.topics.length;
                  
                  return (
                    <Collapsible
                      key={chapter.id}
                      open={chapter.expanded}
                      onOpenChange={() => toggleChapter(chapter.id)}
                    >
                      <div className="rounded-lg border border-border overflow-hidden">
                        <CollapsibleTrigger className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
                          {chapter.expanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={(checked) => {
                              toggleAllInChapter(chapter.id, !!checked);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="flex-1 text-left font-medium">{chapter.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {selectedInChapter}/{chapter.topics.length}
                          </Badge>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="border-t border-border divide-y divide-border">
                            {chapter.topics.map((topic) => (
                              <div
                                key={topic.id}
                                className={cn(
                                  "flex items-center gap-3 p-3 pl-10",
                                  topic.selected && "bg-primary/5"
                                )}
                              >
                                <Checkbox
                                  checked={topic.selected}
                                  onCheckedChange={() => toggleTopic(chapter.id, topic.id)}
                                />
                                <span className={cn(
                                  "flex-1 text-sm",
                                  !topic.selected && "text-muted-foreground"
                                )}>
                                  {topic.name}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    value={topic.estimatedHours}
                                    onChange={(e) => updateTopicHours(chapter.id, topic.id, parseFloat(e.target.value) || 1)}
                                    className="w-16 h-7 text-xs text-center"
                                    min="0.5"
                                    step="0.5"
                                  />
                                  <span className="text-xs text-muted-foreground">hrs</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>

              <DialogFooter className="border-t border-border pt-4">
                <Button variant="outline" onClick={() => setStep("upload")}>
                  Back
                </Button>
                <Button
                  onClick={() => saveSyllabusMutation.mutate()}
                  disabled={selectedCount === 0}
                  className="gap-2"
                >
                  <Check className="w-4 h-4" />
                  Import {selectedCount} Topics
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Saving Step */}
          {step === "saving" && (
            <div className="py-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">Saving topics...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
