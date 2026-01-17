import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveClockProps {
  className?: string;
  showDate?: boolean;
  compact?: boolean;
}

export const LiveClock = ({ className, showDate = true, compact = false }: LiveClockProps) => {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const timeString = format(time, compact ? "h:mm a" : "h:mm:ss a");
  const dateString = format(time, "EEE, MMM d, yyyy");
  const dayString = format(time, "EEEE");
  
  if (compact) {
    return (
      <div className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
        <Clock className="w-3 h-3" />
        <span className="font-mono">{timeString}</span>
      </div>
    );
  }
  
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
        <Clock className="w-4 h-4 text-primary" />
        <div className="flex flex-col">
          <span className="text-sm font-mono font-medium text-foreground">{timeString}</span>
          {showDate && (
            <span className="text-[10px] text-muted-foreground">{dateString}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveClock;
