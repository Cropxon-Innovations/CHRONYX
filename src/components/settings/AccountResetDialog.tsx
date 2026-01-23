import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, RefreshCw, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AccountResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DataCategory {
  id: string;
  label: string;
  description: string;
  tables: string[];
  icon: string;
}

const DATA_CATEGORIES: DataCategory[] = [
  {
    id: "finances",
    label: "Financial Data",
    description: "Income, expenses, budget limits, savings goals",
    tables: ["income_entries", "income_sources", "expenses", "budget_limits", "savings_goals"],
    icon: "💰",
  },
  {
    id: "loans",
    label: "Loans & EMI",
    description: "Loan records, EMI schedules, payments",
    tables: ["loans", "emi_schedule", "emi_events", "loan_documents"],
    icon: "🏦",
  },
  {
    id: "insurance",
    label: "Insurance",
    description: "Policies, claims, documents",
    tables: ["insurances", "insurance_claims", "insurance_documents", "insurance_claim_documents"],
    icon: "🛡️",
  },
  {
    id: "tasks",
    label: "Tasks & Activity",
    description: "Todos, achievements, activity logs, daily badges",
    tables: ["todos", "achievements", "activity_logs", "daily_badges"],
    icon: "✅",
  },
  {
    id: "study",
    label: "Study Data",
    description: "Study logs, goals, notes, syllabus, library",
    tables: ["study_logs", "study_goals", "notes", "syllabus_documents", "syllabus_topics", "syllabus_modules", "library_items"],
    icon: "📚",
  },
  {
    id: "documents",
    label: "Documents",
    description: "Uploaded documents, education records, work history",
    tables: ["documents", "education_records", "education_documents", "work_history"],
    icon: "📄",
  },
  {
    id: "memories",
    label: "Memories",
    description: "Photos, videos, collections, folders",
    tables: ["memories", "memory_collections", "memory_folders"],
    icon: "📸",
  },
  {
    id: "family",
    label: "Family Tree",
    description: "Family members, relationships, identity documents",
    tables: ["family_members", "family_documents", "family_audit_log", "family_tree_exports"],
    icon: "👨‍👩‍👧‍👦",
  },
  {
    id: "social",
    label: "Social Profiles",
    description: "Connected social accounts, posts",
    tables: ["social_profiles", "social_posts"],
    icon: "🔗",
  },
  {
    id: "vault",
    label: "Vault & Passwords",
    description: "Stored passwords and secure notes",
    tables: ["vault_items"],
    icon: "🔐",
  },
  {
    id: "books",
    label: "eAuthor Books",
    description: "Your authored books, chapters, assets",
    tables: ["books", "book_chapters", "book_sections", "book_assets", "book_comments"],
    icon: "📖",
  },
];

export function AccountResetDialog({ open, onOpenChange }: AccountResetDialogProps) {
  const { user } = useAuth();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [confirmText, setConfirmText] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [step, setStep] = useState<"select" | "confirm">("select");

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const selectAll = () => {
    setSelectedCategories(DATA_CATEGORIES.map((c) => c.id));
  };

  const deselectAll = () => {
    setSelectedCategories([]);
  };

  const handleReset = async () => {
    if (!user || confirmText !== "RESET") return;

    setIsResetting(true);

    try {
      const tablesToDelete: string[] = [];
      
      // Collect all tables from selected categories
      selectedCategories.forEach((catId) => {
        const category = DATA_CATEGORIES.find((c) => c.id === catId);
        if (category) {
          tablesToDelete.push(...category.tables);
        }
      });

      // Delete data from each table
      for (const table of tablesToDelete) {
        try {
          const { error } = await supabase
            .from(table as any)
            .delete()
            .eq("user_id", user.id);

          if (error) {
            console.warn(`Could not delete from ${table}:`, error.message);
          }
        } catch (err) {
          console.warn(`Table ${table} might not exist or has different structure`);
        }
      }

      toast.success("Account data reset successfully", {
        description: `${selectedCategories.length} categories cleared. Your account and email remain intact.`,
      });

      // Reset state
      setSelectedCategories([]);
      setConfirmText("");
      setStep("select");
      onOpenChange(false);
    } catch (error) {
      console.error("Error resetting account:", error);
      toast.error("Failed to reset account data", {
        description: "Please try again or contact support.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleClose = () => {
    setSelectedCategories([]);
    setConfirmText("");
    setStep("select");
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-lg max-h-[85vh] overflow-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-500" />
            Reset Account Data
          </AlertDialogTitle>
          <AlertDialogDescription>
            {step === "select" ? (
              <>
                Start fresh without deleting your account. Your email verification 
                and account credentials will remain intact.
              </>
            ) : (
              <>
                <span className="text-destructive font-medium">
                  This action cannot be undone!
                </span>{" "}
                Selected data will be permanently deleted.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {step === "select" && (
          <div className="space-y-4 py-2">
            {/* Quick actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Deselect All
              </Button>
            </div>

            {/* Categories */}
            <div className="space-y-2 max-h-[300px] overflow-auto pr-2">
              {DATA_CATEGORIES.map((category) => (
                <div
                  key={category.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCategories.includes(category.id)
                      ? "bg-destructive/10 border-destructive/30"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => handleCategoryToggle(category.id)}
                >
                  <Checkbox
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <Label className="font-medium cursor-pointer">
                        {category.label}
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {category.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* What's NOT deleted */}
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-xs font-medium text-green-600 flex items-center gap-1 mb-1">
                <CheckCircle2 className="w-3 h-3" />
                What will NOT be deleted:
              </p>
              <ul className="text-xs text-muted-foreground space-y-0.5 ml-4">
                <li>• Your account & user ID</li>
                <li>• Email verification status</li>
                <li>• Profile settings & avatar</li>
                <li>• Subscription & payment history</li>
              </ul>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4 py-2">
            {/* Summary of what will be deleted */}
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm font-medium text-destructive flex items-center gap-1 mb-2">
                <AlertTriangle className="w-4 h-4" />
                You are about to delete:
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedCategories.map((catId) => {
                  const cat = DATA_CATEGORIES.find((c) => c.id === catId);
                  return (
                    <Badge key={catId} variant="outline" className="text-destructive">
                      {cat?.icon} {cat?.label}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Confirmation input */}
            <div className="space-y-2">
              <Label className="text-sm">
                Type <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-destructive">RESET</span> to confirm
              </Label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="Type RESET"
                className="font-mono"
              />
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>

          {step === "select" && (
            <Button
              variant="destructive"
              onClick={() => setStep("confirm")}
              disabled={selectedCategories.length === 0}
            >
              Continue ({selectedCategories.length} selected)
            </Button>
          )}

          {step === "confirm" && (
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={confirmText !== "RESET" || isResetting}
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset Selected Data
                </>
              )}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}