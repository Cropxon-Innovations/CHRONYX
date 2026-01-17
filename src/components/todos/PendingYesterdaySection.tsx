import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertCircle, Check, ChevronDown, ChevronUp, Flag, ArrowRight, X } from "lucide-react";
import { useActivityLog } from "@/hooks/useActivityLog";

interface Todo {
  id: string;
  text: string;
  status: "pending" | "done" | "skipped";
  date: string;
  priority: "high" | "medium" | "low";
}

interface PendingYesterdaySectionProps {
  pendingTasks: Todo[];
  onTaskUpdate: (id: string, status: "done" | "skipped") => void;
  onMoveToToday: (id: string) => void;
}

const priorityConfig = {
  high: { color: "text-rose-500", bgColor: "bg-rose-500/10" },
  medium: { color: "text-amber-500", bgColor: "bg-amber-500/10" },
  low: { color: "text-slate-400", bgColor: "bg-slate-500/10" },
};

export const PendingYesterdaySection = ({ 
  pendingTasks, 
  onTaskUpdate,
  onMoveToToday 
}: PendingYesterdaySectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { logActivity } = useActivityLog();
  
  if (pendingTasks.length === 0) return null;
  
  const handleComplete = async (id: string) => {
    onTaskUpdate(id, "done");
    const task = pendingTasks.find(t => t.id === id);
    if (task) {
      logActivity(`Completed yesterday's task: ${task.text.substring(0, 30)}`, "Todos");
    }
  };
  
  const handleSkip = async (id: string) => {
    onTaskUpdate(id, "skipped");
    const task = pendingTasks.find(t => t.id === id);
    if (task) {
      logActivity(`Skipped yesterday's task: ${task.text.substring(0, 30)}`, "Todos");
    }
  };

  return (
    <div 
      id="pending-yesterday"
      className="bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-rose-500/5 border border-amber-500/20 rounded-xl overflow-hidden animate-fade-in"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-amber-500/5 transition-colors"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
          </div>
          <div className="text-left">
            <p className="font-medium text-foreground text-sm sm:text-base">Pending from Yesterday</p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {pendingTasks.length} task{pendingTasks.length !== 1 ? "s" : ""} need attention
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-[10px] sm:text-xs hidden sm:inline-flex">
            Action Required
          </Badge>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          )}
        </div>
      </button>
      
      {/* Task List */}
      {isExpanded && (
        <div className="divide-y divide-border/50">
          {pendingTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 sm:p-4 hover:bg-card/50 transition-colors gap-2"
            >
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <button
                  onClick={() => handleComplete(task.id)}
                  className="w-5 h-5 rounded-full border-2 border-amber-500 hover:bg-emerald-500 hover:border-emerald-500 flex items-center justify-center transition-colors group shrink-0"
                >
                  <Check className="w-3 h-3 text-transparent group-hover:text-white" />
                </button>
                
                <Flag className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0", priorityConfig[task.priority].color)} />
                
                <span className="text-xs sm:text-sm text-foreground truncate">{task.text}</span>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <Badge 
                  variant="outline" 
                  className={cn("text-[10px] px-1.5 py-0 hidden xs:inline-flex", priorityConfig[task.priority].bgColor)}
                >
                  {task.priority}
                </Badge>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onMoveToToday(task.id)}
                  className="h-7 px-2 text-xs"
                  title="Move to Today"
                >
                  <ArrowRight className="w-3 h-3 sm:mr-1" />
                  <span className="hidden sm:inline">Today</span>
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSkip(task.id)}
                  className="h-7 px-2 text-xs text-muted-foreground"
                  title="Skip"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
          
          {/* Bulk Actions */}
          {pendingTasks.length > 1 && (
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 p-3 bg-card/30">
              <span className="text-xs text-muted-foreground">
                Quick actions for all {pendingTasks.length} tasks
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => pendingTasks.forEach(t => handleComplete(t.id))}
                  className="h-7 text-xs"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Complete All
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => pendingTasks.forEach(t => onMoveToToday(t.id))}
                  className="h-7 text-xs"
                >
                  <ArrowRight className="w-3 h-3 mr-1" />
                  Move All
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PendingYesterdaySection;
