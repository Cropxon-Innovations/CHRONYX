import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Circle, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

type ViewMode = "day" | "month" | "year";
type TodoStatus = "pending" | "done" | "skipped";

interface Todo {
  id: string;
  text: string;
  status: TodoStatus;
  date: string;
}

const sampleTodos: Todo[] = [
  { id: "1", text: "Morning meditation", status: "done", date: "2024-12-30" },
  { id: "2", text: "Review monthly expenses", status: "pending", date: "2024-12-30" },
  { id: "3", text: "Read 20 pages", status: "done", date: "2024-12-30" },
  { id: "4", text: "Exercise for 30 minutes", status: "pending", date: "2024-12-30" },
  { id: "5", text: "Call parents", status: "skipped", date: "2024-12-30" },
  { id: "6", text: "Write journal entry", status: "pending", date: "2024-12-30" },
];

const Todos = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [todos, setTodos] = useState<Todo[]>(sampleTodos);

  const toggleStatus = (id: string) => {
    setTodos(todos.map(todo => {
      if (todo.id === id) {
        const statusOrder: TodoStatus[] = ["pending", "done", "skipped"];
        const currentIndex = statusOrder.indexOf(todo.status);
        const nextIndex = (currentIndex + 1) % statusOrder.length;
        return { ...todo, status: statusOrder[nextIndex] };
      }
      return todo;
    }));
  };

  const completed = todos.filter(t => t.status === "done").length;
  const total = todos.length;
  const streak = 12; // Sample streak

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between">
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
          <p className="text-3xl font-semibold text-foreground">{Math.round((completed / total) * 100)}%</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Completion Rate</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-3xl font-semibold text-vyom-accent">{streak}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Day Streak</p>
        </div>
      </div>

      {/* Todo List */}
      <div className="bg-card border border-border rounded-lg divide-y divide-border">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className="flex items-center justify-between p-4 hover:bg-accent/30 transition-colors"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleStatus(todo.id)}
                className="focus:outline-none"
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
              <span className={cn(
                "text-sm",
                todo.status === "done" && "text-muted-foreground line-through",
                todo.status === "skipped" && "text-muted-foreground"
              )}>
                {todo.text}
              </span>
            </div>
            <span className={cn(
              "text-xs px-2 py-1 rounded",
              todo.status === "done" && "bg-vyom-success/10 text-vyom-success",
              todo.status === "pending" && "bg-muted text-muted-foreground",
              todo.status === "skipped" && "bg-muted text-muted-foreground"
            )}>
              {todo.status}
            </span>
          </div>
        ))}
      </div>

      {/* Add Todo */}
      <Button variant="vyom" className="w-full">
        + Add Task
      </Button>
    </div>
  );
};

export default Todos;
