import { useState, useEffect } from "react";
import { format, isToday, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Calendar, 
  Plus, 
  ArrowRight, 
  Sparkles,
  Sun,
  Moon,
  Coffee,
  Sunset
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DailyNote {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface NoteflowDailyNoteProps {
  onOpenNote: (noteId: string) => void;
  onCreateDailyNote: () => void;
}

const getTimeOfDayGreeting = (): { greeting: string; icon: React.ElementType } => {
  const hour = new Date().getHours();
  if (hour < 6) return { greeting: "Good night", icon: Moon };
  if (hour < 12) return { greeting: "Good morning", icon: Coffee };
  if (hour < 17) return { greeting: "Good afternoon", icon: Sun };
  if (hour < 21) return { greeting: "Good evening", icon: Sunset };
  return { greeting: "Good night", icon: Moon };
};

export const NoteflowDailyNote = ({
  onOpenNote,
  onCreateDailyNote,
}: NoteflowDailyNoteProps) => {
  const { user } = useAuth();
  const [todayNote, setTodayNote] = useState<DailyNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  const { greeting, icon: GreetingIcon } = getTimeOfDayGreeting();

  useEffect(() => {
    if (user) {
      fetchTodayNote();
      calculateStreak();
    }
  }, [user]);

  const fetchTodayNote = async () => {
    if (!user) return;

    const todayStart = startOfDay(new Date()).toISOString();
    
    const { data, error } = await supabase
      .from("notes")
      .select("id, title, created_at, updated_at")
      .eq("user_id", user.id)
      .eq("type", "journal")
      .gte("created_at", todayStart)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      setTodayNote(data[0]);
    }
    setLoading(false);
  };

  const calculateStreak = async () => {
    if (!user) return;

    // Get all journal entries ordered by date
    const { data, error } = await supabase
      .from("notes")
      .select("created_at")
      .eq("user_id", user.id)
      .eq("type", "journal")
      .order("created_at", { ascending: false });

    if (error || !data) return;

    // Calculate streak
    let currentStreak = 0;
    const today = startOfDay(new Date());
    let checkDate = today;

    // Group notes by date
    const notesByDate = new Map<string, boolean>();
    data.forEach((note) => {
      const dateKey = format(new Date(note.created_at), "yyyy-MM-dd");
      notesByDate.set(dateKey, true);
    });

    // Count consecutive days
    while (true) {
      const dateKey = format(checkDate, "yyyy-MM-dd");
      if (notesByDate.has(dateKey)) {
        currentStreak++;
        checkDate = new Date(checkDate.getTime() - 86400000); // Previous day
      } else if (isToday(checkDate)) {
        // Today hasn't been logged yet, that's okay for the streak
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else {
        break;
      }
    }

    setStreak(currentStreak);
  };

  if (loading) {
    return null;
  }

  return (
    <Card className="border-border/50 bg-gradient-to-br from-primary/5 via-background to-purple-500/5 overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <GreetingIcon className="w-4 h-4 text-amber-500" />
                {greeting}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </p>
            </div>
          </div>

          {streak > 0 && (
            <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Sparkles className="w-3 h-3" />
              {streak} day streak
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {todayNote ? (
          <button
            onClick={() => onOpenNote(todayNote.id)}
            className={cn(
              "w-full p-4 rounded-xl border border-border/50 bg-card/50",
              "hover:bg-card hover:border-primary/30 transition-all duration-200",
              "text-left group"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  {todayNote.title || "Today's Note"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Last updated {format(new Date(todayNote.updated_at), "h:mm a")}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </button>
        ) : (
          <Button
            variant="outline"
            onClick={onCreateDailyNote}
            className="w-full justify-center gap-2 h-12 border-dashed hover:border-primary/50 hover:bg-primary/5"
          >
            <Plus className="w-4 h-4" />
            Start Today's Note
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
