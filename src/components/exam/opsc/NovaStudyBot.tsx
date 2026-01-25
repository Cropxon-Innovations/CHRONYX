import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, Sparkles, Send, BookOpen, Brain, 
  Lightbulb, HelpCircle, FileText, RotateCcw, 
  Loader2, Bot, User, ChevronRight, Zap, Globe, AlertCircle,
  Trash2, Lock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isExternal?: boolean;
}

interface NovaStudyBotProps {
  examType?: string;
  subjects?: string[];
  currentTopic?: string;
  allowedTopics?: string[];
  inline?: boolean;
  onClose?: () => void;
}

const QUICK_PROMPTS = [
  { icon: Lightbulb, label: "Explain simply", prompt: "Explain this concept in simple terms with examples" },
  { icon: Brain, label: "Generate MCQs", prompt: "Generate 3 MCQs on this topic with answers" },
  { icon: FileText, label: "Answer structure", prompt: "Provide Mains answer structure for this topic" },
  { icon: BookOpen, label: "Key points", prompt: "List the most important points for revision" },
];

const STUDY_KEYWORDS = [
  "exam", "syllabus", "mains", "prelims", "preparation", "study", "revision",
  "mcq", "question", "answer", "explain", "concept", "important", "topics",
  "history", "geography", "polity", "economy", "science", "ethics", "odisha",
  "upsc", "opsc", "psc", "civil services", "ias", "oas"
];

const isTopicRelevant = (query: string): boolean => {
  const queryLower = query.toLowerCase();
  return STUDY_KEYWORDS.some(keyword => queryLower.includes(keyword));
};

