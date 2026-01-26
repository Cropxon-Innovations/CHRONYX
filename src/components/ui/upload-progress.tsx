import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, XCircle, Upload, Download } from "lucide-react";

interface UploadProgressProps {
  progress: number;
  stage: "idle" | "preparing" | "uploading" | "processing" | "complete" | "error" | "downloading";
  message?: string;
  className?: string;
  variant?: "bar" | "ring" | "minimal";
  size?: "sm" | "md" | "lg";
  showPercentage?: boolean;
}

const UploadProgress = React.forwardRef<HTMLDivElement, UploadProgressProps>(
  ({ 
    progress, 
    stage, 
    message, 
    className, 
    variant = "bar",
    size = "md",
    showPercentage = true
  }, ref) => {
    const isActive = stage === "uploading" || stage === "downloading" || stage === "processing";
    const isComplete = stage === "complete";
    const isError = stage === "error";
    const isPreparing = stage === "preparing";
    
    const sizeClasses = {
      sm: { ring: "w-8 h-8", icon: "w-3 h-3", text: "text-[10px]", bar: "h-1" },
      md: { ring: "w-12 h-12", icon: "w-4 h-4", text: "text-xs", bar: "h-1.5" },
      lg: { ring: "w-16 h-16", icon: "w-5 h-5", text: "text-sm", bar: "h-2" },
    };

    const sizes = sizeClasses[size];
    
    // Ring variant - circular progress
    if (variant === "ring") {
      const circumference = 2 * Math.PI * 40;
      const strokeDashoffset = circumference - (progress / 100) * circumference;
      
      return (
        <div ref={ref} className={cn("flex flex-col items-center gap-2", className)}>
          <div className={cn("relative", sizes.ring)}>
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/30"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={isPreparing ? circumference : strokeDashoffset}
                className={cn(
                  "transition-all duration-300",
                  isError ? "text-destructive" : 
                  isComplete ? "text-emerald-500" : 
                  "text-primary"
                )}
              />
            </svg>
            {/* Center icon/percentage */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isPreparing ? (
                <Loader2 className={cn(sizes.icon, "animate-spin text-muted-foreground")} />
              ) : isComplete ? (
                <CheckCircle2 className={cn(sizes.icon, "text-emerald-500")} />
              ) : isError ? (
                <XCircle className={cn(sizes.icon, "text-destructive")} />
              ) : showPercentage ? (
                <span className={cn("font-semibold", sizes.text)}>{Math.round(progress)}%</span>
              ) : stage === "downloading" ? (
                <Download className={cn(sizes.icon, "text-primary animate-pulse")} />
              ) : (
                <Upload className={cn(sizes.icon, "text-primary animate-pulse")} />
              )}
            </div>
          </div>
          {message && (
            <p className={cn("text-muted-foreground", sizes.text)}>{message}</p>
          )}
        </div>
      );
    }
    
    // Minimal variant - just percentage text
    if (variant === "minimal") {
      return (
        <div ref={ref} className={cn("flex items-center gap-2", className)}>
          {isPreparing ? (
            <Loader2 className={cn(sizes.icon, "animate-spin text-muted-foreground")} />
          ) : isComplete ? (
            <CheckCircle2 className={cn(sizes.icon, "text-emerald-500")} />
          ) : isError ? (
            <XCircle className={cn(sizes.icon, "text-destructive")} />
          ) : isActive ? (
            <>
              {stage === "downloading" ? (
                <Download className={cn(sizes.icon, "text-primary")} />
              ) : (
                <Upload className={cn(sizes.icon, "text-primary")} />
              )}
              {showPercentage && (
                <span className={cn("font-medium", sizes.text)}>{Math.round(progress)}%</span>
              )}
            </>
          ) : null}
          {message && (
            <span className={cn("text-muted-foreground", sizes.text)}>{message}</span>
          )}
        </div>
      );
    }
    
    // Bar variant (default) - horizontal progress bar
    return (
      <div ref={ref} className={cn("w-full space-y-1.5", className)}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isPreparing ? (
              <Loader2 className={cn(sizes.icon, "animate-spin text-muted-foreground")} />
            ) : isComplete ? (
              <CheckCircle2 className={cn(sizes.icon, "text-emerald-500")} />
            ) : isError ? (
              <XCircle className={cn(sizes.icon, "text-destructive")} />
            ) : stage === "downloading" ? (
              <Download className={cn(sizes.icon, "text-primary")} />
            ) : (
              <Upload className={cn(sizes.icon, "text-primary")} />
            )}
            {message && (
              <span className={cn("text-muted-foreground truncate", sizes.text)}>{message}</span>
            )}
          </div>
          {showPercentage && isActive && (
            <span className={cn("font-medium shrink-0", sizes.text)}>{Math.round(progress)}%</span>
          )}
        </div>
        <div className={cn("w-full overflow-hidden rounded-full bg-muted/50", sizes.bar)}>
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              isError ? "bg-destructive" : 
              isComplete ? "bg-emerald-500" : 
              "bg-primary"
            )}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
    );
  }
);

UploadProgress.displayName = "UploadProgress";

export { UploadProgress };
export type { UploadProgressProps };
