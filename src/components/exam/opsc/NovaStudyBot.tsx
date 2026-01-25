import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, Sparkles, Send, BookOpen, Brain, 
  Lightbulb, HelpCircle, FileText, RotateCcw, 
  Loader2, Bot, User, ChevronRight, Zap, Globe, AlertCircle
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
  isExternal?: boolean;
  context?: {
    topic?: string;
    subject?: string;
    type?: "explanation" | "mcq" | "answer_structure" | "summary" | "general" | "external";
  };
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

const OPSC_TOPICS = [
  "Indian Polity", "Fundamental Rights", "Directive Principles", "Constitutional Bodies",
  "Indian History", "Ancient India", "Medieval India", "Modern India", "Freedom Movement",
  "Indian Geography", "Physical Geography", "Monsoon System", "Rivers", "Agriculture",
  "Indian Economy", "Fiscal Policy", "Monetary Policy", "Five Year Plans",
  "Odisha History", "Odisha Geography", "Odisha Economy", "Odisha Culture",
  "Ethics", "Aptitude", "Public Administration", "Current Affairs",
  "Science & Technology", "Environment", "Disaster Management"
];

// Simple topic relevance check
const isTopicRelevant = (query: string, allowedTopics: string[]): boolean => {
  const queryLower = query.toLowerCase();
  
  // Check against OPSC topics
  const allTopics = [...allowedTopics, ...OPSC_TOPICS];
  for (const topic of allTopics) {
    if (queryLower.includes(topic.toLowerCase())) {
      return true;
    }
  }
  
  // Keywords that indicate study-related queries
  const studyKeywords = [
    "exam", "syllabus", "mains", "prelims", "preparation", "study", "revision",
    "mcq", "question", "answer", "explain", "concept", "important", "topics",
    "history", "geography", "polity", "economy", "science", "ethics", "odisha"
  ];
  
  for (const keyword of studyKeywords) {
    if (queryLower.includes(keyword)) {
      return true;
    }
  }
  
  return false;
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
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [activeTopic, setActiveTopic] = useState<string | null>(currentTopic || null);
  const [isTyping, setIsTyping] = useState(false);
  const [isExternalMode, setIsExternalMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch chat history
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["nova-study-chat", user?.id],
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
        isExternal: msg.context_data?.type === "external",
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
      // Check if query is within syllabus scope
      const isRelevant = isTopicRelevant(userMessage, allowedTopics);
      const willUseExternal = !isRelevant;
      
      setIsExternalMode(willUseExternal);
      
      // Save user message
      const { error: userError } = await supabase
        .from("nyaya_chat_history")
        .insert({
          user_id: user!.id,
          role: "user",
          content: userMessage,
          context_data: { 
            topic: activeTopic,
            type: willUseExternal ? "external" : "general"
          },
        });
      
      if (userError) throw userError;

      setIsTyping(true);
      
      // Build system prompt based on context
      const systemPrompt = willUseExternal
        ? `You are NOVA, Chronyx's intelligent AI assistant. The user is asking about something outside their exam syllabus. 
           Provide a helpful, accurate response but remind them this is a general query outside their ${examType} preparation.
           Keep responses concise and helpful.`
        : `You are NOVA Study, an expert AI assistant for ${examType} exam preparation within Chronyx.
           User's subjects: ${subjects.join(", ") || "General Studies"}
           Current topic focus: ${activeTopic || "General"}
           
           You provide accurate, concise answers about Indian Polity, History, Geography, Economy, Science, Ethics, 
           and ${examType === "OPSC" ? "Odisha-specific topics" : "state-specific topics"}.
           
           Always:
           - Be structured and use bullet points
           - Cite relevant articles/provisions when applicable
           - Keep language clear and exam-focused
           - Provide answer frameworks for Mains questions`;
      
      // Call the AI endpoint
      const response = await supabase.functions.invoke("chronyx-bot", {
        body: {
          message: userMessage,
          context: {
            examType,
            currentTopic: activeTopic,
            botName: "NOVA Study",
            isExternal: willUseExternal,
            systemPrompt
          }
        }
      });

      setIsTyping(false);

      let aiResponse = response.data?.response;
      
      if (!aiResponse) {
        if (willUseExternal) {
          aiResponse = `🌐 **Using NOVA General Agent**\n\nI'll help you with this query outside your ${examType} syllabus.\n\nPlease note: This is a general knowledge query. For best results on your exam preparation, focus on syllabus-specific topics.\n\n---\n\nI'd be happy to help with your question. Could you provide more details or context?`;
        } else {
          aiResponse = "I understand your question. Let me provide you with a structured answer based on your exam syllabus...";
        }
      }

      // Save AI response
      const { error: aiError } = await supabase
        .from("nyaya_chat_history")
        .insert({
          user_id: user!.id,
          role: "assistant",
          content: aiResponse,
          context_data: { 
            topic: activeTopic,
            type: willUseExternal ? "external" : "general"
          },
        });

      if (aiError) throw aiError;
      setIsExternalMode(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nova-study-chat"] });
      setInput("");
    },
    onError: (error) => {
      setIsTyping(false);
      setIsExternalMode(false);
      toast.error("Failed to send message");
      console.error(error);
    },
  });

  const handleSend = () => {
    if (!input.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(input.trim());
  };

  const handleQuickPrompt = (prompt: string) => {
    const fullPrompt = activeTopic 
      ? `${prompt} about "${activeTopic}"`
      : prompt;
    setInput(fullPrompt);
    inputRef.current?.focus();
  };

  const handleTopicSelect = (topic: string) => {
    setActiveTopic(topic);
    setInput(`Tell me about ${topic}`);
    inputRef.current?.focus();
  };

  const clearHistory = async () => {
    const { error } = await supabase
      .from("nyaya_chat_history")
      .delete()
      .eq("user_id", user?.id);
    
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["nova-study-chat"] });
      toast.success("Chat history cleared");
    }
  };

  const SUGGESTED_TOPICS = subjects.length > 0 
    ? subjects.slice(0, 5)
    : [
        "Indian Polity - Fundamental Rights",
        "Geography - Monsoon System",
        "History - Quit India Movement",
        "Economics - Fiscal Policy",
        "Odisha GK - Rivers & Dams",
      ];

  // Inline mode - compact view
  if (inline) {
    return (
      <Card className="border-primary/20 bg-card/95 backdrop-blur shadow-lg">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium text-sm">NOVA Study</span>
              {activeTopic && (
                <Badge variant="outline" className="text-xs">
                  {activeTopic}
                </Badge>
              )}
            </div>
            {onClose && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-3 pt-0">
          {/* Compact message history */}
          {messages.length > 0 && (
            <ScrollArea className="h-32 mb-2">
              <div className="space-y-2">
                {messages.slice(-3).map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "text-xs p-2 rounded-lg",
                      msg.role === "user" 
                        ? "bg-primary/10 ml-8" 
                        : msg.isExternal 
                          ? "bg-amber-500/10 border border-amber-500/20"
                          : "bg-muted"
                    )}
                  >
                    {msg.isExternal && (
                      <span className="text-amber-600 text-[10px] flex items-center gap-1 mb-1">
                        <Globe className="w-3 h-3" /> General Agent
                      </span>
                    )}
                    <p className="line-clamp-2">{msg.content}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              {isExternalMode ? "Searching with NOVA General..." : "NOVA is thinking..."}
            </div>
          )}
          
          {/* Input */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a doubt..."
              className="flex-1 h-8 text-sm"
              disabled={sendMessageMutation.isPending}
            />
            <Button type="submit" size="icon" className="h-8 w-8" disabled={!input.trim() || sendMessageMutation.isPending}>
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
      <Card className="border-border/50 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 ring-2 ring-primary/20">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  NOVA Study
                  <Badge variant="secondary" className="text-xs font-normal">
                    AI Study Assistant
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Your intelligent {examType} exam preparation guide
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

      {/* Context Alert */}
      {isExternalMode && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-amber-600" />
              <span className="text-amber-600">Using NOVA General Agent for this query</span>
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
            {messages.length === 0 && !isLoading ? (
              <div className="text-center py-8 space-y-6">
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium">Start a Conversation</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Ask me about any {examType} topic. I can explain concepts, generate MCQs, 
                    and help structure your Mains answers.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <Globe className="w-3 h-3 inline mr-1" />
                    For questions outside your syllabus, I'll use NOVA General Agent
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
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                        msg.isExternal ? "bg-amber-500/10" : "bg-primary/10"
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
                      isExternalMode ? "bg-amber-500/10" : "bg-primary/10"
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
              placeholder={`Ask about ${examType} topics or anything else...`}
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
