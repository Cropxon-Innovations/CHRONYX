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
  Trash2,
  MessageSquare
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

interface FloatingTaxynBotProps {
  headerRef?: React.RefObject<HTMLDivElement>;
}

const QUICK_PROMPTS = [
  { icon: HelpCircle, label: "Why high tax?", prompt: "Why is my tax high?" },
  { icon: TrendingDown, label: "Reduce tax", prompt: "How can I reduce my tax?" },
  { icon: Calculator, label: "Tax slabs", prompt: "Explain tax slabs in simple words" },
  { icon: Scale, label: "Old vs New", prompt: "Which regime should I choose?" },
];

const FREE_MESSAGES_LIMIT = 3;
const LOCAL_STORAGE_KEY = "taxyn_messages_count";

export function FloatingTaxynBot({ headerRef }: FloatingTaxynBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<TaxynMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
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
        content: `👋 Hi! I'm **TAXYN**, your AI tax & audit assistant.\n\nI can help you with:\n• Income tax calculations\n• Deductions (80C, 80D, etc.)\n• Old vs New regime\n• Tax-saving tips\n\n${!isProUser ? `📊 ${FREE_MESSAGES_LIMIT} free messages/day` : '✨ Unlimited Pro access'}`,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, messages.length, isProUser]);

  const remainingMessages = FREE_MESSAGES_LIMIT - messageCount;
  const canSendMessage = isProUser || remainingMessages > 0;

  const generateResponse = (question: string): string => {
    const lowerQ = question.toLowerCase();

    if (lowerQ.includes("why") && (lowerQ.includes("high") || lowerQ.includes("more"))) {
      return `Your tax could be high because:\n\n• **Income above Rs.12L** falls in 20-30% brackets\n• **New regime** has limited deductions\n• **Old regime** allows 80C, 80D, HRA deductions\n\n💡 Use the Compare step to see which regime saves more!`;
    }

    if (lowerQ.includes("reduce") || lowerQ.includes("save") || lowerQ.includes("lower")) {
      return `Tax saving options:\n\n**Old Regime:**\n• **80C**: Rs.1.5L (PPF, ELSS, LIC)\n• **80D**: Rs.25K-75K (Health Insurance)\n• **80CCD(1B)**: Rs.50K (NPS)\n• **24(b)**: Rs.2L (Home Loan)\n\n**New Regime:**\n• Rs.75K standard deduction\n• Lower tax rates`;
    }

    if (lowerQ.includes("slab") || lowerQ.includes("bracket")) {
      return `**New Regime (FY 2025-26):**\n\n• Rs.0 - 3L: **0%**\n• Rs.3L - 7L: **5%**\n• Rs.7L - 10L: **10%**\n• Rs.10L - 12L: **15%**\n• Rs.12L - 15L: **20%**\n• Above Rs.15L: **30%**\n\n+ 4% Health & Education Cess`;
    }

    if (lowerQ.includes("regime") || lowerQ.includes("old") || lowerQ.includes("new") || lowerQ.includes("choose") || lowerQ.includes("which")) {
      return `**Which regime?**\n\n📗 **NEW if:**\n• Income < Rs.12L (zero tax with rebate)\n• Few investments\n• Want simplicity\n\n📘 **OLD if:**\n• HRA + Home Loan benefits\n• Total deductions > Rs.4L\n• Health insurance for parents`;
    }

    if (lowerQ.includes("deduction") || lowerQ.includes("missing") || lowerQ.includes("claim")) {
      return `**Common Deductions:**\n\n• **80C**: PPF, ELSS, LIC (Rs.1.5L)\n• **80D**: Health insurance\n• **80CCD(1B)**: NPS (Rs.50K extra)\n• **24(b)**: Home loan interest\n• **80E**: Education loan\n• **HRA**: Rent exemption\n\n⚠️ Only in Old Regime!`;
    }

    if (lowerQ.includes("80c")) {
      return `**Section 80C (Max Rs.1.5L):**\n\n• PPF - Public Provident Fund\n• ELSS - Tax Saving Mutual Funds\n• LIC Premium\n• EPF Contribution\n• NSC\n• 5-year Tax Saver FD\n• Tuition Fees\n• Home Loan Principal`;
    }

    if (lowerQ.includes("80d") || lowerQ.includes("health") || lowerQ.includes("medical")) {
      return `**Section 80D:**\n\n• Self/Family: Rs.25,000\n• Parents (<60): +Rs.25,000\n• Parents (>60): +Rs.50,000\n\n**Max Limits:**\n• Young taxpayer: Rs.50,000\n• Senior parents: Rs.75,000\n• All senior: Rs.1,00,000`;
    }

    if (lowerQ.includes("rebate") || lowerQ.includes("87a")) {
      return `**Rebate u/s 87A:**\n\n**New Regime:**\n• Income up to Rs.12L = ZERO TAX\n• Max rebate: Rs.60,000\n\n**Old Regime:**\n• Income up to Rs.5L = ZERO TAX\n• Max rebate: Rs.12,500`;
    }

    return `I can help with:\n• Tax slabs & calculations\n• Deductions (80C, 80D, etc.)\n• Old vs New regime\n• Tax-saving tips\n\n💡 Try: "Which regime should I choose?" or "How to reduce tax?"`;
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

    if (!isProUser) {
      const newCount = messageCount + 1;
      setMessageCount(newCount);
      const today = new Date().toDateString();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ date: today, count: newCount }));
    }

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
    }, 600);
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

  return (
    <>
      {/* Drag constraints container */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-40" />

      {/* Header Button - appears in the Tax Dashboard header */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all"
          >
            <div className="relative">
              <MessageSquare className="w-4 h-4" />
            </div>
            <span>Ask TAXYN</span>
            {!isProUser && remainingMessages > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-white/20 text-white border-0">
                {remainingMessages} left
              </Badge>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel - Draggable */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag
            dragControls={dragControls}
            dragMomentum={false}
            dragConstraints={constraintsRef}
            dragElastic={0}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-20 right-4 z-50 w-[320px] sm:w-[360px] touch-none"
          >
            <Card className={`flex flex-col shadow-2xl border-violet-500/30 bg-card/98 backdrop-blur-md overflow-hidden ${isDragging ? 'cursor-grabbing' : ''}`}>
              {/* Header */}
              <CardHeader 
                className="pb-2 border-b border-border/50 cursor-grab active:cursor-grabbing bg-gradient-to-r from-violet-600 to-purple-600"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <Scale className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="font-bold text-white">TAXYN</span>
                      <p className="text-[10px] text-white/70 font-normal">Tax & Audit Assistant</p>
                    </div>
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <GripVertical className="w-4 h-4 text-white/50" />
                    {isProUser ? (
                      <Badge className="text-[9px] gap-0.5 bg-white/20 text-white border-0 hover:bg-white/30">
                        <Crown className="w-2.5 h-2.5" />
                        Pro
                      </Badge>
                    ) : (
                      <Badge className="text-[9px] gap-0.5 bg-white/20 text-white border-0">
                        {remainingMessages}/{FREE_MESSAGES_LIMIT}
                      </Badge>
                    )}
                    <button
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                      title={isMinimized ? "Expand" : "Minimize"}
                    >
                      <Minus className="w-3.5 h-3.5 text-white" />
                    </button>
                    <button
                      onClick={handleClearChat}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                      title="Clear & Close"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
                
                {!isProUser && !isMinimized && (
                  <div className="mt-2">
                    <Progress value={(messageCount / FREE_MESSAGES_LIMIT) * 100} className="h-1 bg-white/20" />
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
                    <CardContent className="flex-1 flex flex-col p-3 space-y-3 overflow-hidden max-h-[380px]">
                      {/* Quick Prompts */}
                      <div className="flex flex-wrap gap-1">
                        {QUICK_PROMPTS.map((qp) => (
                          <Button
                            key={qp.label}
                            variant="outline"
                            size="sm"
                            className="text-[10px] h-6 px-2 hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-600"
                            onClick={() => handleQuickPrompt(qp.prompt)}
                            disabled={!canSendMessage}
                          >
                            <qp.icon className="w-3 h-3 mr-1" />
                            {qp.label}
                          </Button>
                        ))}
                      </div>

                      {/* Messages */}
                      <ScrollArea className="flex-1 pr-2 max-h-[220px]">
                        <div className="space-y-2">
                          <AnimatePresence>
                            {messages.map((msg) => (
                              <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`max-w-[88%] p-2 rounded-lg text-xs leading-relaxed ${
                                    msg.type === "user"
                                      ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white"
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
                              className="flex items-center gap-2 text-muted-foreground text-xs"
                            >
                              <div className="flex gap-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                              </div>
                              <span>Typing...</span>
                            </motion.div>
                          )}
                        </div>
                      </ScrollArea>

                      {/* Limit reached */}
                      {!isProUser && !canSendMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 rounded-lg bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Lock className="w-4 h-4 text-violet-500" />
                            <span className="text-sm font-medium">Daily limit reached</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            Upgrade for unlimited TAXYN access.
                          </p>
                          <Link to="/pricing">
                            <Button size="sm" className="w-full gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-xs h-7">
                              <Sparkles className="w-3 h-3" />
                              Upgrade
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
                            className="text-xs h-8 bg-muted/50"
                          />
                          <Button 
                            size="sm" 
                            className="h-8 px-2.5 bg-gradient-to-r from-violet-500 to-purple-500" 
                            onClick={handleSend}
                          >
                            <Send className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}

                      {/* Clear button */}
                      {messages.length > 1 && (
                        <button
                          onClick={handleClearChat}
                          className="text-[10px] text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center gap-1 py-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Clear & close
                        </button>
                      )}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Minimized state */}
              {isMinimized && (
                <button
                  onClick={() => setIsMinimized(false)}
                  className="p-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-center"
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