export const NovaStudyBot: React.FC<NovaStudyBotProps> = ({
  examType = "OPSC",
  subjects = [],
  currentTopic,
  allowedTopics = [],
  inline = false,
  onClose,
}) => {
  const { user } = useAuth();
  const { getCurrentPlan } = useSubscription();
  const planType = getCurrentPlan();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [activeTopic, setActiveTopic] = useState<string | null>(currentTopic || null);
  const [isTyping, setIsTyping] = useState(false);
  const [isExternalMode, setIsExternalMode] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const canRetainChat = planType === 'pro' || planType === 'premium';

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Send message
  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    const isRelevant = isTopicRelevant(input);
    setIsExternalMode(!isRelevant);

    try {
      const systemPrompt = !isRelevant
        ? `You are NOVA, Chronyx's intelligent AI assistant. The user is asking about something outside their exam syllabus. 
           Provide a helpful, accurate response but remind them this is a general query outside their ${examType} preparation.`
        : `You are NOVA Study, an expert AI assistant for ${examType} exam preparation within Chronyx.
           User's subjects: ${subjects.join(", ") || "General Studies"}
           Current topic focus: ${activeTopic || "General"}
           
           Always be structured, use bullet points, cite relevant articles when applicable.`;

      const response = await supabase.functions.invoke("chronyx-bot", {
        body: {
          message: input.trim(),
          context: {
            examType,
            currentTopic: activeTopic,
            botName: "NOVA Study",
            isExternal: !isRelevant,
            systemPrompt
          }
        }
      });

      const aiContent = response.data?.response || "I'm here to help with your exam preparation. Could you please rephrase your question?";

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiContent,
        timestamp: new Date(),
        isExternal: !isRelevant,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast.error("Failed to get response");
      console.error(error);
    } finally {
      setIsTyping(false);
      setIsExternalMode(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success("Chat cleared");
  };

  const handleQuickPrompt = (prompt: string) => {
    const fullPrompt = activeTopic ? `${prompt} about "${activeTopic}"` : prompt;
    setInput(fullPrompt);
    inputRef.current?.focus();
  };

  const SUGGESTED_TOPICS = subjects.length > 0 
    ? subjects.slice(0, 5)
    : ["Indian Polity", "Geography", "History", "Economics", "Current Affairs"];

  // Inline compact mode
  if (inline) {
    return (
      <Card className="border-zinc-700 bg-zinc-900 shadow-lg">
        <CardHeader className="pb-2 pt-3 px-4 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/20">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium text-sm text-white">NOVA Study</span>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-700"
                onClick={clearChat}
                title="Clear chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
              {onClose && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-white" onClick={onClose}>
                  ×
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 pt-0 bg-zinc-900">
          {/* Messages */}
          {messages.length > 0 && (
            <ScrollArea className="h-40 my-2">
              <div className="space-y-2 pr-2">
                {messages.slice(-5).map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "text-xs p-2 rounded-lg",
                      msg.role === "user" 
                        ? "bg-primary/20 ml-8 text-white" 
                        : msg.isExternal 
                          ? "bg-amber-500/10 border border-amber-500/20 text-amber-100"
                          : "bg-zinc-800 text-zinc-200"
                    )}
                  >
                    {msg.isExternal && (
                      <span className="text-amber-500 text-[10px] flex items-center gap-1 mb-1">
                        <Globe className="w-3 h-3" /> General Agent
                      </span>
                    )}
                    <p className="line-clamp-3 whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          
          {/* Empty state */}
          {messages.length === 0 && (
            <div className="py-4 text-center">
              <p className="text-xs text-zinc-400">Ask any doubt about your exam preparation</p>
            </div>
          )}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-zinc-400 my-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              {isExternalMode ? "Searching with NOVA General..." : "NOVA is thinking..."}
            </div>
          )}
          
          {/* Retention notice */}
          {!canRetainChat && messages.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-zinc-500 mb-2">
              <Lock className="w-3 h-3" />
              Chat not retained. Upgrade to Pro to save conversations.
            </div>
          )}

          {/* Input */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a doubt..."
              className="flex-1 h-8 text-sm bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              disabled={isTyping}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-8 w-8 bg-primary hover:bg-primary/90" 
              disabled={!input.trim() || isTyping}
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Full mode
  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-border/50 bg-gradient-to-br from-zinc-900/50 via-background to-background">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-zinc-800 ring-2 ring-zinc-700">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  NOVA Study
                  <Badge variant="secondary" className="text-xs font-normal bg-zinc-800">
                    AI Study Assistant
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Your intelligent {examType} exam preparation guide
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearChat}
                  className="text-muted-foreground hover:text-foreground gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Chat
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Retention Notice */}
      {!canRetainChat && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-sm">
              <Lock className="w-4 h-4 text-amber-600" />
              <span className="text-amber-600">
                Chat history is not retained. <span className="font-medium">Upgrade to Pro</span> to save conversations.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Topic Context */}
      {activeTopic && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Current Topic:</span>
                <span className="font-medium">{activeTopic}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setActiveTopic(null)}
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
            {messages.length === 0 ? (
              <div className="text-center py-8 space-y-6">
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium">Start a Conversation</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Ask me about any {examType} topic. I can explain concepts, generate MCQs, 
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
                        onClick={() => {
                          setActiveTopic(topic);
                          setInput(`Tell me about ${topic}`);
                          inputRef.current?.focus();
                        }}
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
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                        msg.isExternal ? "bg-amber-500/10" : "bg-zinc-800"
                      )}>
                        {msg.isExternal ? (
                          <Globe className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-primary" />
                        )}
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : msg.isExternal 
                            ? "bg-amber-500/10 border border-amber-500/20"
                            : "bg-muted"
                      )}
                    >
                      {msg.isExternal && msg.role === "assistant" && (
                        <p className="text-xs text-amber-600 mb-1 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          NOVA General Agent
                        </p>
                      )}
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
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                      isExternalMode ? "bg-amber-500/10" : "bg-zinc-800"
                    )}>
                      {isExternalMode ? (
                        <Globe className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className={cn(
                      "rounded-2xl px-4 py-3",
                      isExternalMode ? "bg-amber-500/10" : "bg-muted"
                    )}>
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
              placeholder={`Ask about ${examType} topics...`}
              className="flex-1"
              disabled={isTyping}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!input.trim() || isTyping}
            >
              {isTyping ? (
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
          { icon: Globe, label: "General Queries", desc: "Via NOVA General" },
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

export default NovaStudyBot;
