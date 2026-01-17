import { Badge } from "@/components/ui/badge";
import { Mail, Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ImportedExpenseBadgeProps {
  sourceType?: string | null;
  confidenceScore?: number;
  merchantName?: string | null;
}

const ImportedExpenseBadge = ({ 
  sourceType, 
  confidenceScore = 0.7,
  merchantName 
}: ImportedExpenseBadgeProps) => {
  if (sourceType !== "gmail") return null;
  
  const confidenceLabel = 
    confidenceScore >= 0.8 ? "High" :
    confidenceScore >= 0.6 ? "Medium" : "Low";
  
  const confidenceColor =
    confidenceScore >= 0.8 ? "text-emerald-500" :
    confidenceScore >= 0.6 ? "text-amber-500" : "text-muted-foreground";
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className="text-[9px] px-1.5 py-0 h-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 text-red-600 dark:text-red-400 gap-1"
          >
            <Sparkles className="w-2.5 h-2.5" />
            Auto
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">Imported from Gmail</span>
            </div>
            {merchantName && (
              <p className="text-xs text-muted-foreground">
                Detected merchant: {merchantName}
              </p>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Confidence:</span>
              <span className={`text-xs font-medium ${confidenceColor}`}>
                {confidenceLabel} ({Math.round(confidenceScore * 100)}%)
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              You can edit or delete this entry anytime
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ImportedExpenseBadge;