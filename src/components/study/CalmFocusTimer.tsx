import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CalmFocusTimerProps {
  onComplete?: (duration: number, subject: string) => void;
  onClose?: () => void;
  subjects?: string[];
  defaultSubject?: string;
  isOpen?: boolean;
}

type TimerState = "idle" | "running" | "paused" | "break";

// Pomodoro durations in minutes
const FOCUS_DURATION = 25;
const BREAK_DURATION = 5;

// Ambient sounds
const AMBIENT_SOUNDS = [
  { id: "silence", label: "Silence" },
  { id: "rain", label: "Rain" },
  { id: "brown-noise", label: "Brown Noise" },
  { id: "forest", label: "Forest" },
];

export const CalmFocusTimer = ({
  onComplete,
  onClose,
  subjects = ["General"],
  defaultSubject = "General",
  isOpen = true,
}: CalmFocusTimerProps) => {
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [timeRemaining, setTimeRemaining] = useState(FOCUS_DURATION * 60);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [subject, setSubject] = useState(defaultSubject);
  const [ambientSound, setAmbientSound] = useState("silence");
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Start timer
  const startTimer = useCallback(() => {
    setTimerState("running");
    startTimeRef.current = Date.now();
    
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Timer complete
          clearInterval(intervalRef.current!);
          
          if (timerState === "running") {
            // Focus session complete, start break
            setTotalFocusTime((t) => t + FOCUS_DURATION);
            setTimerState("break");
            setTimeRemaining(BREAK_DURATION * 60);
            
            // Play gentle completion sound
            if (soundEnabled) {
              // Gentle fade sound instead of alarm
              const audio = new Audio("/sounds/gentle-complete.mp3");
              audio.volume = 0.3;
              audio.play().catch(() => {});
            }
          } else {
            // Break complete
            setTimerState("idle");
            setTimeRemaining(FOCUS_DURATION * 60);
          }
          
          return prev;
        }
        return prev - 1;
      });
    }, 1000);
  }, [timerState, soundEnabled]);

  // Pause timer
  const pauseTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setTimerState("paused");
  };

  // Resume timer
  const resumeTimer = () => {
    startTimer();
  };

  // Reset timer
  const resetTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setTimerState("idle");
    setTimeRemaining(FOCUS_DURATION * 60);
  };

  // End session and save
  const endSession = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    const sessionMinutes = totalFocusTime + Math.floor((FOCUS_DURATION * 60 - timeRemaining) / 60);
    if (sessionMinutes > 0) {
      onComplete?.(sessionMinutes, subject);
    }
    
    resetTimer();
    setTotalFocusTime(0);
    onClose?.();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  // Calculate progress percentage
  const totalSeconds = timerState === "break" ? BREAK_DURATION * 60 : FOCUS_DURATION * 60;
  const progress = ((totalSeconds - timeRemaining) / totalSeconds) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md mx-auto p-8 space-y-8">
        {/* Close button */}
        <div className="absolute top-4 right-4">
          <Button variant="ghost" size="icon" onClick={endSession}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-light text-foreground mb-2">
            {timerState === "break" ? "Break Time" : "Focus Session"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {timerState === "break" 
              ? "Rest your eyes, stretch, breathe"
              : "Stay present with your work"
            }
          </p>
        </div>

        {/* Timer Display */}
        <div className="relative flex items-center justify-center">
          {/* Progress ring */}
          <svg className="w-64 h-64 transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-muted"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
              className={cn(
                "transition-all duration-1000",
                timerState === "break" ? "text-green-500/50" : "text-primary/60"
              )}
            />
          </svg>
          
          {/* Time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-extralight text-foreground tracking-tight">
              {formatTime(timeRemaining)}
            </span>
            {totalFocusTime > 0 && (
              <span className="text-sm text-muted-foreground mt-2">
                Total: {totalFocusTime} min
              </span>
            )}
          </div>
        </div>

        {/* Subject selector (only when idle) */}
        {timerState === "idle" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Subject (optional)</label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="bg-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {subjects.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Ambient Sound</label>
              <Select value={ambientSound} onValueChange={setAmbientSound}>
                <SelectTrigger className="bg-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {AMBIENT_SOUNDS.map((sound) => (
                    <SelectItem key={sound.id} value={sound.id}>
                      {sound.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {timerState === "idle" && (
            <Button onClick={startTimer} size="lg" className="gap-2 px-8">
              <Play className="w-5 h-5" />
              Start
            </Button>
          )}

          {timerState === "running" && (
            <>
              <Button variant="outline" onClick={pauseTimer} size="lg" className="gap-2">
                <Pause className="w-5 h-5" />
                Pause
              </Button>
              <Button variant="ghost" onClick={resetTimer} size="lg">
                <RotateCcw className="w-5 h-5" />
              </Button>
            </>
          )}

          {timerState === "paused" && (
            <>
              <Button onClick={resumeTimer} size="lg" className="gap-2 px-8">
                <Play className="w-5 h-5" />
                Resume
              </Button>
              <Button variant="ghost" onClick={resetTimer} size="lg">
                <RotateCcw className="w-5 h-5" />
              </Button>
            </>
          )}

          {timerState === "break" && (
            <Button onClick={() => {
              if (intervalRef.current) clearInterval(intervalRef.current);
              setTimerState("idle");
              setTimeRemaining(FOCUS_DURATION * 60);
            }} size="lg" className="gap-2">
              <Play className="w-5 h-5" />
              Start Next Focus
            </Button>
          )}
        </div>

        {/* Sound toggle */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-muted-foreground"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 mr-2" />
            ) : (
              <VolumeX className="w-4 h-4 mr-2" />
            )}
            {soundEnabled ? "Sound on" : "Sound off"}
          </Button>
        </div>

        {/* Tip */}
        <p className="text-center text-xs text-muted-foreground/70">
          Tip: Close your eyes for a moment between sessions
        </p>
      </div>
    </div>
  );
};
