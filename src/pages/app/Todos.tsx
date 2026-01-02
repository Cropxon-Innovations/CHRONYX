import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Check, Circle, MoreHorizontal, X, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useActivityLog } from "@/hooks/useActivityLog";

type ViewMode = "day" | "month" | "year";
type TodoStatus = "pending" | "done" | "skipped";

interface Todo {
  id: string;
  text: string;
  status: TodoStatus;
  date: string;
}

const Todos = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [todos, setTodos] = useState<Todo[]>([]);
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
      fetchTodos();
    }
  }, [user]);

  const fetchTodos = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("date", today)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching todos:", error);
    } else {
      setTodos((data || []).map(t => ({
        ...t,
        status: t.status as TodoStatus
      })));
    }
    setLoading(false);
  };

  const addTodo = async () => {
    if (!newTodoText.trim() || !user) return;

    const { data, error } = await supabase
      .from("todos")
      .insert({
        text: newTodoText.trim(),
        user_id: user.id,
        status: "pending",
        date: new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to add todo", variant: "destructive" });
    } else if (data) {
      setTodos([...todos, { ...data, status: data.status as TodoStatus }]);
      setNewTodoText("");
      setIsAdding(false);
      toast({ title: "Task added" });
      logActivity(`Added task: ${data.text.substring(0, 30)}${data.text.length > 30 ? '...' : ''}`, "Todos");
    }
  };

  const updateTodoStatus = async (id: string, status: TodoStatus) => {
    const todo = todos.find(t => t.id === id);
    const { error } = await supabase
      .from("todos")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } else {
      setTodos(todos.map(t => t.id === id ? { ...t, status } : t));
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
      setTodos(todos.map(t => t.id === id ? { ...t, text: editText.trim() } : t));
      setEditingId(null);
      setEditText("");
      logActivity(`Updated task: ${editText.trim().substring(0, 30)}${editText.trim().length > 30 ? '...' : ''}`, "Todos");
    }
  };

  const deleteTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    const { error } = await supabase
      .from("todos")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete todo", variant: "destructive" });
    } else {
      setTodos(todos.filter(t => t.id !== id));
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

  const completed = todos.filter(t => t.status === "done").length;
  const total = todos.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-foreground tracking-wide">Todos</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your daily tasks</p>
        </div>

        {/* View Toggle */}
        <div className="flex bg-muted rounded-lg p-1">
          {(["day", "month", "year"] as ViewMode[]).map((mode) => (
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-3xl font-semibold text-foreground">{completed}/{total}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Completed</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-3xl font-semibold text-foreground">
            {total > 0 ? Math.round((completed / total) * 100) : 0}%
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Rate</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-3xl font-semibold text-vyom-accent">{total}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Total</p>
        </div>
      </div>

      {/* Todo List */}
      <div className="bg-card border border-border rounded-lg divide-y divide-border">
        {todos.length === 0 && !isAdding ? (
          <div className="p-8 text-center text-muted-foreground">
            No tasks for today. Add your first task below.
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
                    <div className="w-5 h-5 rounded-full bg-vyom-success flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  ) : todo.status === "skipped" ? (
                    <div className="w-5 h-5 rounded-full bg-muted-foreground/50 flex items-center justify-center">
                      <MoreHorizontal className="w-3 h-3 text-primary-foreground" />
                    </div>
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
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
                  <span className={cn(
                    "text-sm truncate",
                    todo.status === "done" && "text-muted-foreground line-through",
                    todo.status === "skipped" && "text-muted-foreground"
                  )}>
                    {todo.text}
                  </span>
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

      {/* Add Todo Button */}
      {!isAdding && (
        <Button variant="vyom" className="w-full" onClick={() => setIsAdding(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      )}
    </div>
  );
};

export default Todos;
