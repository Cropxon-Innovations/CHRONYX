import { useState } from "react";
import { Sparkles, Wand2, FileText, Lightbulb, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface Chapter {
  id: string;
  title: string;
  content: any;
  word_count: number;
}

interface AIAssistPanelProps {
  chapter: Chapter | null;
  onApplyChange: (content: any) => void;
}

const AIAssistPanel = ({ chapter, onApplyChange }: AIAssistPanelProps) => {
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState("");
  const { toast } = useToast();

  const extractText = (content: any): string => {
    if (!content || !content.content) return "";
    
    return content.content.map((node: any) => {
      if (node.content) {
        return node.content.map((c: any) => c.text || "").join("");
      }
      return "";
    }).join("\n\n");
  };

  const quickActions = [
    { 
      icon: FileText, 
      label: "Summarize", 
      prompt: "Summarize this chapter concisely, capturing the key points and main ideas."
    },
    { 
      icon: Wand2, 
      label: "Rewrite", 
      prompt: "Rewrite this chapter to improve clarity, flow, and engagement while maintaining the core message."
    },
    { 
      icon: Lightbulb, 
      label: "Suggest Ideas", 
      prompt: "Suggest ideas to expand or improve this chapter, including potential topics to explore or examples to add."
    },
    { 
      icon: RefreshCw, 
      label: "Continue", 
      prompt: "Continue writing this chapter naturally, maintaining the same style and tone."
    },
  ];

  const handleQuickAction = async (actionPrompt: string) => {
    if (!chapter) {
      toast({ title: "No chapter selected", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    setResult("");

    try {
      const text = extractText(chapter.content);
      
      // Simulate AI response (in production, this would call an AI endpoint)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockResponses: Record<string, string> = {
        "Summarize this chapter": `**Summary of "${chapter.title}"**\n\nThis chapter explores the main themes and ideas presented in approximately ${chapter.word_count} words. Key points include the introduction of core concepts and their practical applications.\n\n*Generated summary - in production, this would be AI-generated based on actual content.*`,
        "Rewrite this chapter": `**Rewritten version:**\n\nThe content has been restructured for improved clarity and engagement. The core message remains intact while the prose has been polished for better readability.\n\n*In production, this would show actual rewritten content.*`,
        "Suggest ideas": `**Suggestions for "${chapter.title}":**\n\n1. **Add examples** - Include real-world examples to illustrate key concepts\n2. **Expand on details** - Some sections could benefit from more depth\n3. **Add transitions** - Improve flow between paragraphs\n4. **Include quotes** - Add relevant quotes from experts\n5. **Add visual elements** - Consider diagrams or images`,
        "Continue writing": `**Continuation:**\n\nBuilding upon the previous points, we can explore additional aspects of this topic. The narrative naturally extends into related themes that complement the existing content.\n\n*In production, AI would generate natural continuation based on context.*`,
      };

      const responseKey = Object.keys(mockResponses).find(key => 
        actionPrompt.toLowerCase().includes(key.toLowerCase())
      ) || "Summarize this chapter";
      
      setResult(mockResponses[responseKey]);
    } catch (error) {
      toast({ title: "AI processing failed", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomPrompt = () => {
    if (prompt.trim()) {
      handleQuickAction(prompt);
    }
  };

  if (!chapter) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Select a chapter to use AI assistance</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h3 className="font-medium text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          AI Assist
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Get help with writing, editing, and ideas
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Quick Actions */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-auto py-2"
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={isProcessing}
                >
                  <action.icon className="w-4 h-4" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Prompt */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Custom Request</p>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask AI to help with..."
              className="text-sm resize-none"
              rows={3}
            />
            <Button
              size="sm"
              className="w-full mt-2"
              onClick={handleCustomPrompt}
              disabled={!prompt.trim() || isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>

          {/* Result */}
          {result && (
            <div className="border border-border rounded-lg p-3 bg-muted/30">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">AI Response</p>
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                {result}
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="flex-1">
                  Copy
                </Button>
                <Button size="sm" className="flex-1">
                  Apply to Chapter
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default AIAssistPanel;
