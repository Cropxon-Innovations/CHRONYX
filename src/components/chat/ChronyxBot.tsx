import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Bot,
  X,
  Send,
  Sparkles,
  User,
  Loader2,
  ChevronDown,
  MessageSquare,
  Lightbulb,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const PRESET_QUESTIONS = [
  "What's my productivity like this week?",
  "Summarize my financial status",
  "What insurance policies do I have?",
  "How many tasks did I complete today?",
  "What's my current savings progress?",
  "Show me my study hours this month",
];

interface ChronyxBotProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChronyxBot = ({ isOpen, onClose }: ChronyxBotProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPresets, setShowPresets] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `Hello! I'm CHRONYX Bot, your personal life assistant. I can help you understand your:\n\n• 📊 Productivity & Tasks\n• 💰 Finances & Expenses\n• 📚 Study Progress\n• 🛡️ Insurance & Loans\n• 🎯 Goals & Achievements\n\nAsk me anything about your life data!`,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  const fetchUserContext = async () => {
    if (!user) return "";
    
    // Fetch various user data for context
    const [
      profileRes,
      todosRes,
      expensesRes,
      incomeRes,
      loansRes,
      insuranceRes,
      studyRes,
      achievementsRes,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("todos").select("*").order("date", { ascending: false }).limit(50),
      supabase.from("expenses").select("*").order("expense_date", { ascending: false }).limit(30),
      supabase.from("income_entries").select("*").order("income_date", { ascending: false }).limit(20),
      supabase.from("loans").select("*").eq("status", "active"),
      supabase.from("insurances").select("*").eq("status", "active"),
      supabase.from("study_logs").select("*").order("date", { ascending: false }).limit(30),
      supabase.from("achievements").select("*").order("achieved_at", { ascending: false }).limit(10),
    ]);
    
    const profile = profileRes.data;
    const todos = todosRes.data || [];
    const expenses = expensesRes.data || [];
    const income = incomeRes.data || [];
    const loans = loansRes.data || [];
    const insurances = insuranceRes.data || [];
    const studyLogs = studyRes.data || [];
    const achievements = achievementsRes.data || [];
    
    // Build context string
    let context = `User Profile: ${profile?.display_name || "User"}\n`;
    context += `Current Date: ${format(new Date(), "MMMM d, yyyy")}\n\n`;
    
    // Tasks summary
    const todayTodos = todos.filter(t => t.date === format(new Date(), "yyyy-MM-dd"));
    const completedToday = todayTodos.filter(t => t.status === "done").length;
    context += `Tasks: ${completedToday}/${todayTodos.length} completed today. `;
    context += `${todos.filter(t => t.status === "pending").length} total pending.\n`;
    
    // Expenses summary
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    context += `Recent Expenses: ₹${totalExpenses.toLocaleString()} over ${expenses.length} transactions.\n`;
    
    // Income summary
    const totalIncome = income.reduce((sum, i) => sum + Number(i.amount), 0);
    context += `Recent Income: ₹${totalIncome.toLocaleString()} over ${income.length} entries.\n`;
    
    // Loans
    if (loans.length > 0) {
      const totalLoanAmount = loans.reduce((sum, l) => sum + Number(l.principal_amount), 0);
      context += `Active Loans: ${loans.length} loans totaling ₹${totalLoanAmount.toLocaleString()}.\n`;
    }
    
    // Insurance
    if (insurances.length > 0) {
      const totalCoverage = insurances.reduce((sum, i) => sum + Number(i.sum_assured), 0);
      context += `Insurance: ${insurances.length} active policies with ₹${totalCoverage.toLocaleString()} coverage.\n`;
    }
    
    // Study
    if (studyLogs.length > 0) {
      const totalStudyMinutes = studyLogs.reduce((sum, s) => sum + Number(s.duration), 0);
      const totalHours = Math.round(totalStudyMinutes / 60);
      context += `Study: ${totalHours} hours logged recently across ${studyLogs.length} sessions.\n`;
    }
    
    // Achievements
    if (achievements.length > 0) {
      context += `Recent Achievements: ${achievements.map(a => a.title).join(", ")}.\n`;
    }
    
    return context;
  };
  
  const sendMessage = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim() || isLoading || !user) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setShowPresets(false);
    
    try {
      const context = await fetchUserContext();
      
      const response = await supabase.functions.invoke("chronyx-bot", {
        body: {
          message: text.trim(),
          context,
          history: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
        },
      });
      
      if (response.error) throw response.error;
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.data?.response || "I apologize, I couldn't process that request. Please try again.",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Bot error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-20 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">CHRONYX Bot</h3>
                <p className="text-xs text-muted-foreground">Your Personal Assistant</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2.5",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-[10px] mt-1 opacity-60">
                      {format(message.timestamp, "h:mm a")}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Preset Questions */}
            {showPresets && messages.length <= 1 && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lightbulb className="w-3 h-3" />
                  <span>Quick questions</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_QUESTIONS.map((question, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(question)}
                      className="text-xs bg-muted hover:bg-accent px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
          
          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={() => sendMessage()} 
                disabled={!input.trim() || isLoading}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Floating Button Component
export const ChronyxBotButton = ({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "fixed bottom-4 right-4 sm:right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-50 transition-colors",
        isOpen 
          ? "bg-muted text-muted-foreground" 
          : "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
      )}
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
          >
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        ) : (
          <motion.div
            key="open"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            className="relative"
          >
            <Bot className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-primary animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default ChronyxBot;
