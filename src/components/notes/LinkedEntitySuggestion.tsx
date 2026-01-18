import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Link2, 
  Check, 
  X,
  Shield,
  Wallet,
  Receipt,
  FileText,
  CreditCard
} from "lucide-react";
import { NoteType } from "./NoteTypeSelector";

export interface LinkedEntity {
  id: string;
  type: "insurance" | "loan" | "expense" | "income" | "document";
  label: string;
  metadata?: Record<string, any>;
}

interface LinkedEntitySuggestionProps {
  content: string;
  noteType: NoteType;
  linkedEntities: LinkedEntity[];
  onAddEntity: (entity: LinkedEntity) => void;
}

interface Suggestion {
  entity: LinkedEntity;
  reason: string;
  confidence: number;
}

const ENTITY_ICONS: Record<LinkedEntity["type"], React.ElementType> = {
  insurance: Shield,
  loan: CreditCard,
  expense: Wallet,
  income: Receipt,
  document: FileText,
};

const ENTITY_COLORS: Record<LinkedEntity["type"], string> = {
  insurance: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
  loan: "text-purple-600 bg-purple-50 dark:bg-purple-950/30",
  expense: "text-red-600 bg-red-50 dark:bg-red-950/30",
  income: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
  document: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
};

// Keywords that trigger entity detection
const DETECTION_KEYWORDS = {
  insurance: ["premium", "policy", "claim", "insurance", "health", "life", "motor", "coverage"],
  loan: ["emi", "loan", "principal", "interest", "mortgage", "credit"],
  expense: ["paid", "spent", "expense", "purchase", "bought", "payment"],
  income: ["salary", "income", "received", "earned", "bonus", "dividend"],
  tax: ["80c", "80d", "form 16", "hra", "deduction", "tax", "itr", "gst"],
};

export const LinkedEntitySuggestion = ({
  content,
  noteType,
  linkedEntities,
  onAddEntity,
}: LinkedEntitySuggestionProps) => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!content || !user) {
      setSuggestions([]);
      return;
    }

    const detectEntities = async () => {
      setLoading(true);
      const detectedSuggestions: Suggestion[] = [];
      
      try {
        // Parse content to extract text
        let textContent = "";
        try {
          const parsed = JSON.parse(content);
          textContent = extractText(parsed).toLowerCase();
        } catch {
          textContent = content.toLowerCase();
        }

        // Check for insurance keywords
        const hasInsuranceKeywords = DETECTION_KEYWORDS.insurance.some(kw => textContent.includes(kw));
        if (hasInsuranceKeywords) {
          const { data: insurances } = await supabase
            .from("insurances")
            .select("id, policy_name, policy_type")
            .eq("user_id", user.id)
            .limit(3);

          insurances?.forEach(ins => {
            if (!linkedEntities.find(e => e.id === ins.id && e.type === "insurance")) {
              detectedSuggestions.push({
                entity: {
                  id: ins.id,
                  type: "insurance",
                  label: ins.policy_name,
                  metadata: { policy_type: ins.policy_type },
                },
                reason: "Insurance-related keywords detected",
                confidence: 0.8,
              });
            }
          });
        }

        // Check for loan keywords
        const hasLoanKeywords = DETECTION_KEYWORDS.loan.some(kw => textContent.includes(kw));
        if (hasLoanKeywords) {
          const { data: loans } = await supabase
            .from("loans")
            .select("id, loan_type, bank_name")
            .eq("user_id", user.id)
            .limit(3);

          loans?.forEach(loan => {
            if (!linkedEntities.find(e => e.id === loan.id && e.type === "loan")) {
              detectedSuggestions.push({
                entity: {
                  id: loan.id,
                  type: "loan",
                  label: `${loan.loan_type} - ${loan.bank_name}`,
                  metadata: { bank_name: loan.bank_name },
                },
                reason: "Loan-related keywords detected",
                confidence: 0.8,
              });
            }
          });
        }

        // Detect amounts in content (for expense/income linking)
        const amountMatch = textContent.match(/₹?\s*[\d,]+(?:\.\d{2})?/g);
        if (amountMatch && (noteType === "finance_note" || DETECTION_KEYWORDS.expense.some(kw => textContent.includes(kw)))) {
          // Could fetch recent expenses matching amounts
        }

        // Filter out dismissed suggestions
        const filteredSuggestions = detectedSuggestions.filter(
          s => !dismissedSuggestions.includes(`${s.entity.type}-${s.entity.id}`)
        );

        setSuggestions(filteredSuggestions);
      } catch (error) {
        console.error("Error detecting entities:", error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce detection
    const timer = setTimeout(detectEntities, 1000);
    return () => clearTimeout(timer);
  }, [content, user, linkedEntities, dismissedSuggestions, noteType]);

  const extractText = (node: any): string => {
    if (typeof node === 'string') return node;
    if (node.text) return node.text + " ";
    if (node.content && Array.isArray(node.content)) {
      return node.content.map(extractText).join(" ");
    }
    return "";
  };

  const handleAccept = (suggestion: Suggestion) => {
    onAddEntity(suggestion.entity);
    setSuggestions(suggestions.filter(s => s !== suggestion));
  };

  const handleDismiss = (suggestion: Suggestion) => {
    setDismissedSuggestions([
      ...dismissedSuggestions,
      `${suggestion.entity.type}-${suggestion.entity.id}`,
    ]);
    setSuggestions(suggestions.filter(s => s !== suggestion));
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3 p-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <Link2 className="w-4 h-4" />
        Smart Link Suggestions
      </div>
      
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => {
          const Icon = ENTITY_ICONS[suggestion.entity.type];
          const colorClass = ENTITY_COLORS[suggestion.entity.type];

          return (
            <div
              key={`${suggestion.entity.type}-${suggestion.entity.id}-${index}`}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border"
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", colorClass)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {suggestion.entity.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {suggestion.reason}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  onClick={() => handleAccept(suggestion)}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDismiss(suggestion)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
