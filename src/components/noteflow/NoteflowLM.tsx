import { useState, useCallback, ClipboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  PenTool,
  Image as ImageIcon,
  Presentation,
  Video,
  LayoutGrid,
  Sparkles,
  Globe,
  Lock,
  Check,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Download,
  ExternalLink,
  Crown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNoteflowLMUsage } from "@/hooks/useNoteflowLMUsage";
import { useSubscription } from "@/hooks/useSubscription";

interface GenerationPreview {
  type: "image" | "slides" | "infographic";
  prompt: string;
  mode: "private" | "public";
  slideCount?: number;
  details: string[];
}

interface GenerationResult {
  type: "image" | "slides";
  content: string;
  images?: { type: string; image_url: { url: string } }[];
}

interface NoteflowLMProps {
  noteContent: string;
  noteTitle?: string;
  onApplyResult?: (result: string) => void;
}

const GENERATION_TYPES = [
  {
    id: "image",
    label: "Image",
    description: "Generate AI images",
    icon: ImageIcon,
    badge: "BETA",
    badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    available: true,
  },
  {
    id: "slides",
    label: "Slides",
    description: "Create presentation slides",
    icon: Presentation,
    badge: "BETA",
    badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    available: true,
  },
  {
    id: "infographic",
    label: "Infographic",
    description: "NotebookLM-style visuals",
    icon: LayoutGrid,
    badge: "COMING SOON",
    badgeColor: "bg-muted text-muted-foreground border-border",
    available: false,
  },
  {
    id: "video",
    label: "Video",
    description: "AI video generation",
    icon: Video,
    badge: "COMING SOON",
    badgeColor: "bg-muted text-muted-foreground border-border",
    available: false,
  },
];

