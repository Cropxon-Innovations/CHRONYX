import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, 
  Send, 
  Sparkles, 
  Lightbulb, 
  HelpCircle, 
  TrendingDown, 
  Calculator,
  X,
  MessageCircle,
  Crown,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

interface TaxynMessage {
  id: string;
  type: "user" | "taxyn";
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { icon: HelpCircle, label: "Why is my tax high?", prompt: "Why is my tax high?" },
  { icon: TrendingDown, label: "How to reduce tax?", prompt: "How can I reduce my tax?" },
  { icon: Calculator, label: "Explain slabs", prompt: "Explain tax slabs in simple words" },
  { icon: Lightbulb, label: "Deduction tips", prompt: "What deductions am I missing?" },
];

const FREE_MESSAGES_LIMIT = 3;
const LOCAL_STORAGE_KEY = "taxyn_messages_count";

export function FloatingTaxynBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<TaxynMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  
  const { isPro, isPremium } = useSubscription();
  const { user } = useAuth();
  const isProUser = isPro() || isPremium();

  // Load message count from localStorage
  useEffect(() => {
    if (!isProUser && user) {
      const today = new Date().toDateString();
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const { date, count } = JSON.parse(stored);
        if (date === today) {
          setMessageCount(count);
        } else {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
          setMessageCount(0);
        }
      }
    }
  }, [isProUser, user]);

  // Initialize welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: "welcome",
        type: "taxyn",
        content: `👋 Hi! I'm **TAXYN**, your AI tax assistant. I can help you understand Indian income tax, deductions, and which regime might save you more. Ask me anything!${!isProUser ? `\n\n📊 Free users get ${FREE_MESSAGES_LIMIT} messages/day.` : ''}`,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, messages.length, isProUser]);

  const remainingMessages = FREE_MESSAGES_LIMIT - messageCount;
  const canSendMessage = isProUser || remainingMessages > 0;

  const generateResponse = (question: string): string => {
    const lowerQ = question.toLowerCase();

    // Why is tax high?
    if (lowerQ.includes("why") && (lowerQ.includes("high") || lowerQ.includes("more"))) {
      return `Your tax could be high because:\n\n• **Income above ₹12L** falls in 20-30% brackets\n• **New regime** has limited deductions\n• **Old regime** allows 80C, 80D, HRA deductions\n\n💡 **Tip:** Use our Tax Calculator to compare both regimes and see which saves more!`;
    }

    // How to reduce tax?
    if (lowerQ.includes("reduce") || lowerQ.includes("save") || lowerQ.includes("lower")) {
      return `Here's how to reduce your tax:\n\n**Old Regime Deductions:**\n• **80C**: Up to ₹1.5L (PPF, ELSS, LIC)\n• **80D**: Health insurance (₹25K-75K)\n• **NPS**: Additional ₹50K under 80CCD(1B)\n• **24(b)**: Home loan interest up to ₹2L\n• **HRA**: If paying rent\n\n**New Regime:**\n• ₹75K standard deduction\n• Lower base rates (0-30%)\n\n💡 Use our **Compare Regimes** feature to find the best option!`;
    }

    // Explain slabs
    if (lowerQ.includes("slab") || lowerQ.includes("bracket")) {
      return `**New Regime Slabs (FY 2025-26):**\n\n• ₹0 - ₹3L: **0%**\n• ₹3L - ₹7L: **5%**\n• ₹7L - ₹10L: **10%**\n• ₹10L - ₹12L: **15%**\n• ₹12L - ₹15L: **20%**\n• Above ₹15L: **30%**\n\n+ **4% Cess** on total tax\n\n💡 New regime is simpler, Old regime has more deductions!`;
    }

    // Deduction tips
    if (lowerQ.includes("deduction") || lowerQ.includes("missing") || lowerQ.includes("claim")) {
      return `**Common Missed Deductions:**\n\n✅ **80C** - PPF, ELSS, LIC premiums (₹1.5L max)\n✅ **80D** - Health insurance for self & parents\n✅ **80CCD(1B)** - Extra ₹50K for NPS\n✅ **HRA** - If you pay rent but don't claim\n✅ **24(b)** - Home loan interest (₹2L max)\n✅ **80E** - Education loan interest\n\n💰 These only work in **Old Regime**!`;
    }

    // Regime comparison
    if (lowerQ.includes("regime") || lowerQ.includes("old") || lowerQ.includes("new")) {
      return `**Old vs New Regime:**\n\n📗 **New Regime:**\n• Lower tax rates\n• Simpler, no documents needed\n• Only ₹75K standard deduction\n\n📘 **Old Regime:**\n• Higher rates but many deductions\n• 80C, 80D, HRA, 24(b), etc.\n• Better if deductions > ₹4L\n\n💡 Use the **Compare** button in our Tax Calculator!`;
    }

    // 80C
    if (lowerQ.includes("80c")) {
      return `**Section 80C (Max ₹1.5 Lakh):**\n\n• PPF - Public Provident Fund\n• ELSS - Equity Linked Savings\n• LIC Premium payments\n• EPF - Employee contribution\n• NSC - National Savings Certificate\n• 5-year FD\n• Children's tuition fees\n• Home loan principal\n\n💡 This is the most popular deduction section!`;
    }

    // 80D
    if (lowerQ.includes("80d") || lowerQ.includes("health") || lowerQ.includes("medical")) {
      return `**Section 80D - Health Insurance:**\n\n• Self/Family: Up to ₹25,000\n• Parents (<60): Additional ₹25,000\n• Parents (>60): Additional ₹50,000\n• Preventive health checkup: ₹5,000\n\n**Maximum:**\n• Young taxpayer: ₹50,000\n• Senior parents: ₹75,000\n\n💡 Check if your insurance premiums are being claimed!`;
    }

    // Default response
    return `Great question about "${question}"!\n\nI can help with:\n• Tax slabs & calculations\n• Deduction sections (80C, 80D, etc.)\n• Old vs New regime comparison\n• Tax-saving investments\n\nTry asking something specific like "How to save tax?" or "Explain 80C"!`;
  };

  const handleSend = () => {
    if (!input.trim() || !canSendMessage) return;

    const userMessage: TaxynMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Update message count for free users
    if (!isProUser) {
      const newCount = messageCount + 1;
      setMessageCount(newCount);
      const today = new Date().toDateString();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ date: today, count: newCount }));
    }

    // Simulate typing delay
    setTimeout(() => {
      const response = generateResponse(input);
      const botMessage: TaxynMessage = {
        id: (Date.now() + 1).toString(),
        type: "taxyn",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 800);
  };

  const handleQuickPrompt = (prompt: string) => {
    if (!canSendMessage) return;
    setInput(prompt);
    setTimeout(() => {
      const fakeEvent = { key: "Enter" } as React.KeyboardEvent;
      handleSend();
    }, 100);
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30 flex items-center justify-center hover:shadow-xl hover:shadow-violet-500/40 transition-shadow"
          >
            <Bot className="w-6 h-6" />
            {!isProUser && remainingMessages > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center">
                {remainingMessages}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 right-4 z-50 w-[340px] sm:w-[380px] max-h-[500px] flex flex-col"
          >
            <Card className="flex flex-col h-full shadow-2xl border-violet-500/20 bg-card/95 backdrop-blur-sm">
              {/* Header */}
              <CardHeader className="pb-2 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="font-semibold">TAXYN</span>
                      <p className="text-[10px] text-muted-foreground font-normal">Tax Assistant</p>
                    </div>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {isProUser ? (
                      <Badge variant="outline" className="text-[9px] gap-1 bg-violet-500/10 text-violet-500 border-violet-500/30">
                        <Crown className="w-2.5 h-2.5" />
                        Pro
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] gap-1">
                        {remainingMessages}/{FREE_MESSAGES_LIMIT} left
                      </Badge>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1 rounded-md hover:bg-muted transition-colors"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                
                {/* Free user progress */}
                {!isProUser && (
                  <div className="mt-2">
                    <Progress value={(messageCount / FREE_MESSAGES_LIMIT) * 100} className="h-1" />
                  </div>
                )}
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-3 space-y-3 overflow-hidden">
                {/* Quick Prompts */}
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((qp) => (
                    <Button
                      key={qp.label}
                      variant="outline"
                      size="sm"
                      className="text-[10px] h-6 px-2"
                      onClick={() => handleQuickPrompt(qp.prompt)}
                      disabled={!canSendMessage}
                    >
                      <qp.icon className="w-3 h-3 mr-1" />
                      {qp.label}
                    </Button>
                  ))}
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 pr-2 max-h-[280px]">
                  <div className="space-y-3">
                    <AnimatePresence>
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] p-2.5 rounded-lg text-xs ${
                              msg.type === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-1 text-muted-foreground text-xs"
                      >
                        <Bot className="w-3 h-3" />
                        <span>TAXYN is typing...</span>
                      </motion.div>
                    )}
                  </div>
                </ScrollArea>

                {/* Limit reached message */}
                {!isProUser && !canSendMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-4 h-4 text-violet-500" />
                      <span className="text-sm font-medium">Daily limit reached</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Upgrade to Pro for unlimited TAXYN messages, plus advanced tax calculations and PDF exports.
                    </p>
                    <Link to="/pricing">
                      <Button size="sm" className="w-full gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
                        <Sparkles className="w-3 h-3" />
                        Upgrade to Pro
                      </Button>
                    </Link>
                  </motion.div>
                )}

                {/* Input */}
                {canSendMessage && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask about tax..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      className="text-xs h-8"
                    />
                    <Button size="sm" className="h-8 px-3" onClick={handleSend}>
                      <Send className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
