import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Sparkles, Lightbulb, HelpCircle, TrendingDown, Calculator } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TaxynMessage {
  id: string;
  type: "user" | "taxyn";
  content: string;
  timestamp: Date;
}

interface TaxynBotProps {
  taxableIncome: number;
  totalTax: number;
  regime: string;
  deductions: Record<string, number>;
  financialYear: string;
  isPro: boolean;
}

const QUICK_PROMPTS = [
  { icon: HelpCircle, label: "Why is my tax high?", prompt: "Why is my tax high?" },
  { icon: TrendingDown, label: "How to reduce tax?", prompt: "How can I reduce my tax?" },
  { icon: Calculator, label: "Explain this slab", prompt: "Explain my tax slabs in simple words" },
  { icon: Lightbulb, label: "Missing deductions?", prompt: "What deductions am I missing?" },
];

export function TaxynBot({ taxableIncome, totalTax, regime, deductions, financialYear, isPro }: TaxynBotProps) {
  const [messages, setMessages] = useState<TaxynMessage[]>([
    {
      id: "welcome",
      type: "taxyn",
      content: `👋 Hi! I'm **TAXYN**, your inline tax assistant. I can help you understand your ${financialYear} tax calculation. Ask me anything!`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);
  const effectiveRate = taxableIncome > 0 ? ((totalTax / taxableIncome) * 100).toFixed(1) : "0";

  const generateResponse = (question: string): string => {
    const lowerQ = question.toLowerCase();

    // Why is tax high?
    if (lowerQ.includes("why") && (lowerQ.includes("high") || lowerQ.includes("more"))) {
      if (taxableIncome > 1500000) {
        return `Your taxable income of ₹${(taxableIncome / 100000).toFixed(1)}L falls in the **30% tax bracket**. This is the highest slab in ${regime === "new" ? "New" : "Old"} Regime.\n\n💡 **Tip:** ${regime === "new" ? "Consider switching to Old Regime if you have significant deductions like 80C, 80D, or HRA." : "You're already in Old Regime. Maximize your 80C (₹1.5L) and 80D deductions."}`;
      }
      return `Your effective tax rate is **${effectiveRate}%**. ${totalDeductions < 100000 ? "You haven't claimed many deductions yet. Consider investing in tax-saving instruments." : "You've claimed good deductions, but there might be more you're missing."}`;
    }

    // How to reduce tax?
    if (lowerQ.includes("reduce") || lowerQ.includes("save") || lowerQ.includes("lower")) {
      const suggestions = [];
      if (!deductions["80C"] || deductions["80C"] < 150000) {
        suggestions.push("- **80C**: Invest up to ₹1.5L in PPF, ELSS, or LIC");
      }
      if (!deductions["80D"] || deductions["80D"] < 50000) {
        suggestions.push("- **80D**: Health insurance premium (up to ₹50K for self + family)");
      }
      if (!deductions["80CCD1B"]) {
        suggestions.push("- **NPS (80CCD1B)**: Additional ₹50K deduction");
      }
      if (!deductions["24B"]) {
        suggestions.push("- **24(b)**: Home loan interest up to ₹2L");
      }

      if (suggestions.length === 0) {
        return "You've already maximized most common deductions! 🎉 Consider consulting a CA for advanced strategies like capital gains planning or HUF formation.";
      }

      return `Here are ways to reduce your tax:\n\n${suggestions.join("\n")}\n\n💡 These apply to **Old Regime** only. New Regime has limited deductions but lower base rates.`;
    }

    // Explain slabs
    if (lowerQ.includes("slab") || lowerQ.includes("explain")) {
      if (regime === "new") {
        return `**New Tax Regime Slabs (${financialYear})**:\n\n• ₹0 - ₹3L: **0%** (No tax)\n• ₹3L - ₹7L: **5%**\n• ₹7L - ₹10L: **10%**\n• ₹10L - ₹12L: **15%**\n• ₹12L - ₹15L: **20%**\n• Above ₹15L: **30%**\n\n+ **4% Health & Education Cess** on total tax\n\n💡 New regime has simpler slabs but fewer deduction options.`;
      }
      return `**Old Tax Regime Slabs (${financialYear})**:\n\n• ₹0 - ₹2.5L: **0%** (No tax)\n• ₹2.5L - ₹5L: **5%**\n• ₹5L - ₹10L: **20%**\n• Above ₹10L: **30%**\n\n+ **4% Health & Education Cess** on total tax\n\n💡 Old regime allows deductions under 80C, 80D, HRA, etc.`;
    }

    // Missing deductions
    if (lowerQ.includes("missing") || lowerQ.includes("deduction")) {
      const missing = [];
      if (!deductions["80C"] || deductions["80C"] < 150000) {
        const gap = 150000 - (deductions["80C"] || 0);
        missing.push(`**80C**: You can claim ₹${(gap / 1000).toFixed(0)}K more`);
      }
      if (!deductions["80CCD1B"]) {
        missing.push("**NPS (80CCD1B)**: ₹50,000 additional");
      }
      if (!deductions["80D"] || deductions["80D"] < 75000) {
        missing.push("**80D**: Health insurance for parents adds ₹25K-50K");
      }
      if (!deductions["HRA"]) {
        missing.push("**HRA**: If you're paying rent, claim HRA exemption");
      }

      if (missing.length === 0) {
        return "Great job! You've claimed all common deductions. 🎉";
      }

      const potentialSavings = missing.length * 15000; // Rough estimate
      return `You might be missing:\n\n• ${missing.join("\n• ")}\n\n💰 **Potential savings**: ~₹${(potentialSavings / 1000).toFixed(0)}K if you claim these (estimated at 30% bracket)`;
    }

    // Regime comparison
    if (lowerQ.includes("regime") || lowerQ.includes("old") || lowerQ.includes("new")) {
      return `You're using **${regime === "new" ? "New" : "Old"} Regime**.\n\n**New Regime**: Lower rates, no deductions (except ₹75K standard deduction)\n**Old Regime**: Higher rates, but allows 80C, 80D, HRA, etc.\n\n💡 Use the "Compare" button to see which saves you more!`;
    }

    // Default response
    return `I understand you're asking about "${question}". Here's what I know:\n\n• Your taxable income: ₹${(taxableIncome / 100000).toFixed(1)}L\n• Tax payable: ₹${(totalTax / 1000).toFixed(0)}K\n• Effective rate: ${effectiveRate}%\n\nTry asking about slabs, deductions, or how to reduce tax!`;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: TaxynMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

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
    setInput(prompt);
    setTimeout(() => handleSend(), 100);
  };

  if (!isPro) {
    return (
      <Card className="border-dashed border-primary/30 bg-primary/5">
        <CardContent className="p-6 text-center">
          <Bot className="w-10 h-10 text-primary/50 mx-auto mb-3" />
          <h3 className="font-semibold mb-1">TAXYN - Tax Assistant</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Get instant answers about your tax calculation
          </p>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="w-3 h-3" />
            Pro Feature
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          TAXYN
          <Badge variant="outline" className="text-[9px] ml-auto">AI</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Quick Prompts */}
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((qp) => (
            <Button
              key={qp.label}
              variant="outline"
              size="sm"
              className="text-[10px] h-6 px-2"
              onClick={() => handleQuickPrompt(qp.prompt)}
            >
              <qp.icon className="w-3 h-3 mr-1" />
              {qp.label}
            </Button>
          ))}
        </div>

        {/* Messages */}
        <ScrollArea className="h-48 pr-2">
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

        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Ask about your tax..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="text-xs h-8"
          />
          <Button size="sm" className="h-8 px-3" onClick={handleSend}>
            <Send className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}