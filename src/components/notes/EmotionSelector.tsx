import { cn } from "@/lib/utils";
import { 
  Smile, 
  Frown, 
  Meh,
  Heart,
  Zap,
  Cloud,
  Sun,
  Moon
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export type Emotion = 
  | "happy" 
  | "sad" 
  | "neutral" 
  | "loved" 
  | "energetic" 
  | "anxious" 
  | "peaceful" 
  | "tired";

interface EmotionConfig {
  type: Emotion;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

export const EMOTIONS: EmotionConfig[] = [
  { type: "happy", label: "Happy", icon: Smile, color: "text-amber-500", bgColor: "bg-amber-50 dark:bg-amber-950/30" },
  { type: "sad", label: "Sad", icon: Frown, color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-950/30" },
  { type: "neutral", label: "Neutral", icon: Meh, color: "text-gray-500", bgColor: "bg-gray-50 dark:bg-gray-950/30" },
  { type: "loved", label: "Loved", icon: Heart, color: "text-pink-500", bgColor: "bg-pink-50 dark:bg-pink-950/30" },
  { type: "energetic", label: "Energetic", icon: Zap, color: "text-yellow-500", bgColor: "bg-yellow-50 dark:bg-yellow-950/30" },
  { type: "anxious", label: "Anxious", icon: Cloud, color: "text-purple-500", bgColor: "bg-purple-50 dark:bg-purple-950/30" },
  { type: "peaceful", label: "Peaceful", icon: Sun, color: "text-emerald-500", bgColor: "bg-emerald-50 dark:bg-emerald-950/30" },
  { type: "tired", label: "Tired", icon: Moon, color: "text-indigo-500", bgColor: "bg-indigo-50 dark:bg-indigo-950/30" },
];

export const getEmotionConfig = (emotion: Emotion): EmotionConfig => {
  return EMOTIONS.find(e => e.type === emotion) || EMOTIONS[2]; // Default to neutral
};

interface EmotionSelectorProps {
  selectedEmotion?: Emotion;
  onSelect: (emotion: Emotion) => void;
}

export const EmotionSelector = ({ selectedEmotion, onSelect }: EmotionSelectorProps) => {
  const selected = selectedEmotion ? getEmotionConfig(selectedEmotion) : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn(
            "gap-2 h-8",
            selected && selected.bgColor
          )}
        >
          {selected ? (
            <>
              <selected.icon className={cn("w-4 h-4", selected.color)} />
              <span className="text-sm">{selected.label}</span>
            </>
          ) : (
            <>
              <Meh className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">How are you feeling?</span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="grid grid-cols-4 gap-1">
          {EMOTIONS.map((emotion) => {
            const Icon = emotion.icon;
            const isSelected = selectedEmotion === emotion.type;

            return (
              <button
                key={emotion.type}
                onClick={() => onSelect(emotion.type)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                  "hover:bg-muted",
                  isSelected && "ring-2 ring-primary ring-offset-1"
                )}
                title={emotion.label}
              >
                <Icon className={cn("w-5 h-5", emotion.color)} />
                <span className="text-xs text-muted-foreground">{emotion.label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
