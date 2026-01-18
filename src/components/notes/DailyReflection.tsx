import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format, isToday, parseISO } from "date-fns";
import { 
  X, 
  Sparkles, 
  ChevronRight,
  Calendar,
  Settings
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Switch,
} from "@/components/ui/switch";

// Prompt categories with rotating prompts
const PROMPT_CATEGORIES = {
  reflection: {
    icon: "🧠",
    label: "Reflection",
    prompts: [
      "What stayed with you today?",
      "What did you learn today?",
      "What would you do differently?",
    ],
  },
  gratitude: {
    icon: "💭",
    label: "Gratitude",
    prompts: [
      "Something small you appreciated today?",
      "Who made a difference in your day?",
      "What simple pleasure did you enjoy?",
    ],
  },
  progress: {
    icon: "💼",
    label: "Progress",
    prompts: [
      "One thing you moved forward today?",
      "What progress did you make, however small?",
      "What are you building towards?",
    ],
  },
  finance: {
    icon: "💰",
    label: "Finance",
    prompts: [
      "Did you spend intentionally today?",
      "Any financial decisions worth noting?",
      "What's one thing you saved today?",
    ],
  },
  growth: {
    icon: "🧍",
    label: "Growth",
    prompts: [
      "What challenged you today?",
      "How did you step outside your comfort zone?",
      "What made you uncomfortable but proud?",
    ],
  },
  memory: {
    icon: "🕰",
    label: "Memory",
    prompts: [
      "A moment today you might want to remember?",
      "What made you smile today?",
      "If today were a photo, what would it show?",
    ],
  },
};

type PromptCategory = keyof typeof PROMPT_CATEGORIES;

// Get today's prompt (rotates based on day)
const getTodaysPrompt = (): { category: PromptCategory; prompt: string } => {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 
    (1000 * 60 * 60 * 24)
  );
  
  const categories = Object.keys(PROMPT_CATEGORIES) as PromptCategory[];
  const categoryIndex = dayOfYear % categories.length;
  const category = categories[categoryIndex];
  
  const prompts = PROMPT_CATEGORIES[category].prompts;
  const promptIndex = Math.floor(dayOfYear / categories.length) % prompts.length;
  
  return {
    category,
    prompt: prompts[promptIndex],
  };
};

interface DailyReflectionProps {
  onReflectionSaved?: () => void;
}

export const DailyReflection = ({ onReflectionSaved }: DailyReflectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [reflection, setReflection] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasReflectedToday, setHasReflectedToday] = useState(false);
  const [reflectionsEnabled, setReflectionsEnabled] = useState(true);
  
  const todaysPrompt = getTodaysPrompt();
  const promptConfig = PROMPT_CATEGORIES[todaysPrompt.category];

  // Check if user has already reflected today
  useEffect(() => {
    if (user) {
      checkTodaysReflection();
    }
  }, [user]);

  const checkTodaysReflection = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    
    const { data } = await supabase
      .from("notes")
      .select("id")
      .eq("user_id", user?.id)
      .eq("type", "journal")
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`)
      .limit(1);
    
    setHasReflectedToday((data?.length || 0) > 0);
  };

  const handleSave = async () => {
    if (!user || !reflection.trim()) return;
    
    setIsSaving(true);
    
    try {
      const promptId = `reflection_${format(new Date(), "yyyy_MM_dd")}`;
      
      const contentJson = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: reflection }],
          },
        ],
      };
      
      const { error } = await supabase
        .from("notes")
        .insert([{
          user_id: user.id,
          title: `${promptConfig.icon} ${todaysPrompt.prompt}`,
          content_json: JSON.stringify(contentJson) as any,
          content: reflection,
          type: "journal",
          tags: ["daily-reflection", todaysPrompt.category, promptId],
          visibility: "private",
        }]);
      
      if (error) throw error;
      
      toast({ title: "Reflection saved" });
      setReflection("");
      setIsOpen(false);
      setHasReflectedToday(true);
      onReflectionSaved?.();
    } catch (error) {
      console.error("Error saving reflection:", error);
      toast({ 
        title: "Failed to save", 
        description: "Please try again",
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    setReflection("");
  };

  // Don't show if disabled or already reflected
  if (!reflectionsEnabled || hasReflectedToday) {
    return null;
  }

  return (
    <>
      {/* Subtle Trigger Card */}
      <Card
        className={cn(
          "relative overflow-hidden cursor-pointer transition-all duration-300",
          "bg-gradient-to-br from-card to-muted/30",
          "border-border/50 hover:border-primary/30",
          "hover:shadow-lg hover:shadow-primary/5"
        )}
        onClick={() => setIsOpen(true)}
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{promptConfig.icon}</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Daily Reflection
                </span>
              </div>
              <p className="text-foreground font-medium leading-relaxed">
                {todaysPrompt.prompt}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
          </div>
        </div>
        
        {/* Subtle gradient accent */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
      </Card>

      {/* Reflection Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{promptConfig.icon}</span>
                <div>
                  <DialogTitle className="text-lg font-medium">
                    Daily Reflection
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(), "EEEE, MMMM d")}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Prompt */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
              <p className="text-foreground font-medium text-lg leading-relaxed">
                {todaysPrompt.prompt}
              </p>
            </div>

            {/* Input Area */}
            <div className="relative">
              <Textarea
                value={reflection}
                onChange={(e) => {
                  setReflection(e.target.value);
                  setIsExpanded(e.target.value.length > 100);
                }}
                placeholder="Write a few lines..."
                className={cn(
                  "resize-none transition-all duration-300 border-border/50",
                  "focus:border-primary/30 focus:ring-1 focus:ring-primary/20",
                  "placeholder:text-muted-foreground/50",
                  isExpanded ? "min-h-[200px]" : "min-h-[100px]"
                )}
              />
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {reflection.length > 0 && `${reflection.length} characters`}
              </div>
            </div>

            {/* Info text */}
            <p className="text-xs text-muted-foreground text-center">
              Your reflections are private and only visible to you.
              No pressure, no streaks, no guilt.
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-muted-foreground"
              >
                Skip for today
              </Button>
              <Button
                onClick={handleSave}
                disabled={!reflection.trim() || isSaving}
              >
                {isSaving ? (
                  "Saving..."
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Save Reflection
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reflection Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Daily prompts</p>
                <p className="text-xs text-muted-foreground">
                  Show a gentle reflection prompt
                </p>
              </div>
              <Switch
                checked={reflectionsEnabled}
                onCheckedChange={setReflectionsEnabled}
              />
            </div>
            
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Reflections appear once per day. They're completely optional
                and designed to help you pause and process, not to add pressure.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Mini version for sidebar/dashboard
export const DailyReflectionMini = ({ onReflectionSaved }: DailyReflectionProps) => {
  const todaysPrompt = getTodaysPrompt();
  const promptConfig = PROMPT_CATEGORIES[todaysPrompt.category];
  
  return (
    <div className="p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer">
      <div className="flex items-center gap-2">
        <span className="text-lg">{promptConfig.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Daily Reflection</p>
          <p className="text-sm font-medium text-foreground truncate">
            {todaysPrompt.prompt}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </div>
    </div>
  );
};
