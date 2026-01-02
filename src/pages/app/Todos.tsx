import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Check, Circle, MoreHorizontal, X, Pencil, Trash2, Plus, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useActivityLog } from "@/hooks/useActivityLog";
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, startOfWeek, endOfWeek } from "date-fns";

type ViewMode = "day" | "week" | "month";
type TodoStatus = "pending" | "done" | "skipped";

interface Todo {
  id: string;
  text: string;
  status: TodoStatus;
  date: string;
}

const statusConfig = {
  pending: { label: "To Do", color: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  done: { label: "Completed", color: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  skipped: { label: "Skipped", color: "bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30" },
};

const Todos = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todos, setTodos] = useState<Todo[]>([]);
  const [allTodos, setAllTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodoText, setNewTodoText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLog();

  useEffect(() => {
    if (user) {
      fetchAllTodos();
    }
  }, [user]);

  useEffect(() => {
    filterTodosByView();
  }, [allTodos, selectedDate, viewMode]);

  const fetchAllTodos = async () => {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching todos:", error);
    } else {
      setAllTodos((data || []).map(t => ({
        ...t,
        status: t.status as TodoStatus
      })));
    }
    setLoading(false);
  };

  const filterTodosByView = () => {
    let filtered: Todo[] = [];
    
    if (viewMode === "day") {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      filtered = allTodos.filter(t => t.date === dateStr);
    } else if (viewMode === "week") {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      filtered = allTodos.filter(t => {
        const todoDate = parseISO(t.date);
        return todoDate >= weekStart && todoDate <= weekEnd;
      });
    } else {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      filtered = allTodos.filter(t => {
        const todoDate = parseISO(t.date);
        return todoDate >= monthStart && todoDate <= monthEnd;
      });
    }
    
    setTodos(filtered);
  };

  const navigateDate = (direction: "prev" | "next") => {
    if (viewMode === "day") {
      setSelectedDate(direction === "prev" ? subDays(selectedDate, 1) : addDays(selectedDate, 1));
    } else if (viewMode === "week") {
      setSelectedDate(direction === "prev" ? subDays(selectedDate, 7) : addDays(selectedDate, 7));
    } else {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() + (direction === "prev" ? -1 : 1));
      setSelectedDate(newDate);
    }
  };

  const addTodo = async () => {
    if (!newTodoText.trim() || !user) return;

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const { data, error } = await supabase
      .from("todos")
      .insert({
        text: newTodoText.trim(),
        user_id: user.id,
        status: "pending",
        date: dateStr,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to add todo", variant: "destructive" });
    } else if (data) {
      setAllTodos([{ ...data, status: data.status as TodoStatus }, ...allTodos]);
      setNewTodoText("");
      setIsAdding(false);
      toast({ title: "Task added" });
      logActivity(`Added task: ${data.text.substring(0, 30)}${data.text.length > 30 ? '...' : ''}`, "Todos");
    }
  };

  const updateTodoStatus = async (id: string, status: TodoStatus) => {
    const todo = allTodos.find(t => t.id === id);
    const { error } = await supabase
      .from("todos")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } else {
      setAllTodos(allTodos.map(t => t.id === id ? { ...t, status } : t));
      if (todo) {
        const statusText = status === "done" ? "Completed" : status === "skipped" ? "Skipped" : "Marked pending";
        logActivity(`${statusText} task: ${todo.text.substring(0, 30)}${todo.text.length > 30 ? '...' : ''}`, "Todos");
      }
    }
  };

  const updateTodoText = async (id: string) => {
    if (!editText.trim()) return;

    const { error } = await supabase
      .from("todos")
      .update({ text: editText.trim() })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to update todo", variant: "destructive" });
    } else {
      setAllTodos(allTodos.map(t => t.id === id ? { ...t, text: editText.trim() } : t));
      setEditingId(null);
      setEditText("");
      logActivity(`Updated task: ${editText.trim().substring(0, 30)}${editText.trim().length > 30 ? '...' : ''}`, "Todos");
    }
  };

  const deleteTodo = async (id: string) => {
    const todo = allTodos.find(t => t.id === id);
    const { error } = await supabase
      .from("todos")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete todo", variant: "destructive" });
    } else {
      setAllTodos(allTodos.filter(t => t.id !== id));
      toast({ title: "Task deleted" });
      if (todo) {
        logActivity(`Deleted task: ${todo.text.substring(0, 30)}${todo.text.length > 30 ? '...' : ''}`, "Todos");
      }
    }
  };

  const toggleStatus = (id: string, currentStatus: TodoStatus) => {
    const statusOrder: TodoStatus[] = ["pending", "done", "skipped"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    updateTodoStatus(id, nextStatus);
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  // Group todos by date for week/month view
  const groupedTodos = todos.reduce((acc, todo) => {
    if (!acc[todo.date]) acc[todo.date] = [];
    acc[todo.date].push(todo);
    return acc;
  }, {} as Record<string, Todo[]>);

  const completed = todos.filter(t => t.status === "done").length;
  const skipped = todos.filter(t => t.status === "skipped").length;
  const pending = todos.filter(t => t.status === "pending").length;
  const total = todos.length;

  const getDateLabel = () => {
    if (viewMode === "day") return format(selectedDate, "EEEE, MMMM d, yyyy");
    if (viewMode === "week") {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
    }
    return format(selectedDate, "MMMM yyyy");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-foreground tracking-wide">Todos</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your tasks by date</p>
        </div>

        {/* View Toggle */}
        <div className="flex bg-muted rounded-lg p-1">
          {(["day", "week", "month"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "px-4 py-1.5 text-sm rounded-md transition-colors capitalize",
                viewMode === mode
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </header>

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-card border border-border rounded-lg p-4">
        <Button variant="ghost" size="icon" onClick={() => navigateDate("prev")}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium text-foreground">{getDateLabel()}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigateDate("next")}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-2xl font-semibold text-foreground">{total}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Total</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{completed}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Completed</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{pending}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">To Do</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-2xl font-semibold text-slate-600 dark:text-slate-400">{skipped}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Skipped</p>
        </div>
      </div>

      {/* Todo List - Day View */}
      {viewMode === "day" && (
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {todos.length === 0 && !isAdding ? (
            <div className="p-8 text-center text-muted-foreground">
              No tasks for {format(selectedDate, "MMMM d")}. Add your first task below.
            </div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center justify-between p-4 hover:bg-accent/30 transition-colors group"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <button
                    onClick={() => toggleStatus(todo.id, todo.status)}
                    className="focus:outline-none flex-shrink-0"
                  >
                    {todo.status === "done" ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    ) : todo.status === "skipped" ? (
                      <div className="w-5 h-5 rounded-full bg-slate-400 flex items-center justify-center">
                        <MoreHorizontal className="w-3 h-3 text-white" />
                      </div>
                    ) : (
                      <Circle className="w-5 h-5 text-amber-500" />
                    )}
                  </button>

                  {editingId === todo.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") updateTodoText(todo.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Button size="sm" variant="ghost" onClick={() => updateTodoText(todo.id)}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={cn(
                        "text-sm truncate",
                        todo.status === "done" && "text-muted-foreground line-through",
                        todo.status === "skipped" && "text-muted-foreground"
                      )}>
                        {todo.text}
                      </span>
                      <Badge variant="outline" className={cn("text-xs shrink-0", statusConfig[todo.status].color)}>
                        {statusConfig[todo.status].label}
                      </Badge>
                    </div>
                  )}
                </div>

                {editingId !== todo.id && (
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" onClick={() => startEditing(todo)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteTodo(todo.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Add Todo Inline */}
          {isAdding && (
            <div className="flex items-center gap-4 p-4">
              <Plus className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <Input
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addTodo();
                  if (e.key === "Escape") setIsAdding(false);
                }}
                placeholder="What needs to be done?"
                className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 p-0"
                autoFocus
              />
              <Button size="sm" variant="ghost" onClick={addTodo}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Todo List - Week/Month View (Grouped by Date) */}
      {(viewMode === "week" || viewMode === "month") && (
        <div className="space-y-4">
          {Object.keys(groupedTodos).length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
              No tasks for this {viewMode}. Switch to day view to add tasks.
            </div>
          ) : (
            Object.entries(groupedTodos)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, dateTodos]) => (
                <div key={date} className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2 border-b border-border flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground">
                      {format(parseISO(date), "EEEE, MMMM d")}
                    </span>
                    <div className="flex gap-2">
                      <Badge variant="outline" className={cn("text-xs", statusConfig.done.color)}>
                        {dateTodos.filter(t => t.status === "done").length} done
                      </Badge>
                      <Badge variant="outline" className={cn("text-xs", statusConfig.pending.color)}>
                        {dateTodos.filter(t => t.status === "pending").length} to do
                      </Badge>
                    </div>
                  </div>
                  <div className="divide-y divide-border">
                    {dateTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className="flex items-center justify-between p-3 hover:bg-accent/30 transition-colors group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            onClick={() => toggleStatus(todo.id, todo.status)}
                            className="focus:outline-none flex-shrink-0"
                          >
                            {todo.status === "done" ? (
                              <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-white" />
                              </div>
                            ) : todo.status === "skipped" ? (
                              <div className="w-4 h-4 rounded-full bg-slate-400 flex items-center justify-center">
                                <MoreHorizontal className="w-2.5 h-2.5 text-white" />
                              </div>
                            ) : (
                              <Circle className="w-4 h-4 text-amber-500" />
                            )}
                          </button>
                          <span className={cn(
                            "text-sm truncate",
                            todo.status === "done" && "text-muted-foreground line-through",
                            todo.status === "skipped" && "text-muted-foreground"
                          )}>
                            {todo.text}
                          </span>
                          <Badge variant="outline" className={cn("text-xs shrink-0", statusConfig[todo.status].color)}>
                            {statusConfig[todo.status].label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => deleteTodo(todo.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* Add Todo Button (Day View Only) */}
      {viewMode === "day" && !isAdding && (
        <Button variant="vyom" className="w-full" onClick={() => setIsAdding(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task for {format(selectedDate, "MMM d")}
        </Button>
      )}
    </div>
  );
};

export default Todos;
