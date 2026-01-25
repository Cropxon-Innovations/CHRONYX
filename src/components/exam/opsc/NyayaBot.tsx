import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, Sparkles, Send, BookOpen, Brain, 
  Lightbulb, HelpCircle, FileText, RotateCcw, 
  Loader2, Bot, User, ChevronRight, Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  context?: {
    topic?: string;
    subject?: string;
    type?: "explanation" | "mcq" | "answer_structure" | "summary" | "general";
  };
}

const QUICK_PROMPTS = [
  { icon: Lightbulb, label: "Explain simply", prompt: "Explain this concept in simple terms with examples" },
  { icon: Brain, label: "Generate MCQs", prompt: "Generate 3 MCQs on this topic with answers" },
  { icon: FileText, label: "Answer structure", prompt: "Provide Mains answer structure for this topic" },
  { icon: BookOpen, label: "Key points", prompt: "List the most important points for revision" },
];

const SUGGESTED_TOPICS = [
  "Indian Polity - Fundamental Rights",
  "Geography - Monsoon System",
  "History - Quit India Movement",
  "Economics - Fiscal Policy",
  "Odisha GK - Rivers & Dams",
];

export const NyayaBot: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch chat history
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["nyaya-chat", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nyaya_chat_history")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: true })
        .limit(50);
      
      if (error) throw error;
      return data.map((msg: any) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: new Date(msg.created_at),
        context: msg.context_data,
      })) as ChatMessage[];
    },
    enabled: !!user?.id,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      // Save user message
      const { error: userError } = await supabase
        .from("nyaya_chat_history")
        .insert({
          user_id: user!.id,
          role: "user",
          content: userMessage,
          context_data: currentTopic ? { topic: currentTopic } : null,
        });
      
      if (userError) throw userError;

      // Simulate AI response (in production, this would call the edge function)
      setIsTyping(true);
      
      // Call the actual AI endpoint
      const response = await supabase.functions.invoke("chronyx-bot", {
        body: {
          message: userMessage,
          context: {
            examType: "OPSC",
            currentTopic,
            botName: "Nyāya",
            systemPrompt: `You are Nyāya, an expert AI study assistant for OPSC OAS/OFS exam preparation. 
            You provide accurate, concise, and helpful answers about Indian Polity, History, Geography, 
            Economy, Science, Ethics, and Odisha-specific topics. Always cite sources when possible.
            Format answers clearly with bullet points when appropriate.`
          }
        }
      });

      setIsTyping(false);

      const aiResponse = response.data?.response || 
        "I understand your question. Let me provide you with a structured answer based on the OPSC syllabus...";

      // Save AI response
      const { error: aiError } = await supabase
        .from("nyaya_chat_history")
        .insert({
          user_id: user!.id,
          role: "assistant",
          content: aiResponse,
          context_data: currentTopic ? { topic: currentTopic } : null,
        });

      if (aiError) throw aiError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nyaya-chat"] });
      setInput("");
    },
    onError: (error) => {
      setIsTyping(false);
      toast.error("Failed to send message");
      console.error(error);
    },
  });

  const handleSend = () => {
    if (!input.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(input.trim());
  };

  const handleQuickPrompt = (prompt: string) => {
    const fullPrompt = currentTopic 
      ? `${prompt} about "${currentTopic}"`
      : prompt;
    setInput(fullPrompt);
    inputRef.current?.focus();
  };

  const handleTopicSelect = (topic: string) => {
    setCurrentTopic(topic);
    setInput(`Tell me about ${topic}`);
    inputRef.current?.focus();
  };

  const clearHistory = async () => {
    const { error } = await supabase
      .from("nyaya_chat_history")
      .delete()
      .eq("user_id", user?.id);
    
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["nyaya-chat"] });
      toast.success("Chat history cleared");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-border/50 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 ring-2 ring-primary/20">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Nyāya
                  <Badge variant="secondary" className="text-xs font-normal">
                    AI Study Guide
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  The Guide of Truth • OPSC Exam Expert
                </p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearHistory}
                className="text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Current Topic Context */}
      {currentTopic && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Current Topic:</span>
                <span className="font-medium">{currentTopic}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCurrentTopic(null)}
                className="h-7 text-xs"
              >
                Change
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Messages */}
      <Card className="border-border/50">
        <ScrollArea className="h-[400px] md:h-[450px]" ref={scrollRef}>
          <CardContent className="p-4 space-y-4">
            {messages.length === 0 && !isLoading ? (
              <div className="text-center py-8 space-y-6">
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium">Start a Conversation</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Ask me about any OPSC topic. I can explain concepts, generate MCQs, 
                    and help structure your Mains answers.
                  </p>
                </div>

                {/* Suggested Topics */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Suggested topics:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {SUGGESTED_TOPICS.map((topic) => (
                      <Button
                        key={topic}
                        variant="outline"
                        size="sm"
                        onClick={() => handleTopicSelect(topic)}
                        className="text-xs h-8"
                      >
                        <ChevronRight className="w-3 h-3 mr-1" />
                        {topic}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={cn(
                        "text-xs mt-1",
                        msg.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {msg.role === "user" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </ScrollArea>

        {/* Quick Prompts */}
        <div className="border-t border-border/50 px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {QUICK_PROMPTS.map((item) => (
              <Button
                key={item.label}
                variant="outline"
                size="sm"
                onClick={() => handleQuickPrompt(item.prompt)}
                className="flex-shrink-0 text-xs gap-1.5 h-8"
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-border/50 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about any OPSC topic..."
              className="flex-1"
              disabled={sendMessageMutation.isPending}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!input.trim() || sendMessageMutation.isPending}
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>

      {/* Capabilities */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Brain, label: "Concept Explanations", desc: "Simple & clear" },
          { icon: HelpCircle, label: "MCQ Practice", desc: "Topic-wise questions" },
          { icon: FileText, label: "Answer Writing", desc: "Mains structure" },
          { icon: Zap, label: "Quick Revision", desc: "Key points" },
        ].map((cap) => (
          <Card key={cap.label} className="border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-3 text-center">
              <cap.icon className="w-5 h-5 mx-auto text-primary mb-2" />
              <p className="text-xs font-medium">{cap.label}</p>
              <p className="text-xs text-muted-foreground">{cap.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
