import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Play, Pause, Square, RotateCcw, X, Timer, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useToast } from "@/hooks/use-toast";

interface FloatingTimerProps {
  onComplete: (duration: number, subject: string, plannedDuration: number) => void;
  subjects: string[];
  defaultSubject?: string;
  isOpen: boolean;
  onClose: () => void;
}

type TimerState = "idle" | "running" | "paused";

// Completion sound using Web Audio API
const playCompletionSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a pleasant completion chime
    const playNote = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    // Play a pleasant ascending chime (C5 - E5 - G5)
    playNote(523.25, now, 0.3);        // C5
    playNote(659.25, now + 0.15, 0.3); // E5
    playNote(783.99, now + 0.3, 0.5);  // G5
    
    // Clean up after sounds finish
    setTimeout(() => audioContext.close(), 2000);
  } catch (error) {
    console.log("Could not play completion sound:", error);
  }
};

export const FloatingTimer = ({ 
  onComplete, 
  subjects, 
  defaultSubject = "Programming",
  isOpen,
  onClose,
}: FloatingTimerProps) => {
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [plannedMinutes, setPlannedMinutes] = useState<string>("30");
  const [subject, setSubject] = useState(defaultSubject);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showStopWarning, setShowStopWarning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const timerRef = useRef<HTMLDivElement>(null);
  const { logActivity } = useActivityLog();
  const { toast } = useToast();

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const startTimer = useCallback(() => {
    if (timerState === "idle") {
      startTimeRef.current = new Date();
      logActivity(`Started study session: ${subject}`, "Study");
    }
    setTimerState("running");
    
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, [timerState, subject, logActivity]);

  const pauseTimer = useCallback(() => {
    setTimerState("paused");
    clearTimer();
    logActivity(`Paused study session: ${subject}`, "Study");
  }, [clearTimer, subject, logActivity]);

  const resetTimer = useCallback(() => {
    setTimerState("idle");
    setElapsedSeconds(0);
    startTimeRef.current = null;
    clearTimer();
  }, [clearTimer]);

  const handleFinishClick = () => {
    if (elapsedSeconds >= 60) {
      setShowStopWarning(true);
    }
  };

  const completeSession = useCallback(() => {
    const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    const planned = parseInt(plannedMinutes) || 0;
    
    // Play completion sound
    playCompletionSound();
    
    logActivity(`Completed study session: ${durationMinutes} minutes of ${subject}`, "Study");
    toast({
      title: "Session Complete! 🎉",
      description: `You studied ${subject} for ${durationMinutes} minutes.`,
    });
    
    onComplete(durationMinutes, subject, planned);
    resetTimer();
    setShowStopWarning(false);
  }, [elapsedSeconds, plannedMinutes, subject, onComplete, resetTimer, logActivity, toast]);

  const handleClose = () => {
    if (timerState !== "idle") {
      setShowStopWarning(true);
    } else {
      onClose();
    }
  };

  const handleForceClose = () => {
    clearTimer();
    resetTimer();
    setShowStopWarning(false);
    onClose();
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.code === "Space" && timerState !== "idle") {
        e.preventDefault();
        if (timerState === "running") {
          pauseTimer();
          toast({ title: "Timer paused", description: "Press Space to resume" });
        } else if (timerState === "paused") {
          startTimer();
          toast({ title: "Timer resumed" });
        }
      }
      
      if (e.code === "Escape") {
        e.preventDefault();
        setIsMinimized(true);
        toast({ title: "Timer minimized", description: "Click to expand" });
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, timerState, pauseTimer, startTimer, toast]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const planned = parseInt(plannedMinutes) || 0;
  const progressPercentage = planned > 0 ? Math.min((elapsedMinutes / planned) * 100, 100) : 0;
  const isOvertime = elapsedMinutes > planned && planned > 0;

  if (!isOpen) return null;

  return (
    <>
      {/* Floating Timer Panel */}
      <div 
        ref={timerRef}
        className={cn(
          "fixed z-50 transition-all duration-300 ease-out shadow-2xl",
          isMinimized 
            ? "top-4 right-4 w-auto" 
            : "top-4 right-4 w-80"
        )}
      >
        <div className={cn(
          "bg-card border border-border rounded-xl overflow-hidden backdrop-blur-xl",
          timerState === "running" && "ring-2 ring-primary/50"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
            <div className="flex items-center gap-2">
              <Timer className={cn(
                "w-4 h-4",
                timerState === "running" && "text-primary animate-pulse"
              )} />
              <span className="text-sm font-medium">Study Timer</span>
              {timerState === "running" && (
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Expand" : "Minimize (Escape)"}
              >
                {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleClose}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Content */}
          {isMinimized ? (
            <div 
              className="px-3 py-2 flex items-center gap-2 cursor-pointer"
              onClick={() => setIsMinimized(false)}
            >
              <span className={cn(
                "text-lg font-mono tabular-nums",
                isOvertime && "text-amber-500",
                timerState === "running" && "text-primary"
              )}>
                {formatTime(elapsedSeconds)}
              </span>
              {timerState === "running" ? (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={(e) => { e.stopPropagation(); pauseTimer(); }}
                  title="Pause (Space)"
                >
                  <Pause className="w-3 h-3" />
                </Button>
              ) : timerState === "paused" ? (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={(e) => { e.stopPropagation(); startTimer(); }}
                  title="Resume (Space)"
                >
                  <Play className="w-3 h-3" />
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Timer Display */}
              <div className="text-center py-2">
                <p className={cn(
                  "text-4xl font-light tracking-tight tabular-nums transition-colors",
                  isOvertime ? "text-amber-500" : "text-foreground"
                )}>
                  {formatTime(elapsedSeconds)}
                </p>
                {timerState !== "idle" && planned > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {isOvertime 
                      ? `+${elapsedMinutes - planned}m overtime`
                      : `${planned - elapsedMinutes}m remaining`
                    }
                  </p>
                )}
              </div>

              {/* Progress Bar */}
              {timerState !== "idle" && planned > 0 && (
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      isOvertime ? "bg-amber-500/60" : "bg-primary/50"
                    )}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              )}

              {/* Keyboard shortcuts hint */}
              {timerState !== "idle" && (
                <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Space</kbd>
                    {timerState === "running" ? "Pause" : "Resume"}
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Esc</kbd>
                    Minimize
                  </span>
                </div>
              )}

              {/* Controls */}
              {timerState === "idle" ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Subject</label>
                      <Select value={subject} onValueChange={setSubject}>
                        <SelectTrigger className="h-9 text-sm bg-background border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Minutes</label>
                      <Input
                        type="number"
                        value={plannedMinutes}
                        onChange={(e) => setPlannedMinutes(e.target.value)}
                        placeholder="30"
                        min="1"
                        className="h-9 text-sm bg-background border-border"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={startTimer} 
                    className="w-full"
                    disabled={!plannedMinutes || parseInt(plannedMinutes) <= 0}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Session
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {timerState === "running" ? (
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={pauseTimer}
                        title="Pause (Space)"
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={startTimer}
                        title="Resume (Space)"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Resume
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={resetTimer}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button 
                    className="w-full"
                    onClick={handleFinishClick}
                    disabled={elapsedSeconds < 60}
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Finish Session
                  </Button>
                </div>
              )}

              {/* Session Info */}
              {timerState !== "idle" && (
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                  <span>{subject}</span>
                  <span>Planned: {planned}m</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stop Warning Dialog */}
      <AlertDialog open={showStopWarning} onOpenChange={setShowStopWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End study session?</AlertDialogTitle>
            <AlertDialogDescription>
              You've studied for {Math.round(elapsedSeconds / 60)} minutes. Do you want to save this session or discard it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowStopWarning(false)}>
              Continue Studying
            </AlertDialogCancel>
            <Button 
              variant="outline" 
              onClick={handleForceClose}
              className="text-destructive"
            >
              Discard
            </Button>
            <AlertDialogAction onClick={completeSession}>
              Save & Finish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FloatingTimer;