export const NoteflowLM = ({
  noteContent,
  noteTitle = "Untitled Note",
  onApplyResult,
}: NoteflowLMProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"private" | "public">("private");
  const [selectedType, setSelectedType] = useState<string>("image");
  const [customPrompt, setCustomPrompt] = useState("");
  const [slideCount, setSlideCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<GenerationPreview | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [step, setStep] = useState<"select" | "preview" | "generating" | "result">("select");
  const { toast } = useToast();

  const { canGenerate, dailyUsed, dailyLimit, remaining, loading: usageLoading, recordGeneration } = useNoteflowLMUsage();
  const { getCurrentPlan } = useSubscription();
  const currentPlan = getCurrentPlan();

  // Handle paste for textarea
  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>, setter: (value: string) => void, currentValue: string) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const target = e.target as HTMLTextAreaElement;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const newValue = currentValue.substring(0, start) + pastedText + currentValue.substring(end);
    setter(newValue);
  };

  const extractTextFromContent = (content: string): string => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.content) {
        return parsed.content
          .map((node: any) => {
            if (node.content) {
              return node.content.map((c: any) => c.text || "").join("");
            }
            return "";
          })
          .join("\n");
      }
      return content;
    } catch {
      return content;
    }
  };

  const generatePreview = useCallback(() => {
    const textContent = extractTextFromContent(noteContent);
    const wordCount = textContent.split(/\s+/).filter(Boolean).length;
    
    const details: string[] = [];
    
    if (selectedType === "image") {
      details.push(`📝 Source: "${noteTitle}"`);
      details.push(`🎨 Style: ${mode === "private" ? "Based on your note context" : "Enhanced with web research"}`);
      details.push(`📊 Content analyzed: ${wordCount} words`);
      if (customPrompt) {
        details.push(`💡 Custom direction: "${customPrompt.slice(0, 50)}${customPrompt.length > 50 ? "..." : ""}"`);
      }
    } else if (selectedType === "slides") {
      details.push(`📝 Source: "${noteTitle}"`);
      details.push(`🖼️ Slides to generate: ${slideCount}`);
      details.push(`📊 Content: ${wordCount} words`);
      
      const minWordsPerSlide = 20;
      const recommendedSlides = Math.max(3, Math.min(15, Math.floor(wordCount / minWordsPerSlide)));
      
      if (slideCount > recommendedSlides && mode === "private") {
        details.push(`⚠️ Note: Your content may not fill ${slideCount} slides. Consider enabling Public mode for enhanced content.`);
      }
      
      details.push(`🎯 Mode: ${mode === "private" ? "Using only your note content" : "Will search and add relevant details"}`);
    }

    setPreview({
      type: selectedType as "image" | "slides" | "infographic",
      prompt: customPrompt || `Generate based on: ${noteTitle}`,
      mode,
      slideCount: selectedType === "slides" ? slideCount : undefined,
      details,
    });
    
    setStep("preview");
  }, [noteContent, noteTitle, selectedType, mode, customPrompt, slideCount]);

  const startGeneration = async () => {
    setStep("generating");
    setProgress(0);
    setIsLoading(true);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const textContent = extractTextFromContent(noteContent);
      
      const { data, error } = await supabase.functions.invoke("generate-noteflow-ai", {
        body: {
          type: selectedType,
          content: textContent,
          title: noteTitle,
          mode,
          customPrompt,
          slideCount: selectedType === "slides" ? slideCount : undefined,
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      // Record the generation
      await recordGeneration({
        generationType: selectedType as 'image' | 'slides' | 'infographic' | 'video',
        noteTitle,
        mode,
        customPrompt,
        resultSummary: typeof data?.result === 'string' ? data.result.substring(0, 200) : 'Generated',
        success: true,
      });

      setResult({
        type: selectedType as "image" | "slides",
        content: data?.result || "Generation completed!",
        images: data?.images,
      });
      setStep("result");
    } catch (error) {
      console.error("Generation error:", error);
      clearInterval(progressInterval);
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
      setStep("preview");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStep("select");
    setPreview(null);
    setResult(null);
    setProgress(0);
    setCustomPrompt("");
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) reset();
    }}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-primary hover:text-primary hover:bg-primary/10"
        >
          <PenTool className="w-4 h-4" />
          <span className="hidden sm:inline">NoteflowLM</span>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 text-violet-600 border-violet-500/30">
            BETA
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/10 border border-violet-500/20">
              <PenTool className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <span>NoteflowLM</span>
              <Badge variant="outline" className="ml-2 text-[9px] bg-gradient-to-r from-violet-500/10 to-indigo-500/10 text-violet-600 border-violet-500/30">
                BETA
              </Badge>
            </div>
          </SheetTitle>
          <SheetDescription>
            Transform your notes into images, slides, and more — NotebookLM competitor
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Mode Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
            <div className="flex items-center gap-3">
              {mode === "private" ? (
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Lock className="w-4 h-4 text-emerald-600" />
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Globe className="w-4 h-4 text-blue-600" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium">
                  {mode === "private" ? "Private Mode" : "Public Mode"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {mode === "private" 
                    ? "Uses only your Chronyx context" 
                    : "Searches web for accurate details"
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={mode === "public"}
              onCheckedChange={(checked) => setMode(checked ? "public" : "private")}
            />
          </div>

          {/* Step: Select */}
          {step === "select" && (
            <>
              {/* Generation Types */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">What would you like to create?</Label>
                <div className="grid grid-cols-2 gap-3">
                  {GENERATION_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.id;
                    const isDisabled = !type.available;
                    return (
                      <button
                        key={type.id}
                        onClick={() => type.available && setSelectedType(type.id)}
                        disabled={isDisabled}
                        className={cn(
                          "relative flex flex-col items-center gap-2 p-4 rounded-xl border text-center",
                          "transition-all duration-200",
                          isSelected && type.available && "bg-primary/5 border-primary/50 shadow-sm",
                          !isSelected && type.available && "hover:bg-accent hover:border-primary/30",
                          isDisabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className={cn(
                          "p-3 rounded-xl",
                          isSelected ? "bg-primary/10" : "bg-muted"
                        )}>
                          <Icon className={cn(
                            "w-5 h-5",
                            isSelected ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{type.label}</p>
                          <p className="text-[10px] text-muted-foreground">{type.description}</p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={cn("text-[8px] px-1.5 py-0", type.badgeColor)}
                        >
                          {type.badge}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </div>


              {/* Type-specific options */}
              {selectedType === "slides" && (
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Number of Slides</Label>
                  <Input
                    type="number"
                    min={3}
                    max={20}
                    value={slideCount}
                    onChange={(e) => setSlideCount(Math.max(3, Math.min(20, parseInt(e.target.value) || 5)))}
                    className="w-32"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended: 5-10 slides for best results
                  </p>
                </div>
              )}

              {/* Custom Prompt */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  Additional Instructions (Optional)
                </Label>
                <Textarea
                  placeholder={
                    selectedType === "image" 
                      ? "Describe the style, mood, or specific elements you want..." 
                      : "Any specific requirements for your slides..."
                  }
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={generatePreview}
                disabled={!noteContent.trim()}
                className="w-full gap-2"
                size="lg"
              >
                <Sparkles className="w-4 h-4" />
                Preview Generation
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {/* Step: Preview */}
          {step === "preview" && preview && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold text-primary">Generation Preview</p>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Please review before generating:
                </p>
                <ul className="space-y-2">
                  {preview.details.map((detail, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("select")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={startGeneration}
                  className="flex-1 gap-2"
                >
                  <Check className="w-4 h-4" />
                  Approve & Generate
                </Button>
              </div>
            </div>
          )}

          {/* Step: Generating */}
          {step === "generating" && (
            <div className="text-center py-8 space-y-6">
              {/* Circular Progress Ring */}
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    className="text-primary transition-all duration-300"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{Math.round(progress)}%</span>
                </div>
              </div>

              <div>
                <p className="text-lg font-semibold">Generating...</p>
                <p className="text-sm text-muted-foreground">
                  {selectedType === "image" && "Creating your AI image..."}
                  {selectedType === "slides" && "Building your presentation slides..."}
                </p>
              </div>
            </div>
          )}

          {/* Step: Result */}
          {step === "result" && result && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-600">Generation Complete!</p>
                </div>
                
                {/* Display Images if available */}
                {result.images && result.images.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {result.images.map((img, index) => (
                      <div key={index} className="rounded-lg overflow-hidden border">
                        <img
                          src={img.image_url.url}
                          alt={`Generated ${index + 1}`}
                          className="w-full h-auto"
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {result.content}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={reset}
                  className="flex-1 gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  New Generation
                </Button>
                <Link to="/app/noteflowlm" className="flex-1">
                  <Button className="w-full gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Open Workspace
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Branding */}
        <div className="absolute bottom-4 right-4 opacity-60 hover:opacity-100 transition-opacity">
          <p className="text-[10px] font-medium text-muted-foreground tracking-wide">
            CHRONYX BY <span className="text-primary">ORIGINX LABS PVT LTD</span>
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
