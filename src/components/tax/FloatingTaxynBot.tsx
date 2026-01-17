import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Send, 
  Sparkles, 
  Lightbulb, 
  HelpCircle, 
  TrendingDown, 
  Calculator,
  X,
  Crown,
  Lock,
  Minus,
  GripVertical,
  Scale,
  FileText,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
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
  { icon: HelpCircle, label: "Why high tax?", prompt: "Why is my tax high?" },
  { icon: TrendingDown, label: "Reduce tax", prompt: "How can I reduce my tax?" },
  { icon: Calculator, label: "Tax slabs", prompt: "Explain tax slabs in simple words" },
  { icon: Scale, label: "Old vs New", prompt: "Which regime should I choose?" },
];

const FREE_MESSAGES_LIMIT = 3;
const LOCAL_STORAGE_KEY = "taxyn_messages_count";

export function FloatingTaxynBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<TaxynMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);
  
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
        content: `👋 Hi! I'm **TAXYN**, your AI tax & audit assistant powered by CHRONYX.\n\nI can help you understand:\n• Income tax calculations\n• Deductions (80C, 80D, etc.)\n• Old vs New regime comparison\n• Tax-saving strategies\n\n${!isProUser ? `📊 Free: ${FREE_MESSAGES_LIMIT} messages/day` : '✨ Pro: Unlimited access'}`,
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
      return `Here's how to reduce your tax:\n\n**Old Regime Deductions:**\n• **80C**: Up to ₹1.5L (PPF, ELSS, LIC)\n• **80D**: Health insurance (₹25K-75K)\n• **NPS**: Additional ₹50K under 80CCD(1B)\n• **24(b)**: Home loan interest up to ₹2L\n• **HRA**: If paying rent\n\n**New Regime:**\n• ₹75K standard deduction\n• Lower base rates (0-30%)\n\n💡 Use our **Compare Regimes** feature!`;
    }

    // Explain slabs
    if (lowerQ.includes("slab") || lowerQ.includes("bracket")) {
      return `**New Regime Slabs (FY 2025-26):**\n\n• ₹0 - ₹3L: **0%**\n• ₹3L - ₹7L: **5%**\n• ₹7L - ₹10L: **10%**\n• ₹10L - ₹12L: **15%**\n• ₹12L - ₹15L: **20%**\n• Above ₹15L: **30%**\n\n+ **4% Cess** on total tax\n\n💡 New regime is simpler, Old regime has more deductions!`;
    }

    // Regime comparison
    if (lowerQ.includes("regime") || lowerQ.includes("old") || lowerQ.includes("new") || lowerQ.includes("choose") || lowerQ.includes("which")) {
      return `**Old vs New Regime - Which to Choose?**\n\n📗 **Choose NEW if:**\n• Income < ₹12L (0% tax up to ₹12L with rebate)\n• Few investments/deductions\n• Want simplicity\n\n📘 **Choose OLD if:**\n• HRA + Home Loan benefits\n• 80C investments > ₹1.5L\n• Health insurance premiums\n• Total deductions > ₹4-5L\n\n⚡ **Quick Rule:** If total deductions < ₹4L, NEW wins. Otherwise, OLD might be better!`;
    }

    // Deduction tips
    if (lowerQ.includes("deduction") || lowerQ.includes("missing") || lowerQ.includes("claim")) {
      return `**Common Missed Deductions:**\n\n✅ **80C** - PPF, ELSS, LIC (₹1.5L max)\n✅ **80D** - Health insurance for self & parents\n✅ **80CCD(1B)** - Extra ₹50K for NPS\n✅ **HRA** - If you pay rent\n✅ **24(b)** - Home loan interest (₹2L max)\n✅ **80E** - Education loan interest\n✅ **80TTA** - Savings bank interest (₹10K)\n\n💰 These work in **Old Regime** only!`;
    }

    // 80C
    if (lowerQ.includes("80c")) {
      return `**Section 80C (Max ₹1.5 Lakh):**\n\n• PPF - Public Provident Fund\n• ELSS - Equity Linked Savings (3yr lock)\n• LIC Premium payments\n• EPF - Employee contribution\n• NSC - National Savings Certificate\n• 5-year Tax Saver FD\n• Children's tuition fees\n• Home loan principal\n• Sukanya Samriddhi\n\n💡 This is the most popular section - max it out!`;
    }

    // 80D
    if (lowerQ.includes("80d") || lowerQ.includes("health") || lowerQ.includes("medical")) {
      return `**Section 80D - Health Insurance:**\n\n• Self/Family (<60): Up to ₹25,000\n• Parents (<60): Additional ₹25,000\n• Parents (>60): Additional ₹50,000\n• Preventive checkup: ₹5,000 (included)\n\n**Maximum Limits:**\n• Both young: ₹50,000\n• Parents senior: ₹75,000\n• All senior: ₹1,00,000\n\n💡 One of the easiest deductions to claim!`;
    }

    // Rebate 87A
    if (lowerQ.includes("rebate") || lowerQ.includes("87a")) {
      return `**Section 87A Rebate:**\n\n**New Regime (FY 2025-26):**\n• Income up to ₹12L = **ZERO TAX**\n• Rebate up to ₹60,000\n\n**Old Regime:**\n• Income up to ₹5L = **ZERO TAX**\n• Rebate up to ₹12,500\n\n💡 This is why ₹12L income in new regime pays no tax!`;
    }

    // Surcharge
    if (lowerQ.includes("surcharge") || lowerQ.includes("cess")) {
      return `**Surcharge & Cess:**\n\n**Surcharge (on tax):**\n• ₹50L - ₹1Cr: 10%\n• ₹1Cr - ₹2Cr: 15%\n• ₹2Cr - ₹5Cr: 25%\n• Above ₹5Cr: 37%\n\n**Cess:**\n• 4% Health & Education Cess\n• Applied on Tax + Surcharge\n\n💡 Surcharge is only for high earners!`;
    }

    // Default response
    return `Great question about "${question}"!\n\nI can help with:\n• Tax slabs & calculations\n• Deduction sections (80C, 80D, etc.)\n• Old vs New regime comparison\n• Tax-saving investments\n• Rebates & exemptions\n\n💡 Try asking:\n"Which regime should I choose?"\n"How to reduce tax?"\n"Explain 80C deductions"`;
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
    setTimeout(() => handleSend(), 100);
  };

  const handleClearChat = () => {
    setMessages([]);
    setIsOpen(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleRestore = () => {
    setIsMinimized(false);
  };

  return (
    <>
      {/* Drag constraints container */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-40" />

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
            className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30 flex items-center justify-center hover:shadow-xl hover:shadow-violet-500/40 transition-shadow"
          >
            <div className="relative">
              <FileText className="w-5 h-5" />
              <Scale className="w-3 h-3 absolute -bottom-1 -right-1" />
            </div>
            {!isProUser && remainingMessages > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center border-2 border-background">
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
            drag
            dragControls={dragControls}
            dragMomentum={false}
            dragConstraints={constraintsRef}
            dragElastic={0}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? "auto" : "auto"
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{ x: position.x, y: position.y }}
            className="fixed bottom-20 right-4 z-50 w-[340px] sm:w-[380px] touch-none"
          >
            <Card className="flex flex-col shadow-2xl border-violet-500/20 bg-card/98 backdrop-blur-md overflow-hidden">
              {/* Header - Always visible */}
              <CardHeader 
                className="pb-2 border-b border-border/50 cursor-grab active:cursor-grabbing bg-gradient-to-r from-violet-500/10 to-purple-500/10"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                      <div className="relative">
                        <FileText className="w-4 h-4 text-white" />
                        <Scale className="w-2 h-2 text-white absolute -bottom-0.5 -right-0.5" />
                      </div>
                    </div>
                    <div>
                      <span className="font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">TAXYN</span>
                      <p className="text-[10px] text-muted-foreground font-normal">Tax & Audit Assistant</p>
                    </div>
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                    {isProUser ? (
                      <Badge variant="outline" className="text-[9px] gap-1 bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-600 border-violet-500/30">
                        <Crown className="w-2.5 h-2.5" />
                        Pro
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] gap-1">
                        {remainingMessages}/{FREE_MESSAGES_LIMIT}
                      </Badge>
                    )}
                    <button
                      onClick={handleMinimize}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                      title="Minimize"
                    >
                      <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={handleClearChat}
                      className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
                      title="Clear & Close"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </div>
                
                {/* Free user progress */}
                {!isProUser && !isMinimized && (
                  <div className="mt-2">
                    <Progress value={(messageCount / FREE_MESSAGES_LIMIT) * 100} className="h-1" />
                  </div>
                )}
              </CardHeader>

              {/* Collapsible Content */}
              <AnimatePresence>
                {!isMinimized && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="flex-1 flex flex-col p-3 space-y-3 overflow-hidden max-h-[400px]">
                      {/* Quick Prompts */}
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_PROMPTS.map((qp) => (
                          <Button
                            key={qp.label}
                            variant="outline"
                            size="sm"
                            className="text-[10px] h-6 px-2 hover:bg-violet-500/10 hover:border-violet-500/30"
                            onClick={() => handleQuickPrompt(qp.prompt)}
                            disabled={!canSendMessage}
                          >
                            <qp.icon className="w-3 h-3 mr-1" />
                            {qp.label}
                          </Button>
                        ))}
                      </div>

                      {/* Messages */}
                      <ScrollArea className="flex-1 pr-2 max-h-[250px]">
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
                                  className={`max-w-[85%] p-2.5 rounded-xl text-xs ${
                                    msg.type === "user"
                                      ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white"
                                      : "bg-muted/80"
                                  }`}
                                >
                                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          {isTyping && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex items-center gap-2 text-muted-foreground text-xs"
                            >
                              <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                              </div>
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
                          className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Lock className="w-4 h-4 text-violet-500" />
                            <span className="text-sm font-medium">Daily limit reached</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">
                            Upgrade to Pro for unlimited TAXYN access, advanced calculations, and PDF exports.
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
                            placeholder="Ask about tax, deductions, regimes..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            className="text-xs h-9 bg-muted/50 border-muted-foreground/20 focus:border-violet-500"
                          />
                          <Button 
                            size="sm" 
                            className="h-9 px-3 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600" 
                            onClick={handleSend}
                          >
                            <Send className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}

                      {/* Clear chat button */}
                      {messages.length > 1 && (
                        <button
                          onClick={handleClearChat}
                          className="text-[10px] text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Clear chat & close
                        </button>
                      )}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Minimized state - click to restore */}
              {isMinimized && (
                <button
                  onClick={handleRestore}
                  className="p-2 text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
                >
                  Click to expand
                </button>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
