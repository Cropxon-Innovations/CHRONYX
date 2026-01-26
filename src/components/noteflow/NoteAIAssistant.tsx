import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Wand2,
  Sparkles,
  FileText,
  MessageSquare,
  Lightbulb,
  List,
  RefreshCw,
  Zap,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIAction {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  prompt: string;
}

const AI_ACTIONS: AIAction[] = [
  {
    id: "summarize",
    label: "Summarize",
    description: "Create a concise summary",
    icon: FileText,
    prompt: "Summarize the following note content in a clear, concise manner. Focus on key points and main ideas.",
  },
  {
    id: "expand",
    label: "Expand",
    description: "Add more detail",
    icon: Sparkles,
    prompt: "Expand on the following content by adding more detail, examples, and explanations while maintaining the original tone.",
  },
  {
    id: "simplify",
    label: "Simplify",
    description: "Make it easier to understand",
    icon: Lightbulb,
    prompt: "Simplify the following content to make it easier to understand. Use simple language and shorter sentences.",
  },
  {
    id: "questions",
    label: "Generate Questions",
    description: "Create study questions",
    icon: MessageSquare,
    prompt: "Generate 5-7 thoughtful questions based on the following content that could be used for studying or discussion.",
  },
  {
    id: "outline",
    label: "Create Outline",
    description: "Organize into sections",
    icon: List,
    prompt: "Create a structured outline from the following content with clear headings and subpoints.",
  },
  {
    id: "rewrite",
    label: "Rewrite",
    description: "Improve clarity & flow",
    icon: RefreshCw,
    prompt: "Rewrite the following content to improve clarity, flow, and readability while preserving the core message.",
  },
];

interface NoteAIAssistantProps {
  noteContent: string;
  onApplyResult?: (result: string) => void;
}

export const NoteAIAssistant = ({
  noteContent,
  onApplyResult,
}: NoteAIAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<AIAction | null>(null);
  const [result, setResult] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const { toast } = useToast();

  const handleAction = async (action: AIAction) => {
    if (!noteContent.trim()) {
      toast({
        title: "No content",
        description: "Please add some content to your note first.",
        variant: "destructive",
      });
      return;
    }

    setSelectedAction(action);
    setIsLoading(true);
    setResult("");

    try {
      const { data, error } = await supabase.functions.invoke("analyze-note", {
        body: {
          content: noteContent,
          action: action.id,
          prompt: action.prompt,
        },
      });

      if (error) throw error;

      setResult(data?.result || "No result generated.");
    } catch (error) {
      console.error("AI error:", error);
      toast({
        title: "AI Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomPrompt = async () => {
    if (!customPrompt.trim() || !noteContent.trim()) return;

    setIsLoading(true);
    setSelectedAction(null);
    setResult("");

    try {
      const { data, error } = await supabase.functions.invoke("analyze-note", {
        body: {
          content: noteContent,
          action: "custom",
          prompt: customPrompt,
        },
      });

      if (error) throw error;

      setResult(data?.result || "No result generated.");
    } catch (error) {
      console.error("AI error:", error);
      toast({
        title: "AI Error",
        description: "Failed to process your request.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    onApplyResult?.(result);
    setIsOpen(false);
    toast({ title: "Applied", description: "AI result applied to your note." });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-primary hover:text-primary"
        >
          <Wand2 className="w-4 h-4" />
          <span className="hidden sm:inline">AI Assist</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Wand2 className="w-5 h-5 text-primary" />
            </div>
            AI Assistant
          </SheetTitle>
          <SheetDescription>
            Use AI to enhance, summarize, or transform your note
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {AI_ACTIONS.map((action) => {
                const Icon = action.icon;
                const isSelected = selectedAction?.id === action.id;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action)}
                    disabled={isLoading}
                    className={cn(
                      "flex flex-col items-start gap-1 p-3 rounded-xl border text-left",
                      "transition-all duration-200",
                      "hover:bg-accent hover:border-primary/30",
                      isSelected && "bg-primary/5 border-primary/50",
                      isLoading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{action.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {action.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Prompt */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Custom Prompt
            </h3>
            <div className="space-y-2">
              <Textarea
                placeholder="Ask AI anything about your note..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <Button
                onClick={handleCustomPrompt}
                disabled={isLoading || !customPrompt.trim()}
                size="sm"
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Run Custom Prompt
              </Button>
            </div>
          </div>

          {/* Result */}
          {(result || isLoading) && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Result</h3>
                {result && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="w-3 h-3 mr-1" />
                      ) : (
                        <Copy className="w-3 h-3 mr-1" />
                      )}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                    {onApplyResult && (
                      <Button
                        variant="default"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={handleApply}
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        Apply
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div
                className={cn(
                  "p-4 rounded-xl border bg-muted/30",
                  "min-h-[120px] max-h-[300px] overflow-y-auto"
                )}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Processing...</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {result}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
