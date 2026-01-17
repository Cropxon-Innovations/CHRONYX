import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  CheckSquare, 
  Clock, 
  RefreshCw,
  Pin,
  PinOff,
  Minimize2,
  Maximize2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";

interface Todo {
  id: string;
  text: string;
  status: "pending" | "done" | "skipped";
  date: string;
  priority: "high" | "medium" | "low";
}

interface CollapsibleTodosProps {
  isPinned: boolean;
  onTogglePin: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const CollapsibleTodos = ({ isPinned, onTogglePin, isCollapsed, onToggleCollapse }: CollapsibleTodosProps) => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const today = format(new Date(), "yyyy-MM-dd");

  const fetchTodos = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("todos")
        .select("id, text, status, date, priority")
        .eq("user_id", user.id)
        .eq("date", today)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setTodos(data as Todo[]);
      }
    } catch (error) {
      console.error("Error fetching todos:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, today]);

  useEffect(() => {
    if (user) fetchTodos();
  }, [user, fetchTodos]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('todos-floating')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos', filter: `user_id=eq.${user.id}` },
        () => fetchTodos()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchTodos]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTodos();
  };

  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.status === "done").length,
    pending: todos.filter(t => t.status === "pending").length,
    high: todos.filter(t => t.priority === "high" && t.status === "pending").length,
    medium: todos.filter(t => t.priority === "medium" && t.status === "pending").length,
    low: todos.filter(t => t.priority === "low" && t.status === "pending").length,
    completionRate: todos.length > 0 ? Math.round((todos.filter(t => t.status === "done").length / todos.length) * 100) : 0,
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 animate-pulse">
        <div className="h-4 bg-muted rounded w-20 mb-2"></div>
        <div className="h-6 bg-muted rounded w-24"></div>
      </div>
    );
  }

  // Minimized view
  if (isCollapsed) {
    return (
      <div 
        className="bg-card border border-border rounded-lg p-2 flex items-center gap-2 cursor-pointer hover:bg-accent/30 transition-colors" 
        onClick={onToggleCollapse}
      >
        <CheckSquare className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">
          {stats.completed}/{stats.total}
        </span>
        <span className="text-xs text-muted-foreground">tasks</span>
        <div className="ml-auto flex items-center gap-1">
          {stats.pending > 0 && (
            <span className="text-xs text-amber-500">{stats.pending} left</span>
          )}
          <Maximize2 className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today's Tasks</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onTogglePin} title={isPinned ? "Unpin" : "Pin to screen"}>
            {isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggleCollapse}>
            <Minimize2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 space-y-3">
        {/* Completion Stats */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Completion</span>
            <span className="text-xs font-medium">{stats.completionRate}%</span>
          </div>
          <Progress value={stats.completionRate} className="h-2" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-emerald-500/10 rounded p-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <div>
              <p className="text-lg font-bold text-emerald-500">{stats.completed}</p>
              <p className="text-[10px] text-muted-foreground">Done</p>
            </div>
          </div>
          <div className="bg-amber-500/10 rounded p-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-lg font-bold text-amber-500">{stats.pending}</p>
              <p className="text-[10px] text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>

        {/* Priority Breakdown */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between h-7 px-2 text-xs">
              <span>Priority Breakdown</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-3 h-3 text-destructive" />
                  <span className="text-muted-foreground">High Priority</span>
                </div>
                <span className={cn("font-medium", stats.high > 0 ? "text-destructive" : "text-muted-foreground")}>
                  {stats.high} pending
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-3 h-3 text-amber-500" />
                  <span className="text-muted-foreground">Medium Priority</span>
                </div>
                <span className={cn("font-medium", stats.medium > 0 ? "text-amber-500" : "text-muted-foreground")}>
                  {stats.medium} pending
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-3 h-3 text-blue-500" />
                  <span className="text-muted-foreground">Low Priority</span>
                </div>
                <span className={cn("font-medium", stats.low > 0 ? "text-blue-500" : "text-muted-foreground")}>
                  {stats.low} pending
                </span>
              </div>
            </div>

            {/* Pending Tasks List */}
            {stats.pending > 0 && (
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Pending Tasks</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {todos
                    .filter(t => t.status === "pending")
                    .slice(0, 5)
                    .map((todo) => (
                      <div 
                        key={todo.id} 
                        className={cn(
                          "text-xs p-1.5 rounded flex items-center gap-2",
                          todo.priority === "high" && "bg-destructive/10",
                          todo.priority === "medium" && "bg-amber-500/10",
                          todo.priority === "low" && "bg-blue-500/10"
                        )}
                      >
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          todo.priority === "high" && "bg-destructive",
                          todo.priority === "medium" && "bg-amber-500",
                          todo.priority === "low" && "bg-blue-500"
                        )} />
                        <span className="truncate">{todo.text}</span>
                      </div>
                    ))}
                  {stats.pending > 5 && (
                    <p className="text-[10px] text-muted-foreground text-center">
                      +{stats.pending - 5} more
                    </p>
                  )}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default CollapsibleTodos;
