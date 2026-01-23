import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { BookOpen, Check, Clock, ChevronRight, Calendar, ListTodo } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface StudyTodo {
  id: string;
  text: string;
  status: string;
  date: string;
  priority: string;
  category: string | null;
  linked_topic_id: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_hours: number | null;
}

export const StudyTodosWidget = () => {
  const { user } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: studyTodos = [], isLoading, refetch } = useQuery({
    queryKey: ["study-todos", user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("date", today)
        .eq("category", "study")
        .order("start_time", { ascending: true, nullsFirst: false })
        .order("priority", { ascending: true });
      
      if (error) throw error;
      return data as StudyTodo[];
    },
    enabled: !!user,
  });

  const markComplete = async (id: string) => {
    const { error } = await supabase
      .from("todos")
      .update({ status: "done" })
      .eq("id", id);

    if (!error) {
      toast.success("Study task completed! 📚");
      refetch();
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl border border-border bg-card animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-3" />
        <div className="space-y-2">
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const pendingTodos = studyTodos.filter(t => t.status === "pending");
  const completedTodos = studyTodos.filter(t => t.status === "done");

  if (studyTodos.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-border bg-muted/20">
        <div className="flex items-center gap-3 text-muted-foreground">
          <ListTodo className="w-5 h-5" />
          <div className="flex-1">
            <p className="text-sm font-medium">No study tasks for today</p>
            <p className="text-xs">Add tasks with "Study" category in Todos</p>
          </div>
          <Link to="/app/todos">
            <Button variant="outline" size="sm" className="gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Todos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="font-medium text-foreground">Today's Study Tasks</span>
          <Badge variant="secondary" className="text-xs">
            {pendingTodos.length} pending
          </Badge>
        </div>
        <Link to="/app/todos" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          All Todos <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Tasks List */}
      <div className="divide-y divide-border/50">
        {pendingTodos.map(todo => (
          <div
            key={todo.id}
            className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
          >
            <button
              onClick={() => markComplete(todo.id)}
              className="w-5 h-5 rounded-full border-2 border-primary hover:bg-primary/20 flex items-center justify-center transition-colors group"
            >
              <Check className="w-3 h-3 text-transparent group-hover:text-primary" />
            </button>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{todo.text}</p>
              {(todo.start_time || todo.duration_hours) && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {todo.start_time && todo.end_time 
                    ? `${todo.start_time.slice(0,5)} - ${todo.end_time.slice(0,5)}`
                    : todo.duration_hours 
                      ? `${todo.duration_hours}h`
                      : ""
                  }
                </p>
              )}
            </div>

            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px]",
                todo.priority === "high" && "border-rose-500/30 text-rose-500",
                todo.priority === "medium" && "border-amber-500/30 text-amber-500",
                todo.priority === "low" && "border-muted-foreground/30"
              )}
            >
              {todo.priority}
            </Badge>
          </div>
        ))}

        {completedTodos.length > 0 && (
          <div className="px-4 py-2 bg-muted/20">
            <p className="text-xs text-muted-foreground">
              ✅ {completedTodos.length} completed today
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyTodosWidget;
