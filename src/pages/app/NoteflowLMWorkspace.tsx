import { useState, useEffect, ClipboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  PenTool,
  Image as ImageIcon,
  Presentation,
  Video,
  LayoutGrid,
  Sparkles,
  Globe,
  Lock,
  Loader2,
  Check,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Download,
  ArrowLeft,
  Crown,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNoteflowLMUsage } from "@/hooks/useNoteflowLMUsage";
import { useSubscription } from "@/hooks/useSubscription";

interface GenerationPreview {
  type: "image" | "slides" | "infographic" | "video";
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

const GENERATION_TYPES = [
  {
    id: "image",
    label: "Image",
    description: "Generate AI images from your notes",
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

export default function NoteflowLMWorkspace() {
  const [mode, setMode] = useState<"private" | "public">("private");
  const [selectedType, setSelectedType] = useState<string>("image");
  const [noteContent, setNoteContent] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [slideCount, setSlideCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<GenerationPreview | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [step, setStep] = useState<"input" | "preview" | "generating" | "result">("input");
  
  const { toast } = useToast();
  const { canGenerate, dailyUsed, dailyLimit, remaining, loading: usageLoading, recordGeneration, getUsageMessage } = useNoteflowLMUsage();
  const { getCurrentPlan } = useSubscription();

  const currentPlan = getCurrentPlan();

  // Handle paste events for textareas
  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>, setter: (value: string) => void) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const target = e.target as HTMLTextAreaElement;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const currentValue = target.value;
    const newValue = currentValue.substring(0, start) + pastedText + currentValue.substring(end);
    setter(newValue);
  };

  const generatePreview = () => {
    if (!noteContent.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter some content to generate from.",
        variant: "destructive",
      });
      return;
    }

    const wordCount = noteContent.split(/\s+/).filter(Boolean).length;
    const details: string[] = [];

    if (selectedType === "image") {
      details.push(`📝 Source: "${noteTitle || 'Untitled'}"`);
      details.push(`🎨 Style: ${mode === "private" ? "Based on your content only" : "Enhanced with web research"}`);
      details.push(`📊 Content analyzed: ${wordCount} words`);
      if (customPrompt) {
        details.push(`💡 Custom direction: "${customPrompt.slice(0, 50)}${customPrompt.length > 50 ? "..." : ""}"`);
      }
      details.push(`🏷️ Branding: CHRONYX BY ORIGINX LABS PVT LTD watermark included`);
    } else if (selectedType === "slides") {
      details.push(`📝 Source: "${noteTitle || 'Untitled'}"`);
      details.push(`🖼️ Slides to generate: ${slideCount}`);
      details.push(`📊 Content: ${wordCount} words`);
      
      const minWordsPerSlide = 20;
      const recommendedSlides = Math.max(3, Math.min(15, Math.floor(wordCount / minWordsPerSlide)));
      
      if (slideCount > recommendedSlides && mode === "private") {
        details.push(`⚠️ Note: Your content may not fill ${slideCount} slides. Consider enabling Public mode for enhanced content.`);
      }
      
      details.push(`🎯 Mode: ${mode === "private" ? "Using only your content" : "Will search and add relevant details"}`);
      details.push(`🏷️ Branding: CHRONYX BY ORIGINX LABS PVT LTD on title and closing slides`);
    }

    setPreview({
      type: selectedType as "image" | "slides" | "infographic" | "video",
      prompt: customPrompt || `Generate based on: ${noteTitle || 'content'}`,
      mode,
      slideCount: selectedType === "slides" ? slideCount : undefined,
      details,
    });

    setStep("preview");
  };

  const startGeneration = async () => {
    if (!canGenerate) {
      toast({
        title: "Daily Limit Reached",
        description: `You've used all ${dailyLimit} generations today. Upgrade for more.`,
        variant: "destructive",
      });
      return;
    }

    setStep("generating");
    setProgress(0);
    setIsLoading(true);

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
      const { data, error } = await supabase.functions.invoke("generate-noteflow-ai", {
        body: {
          type: selectedType,
          content: noteContent,
          title: noteTitle || "Untitled",
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
        noteTitle: noteTitle || "Untitled",
        mode,
        customPrompt,
        resultSummary: data?.result?.substring(0, 200),
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
      
      await recordGeneration({
        generationType: selectedType as 'image' | 'slides' | 'infographic' | 'video',
        noteTitle: noteTitle || "Untitled",
        mode,
        customPrompt,
        success: false,
      });

      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate content. Please try again.",
        variant: "destructive",
      });
      setStep("preview");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStep("input");
    setPreview(null);
    setResult(null);
    setProgress(0);
  };

  const downloadResult = () => {
    if (!result) return;

    if (result.images && result.images.length > 0) {
      // Download image
      result.images.forEach((img, index) => {
        const link = document.createElement('a');
        link.href = img.image_url.url;
        link.download = `noteflowlm-${noteTitle || 'image'}-${index + 1}.png`;
        link.click();
      });
    } else {
      // Download text as file
      const blob = new Blob([result.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `noteflowlm-${selectedType}-${noteTitle || 'content'}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    }

    toast({
      title: "Downloaded!",
      description: "Your content has been downloaded with CHRONYX branding.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4 px-4">
          <Link to="/app/notes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/10 border border-violet-500/20">
              <PenTool className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                NoteflowLM
                <Badge variant="outline" className="text-[9px] bg-gradient-to-r from-violet-500/10 to-indigo-500/10 text-violet-600 border-violet-500/30">
                  BETA
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground">NotebookLM Competitor • AI Content Generation</p>
            </div>
          </div>

          {/* Usage Badge */}
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium">
                {usageLoading ? "..." : `${remaining}/${dailyLimit}`}
              </span>
              <span className="text-xs text-muted-foreground">today</span>
            </div>
            {currentPlan === 'free' && (
              <Link to="/pricing">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Crown className="w-3.5 h-3.5" />
                  Upgrade
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Panel - Input */}
          <div className="space-y-6">
            {/* Mode Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border">
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
                      ? "Uses only your content"
                      : "Searches web for accurate details"}
                  </p>
                </div>
              </div>
              <Switch
                checked={mode === "public"}
                onCheckedChange={(checked) => setMode(checked ? "public" : "private")}
              />
            </div>

            {/* Generation Types */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">What would you like to create?</Label>
              <div className="grid grid-cols-2 gap-3">
                {GENERATION_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedType === type.id;
                  const isDisabled = !type.available || (!canGenerate && step === "input");
                  
                  return (
                    <button
                      key={type.id}
                      onClick={() => type.available && setSelectedType(type.id)}
                      disabled={isDisabled}
                      className={cn(
                        "relative flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all duration-200",
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

            {/* Content Input */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Title (Optional)</Label>
              <Input
                placeholder="Enter a title for your content..."
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="mb-4"
              />

              <Label className="text-sm font-semibold mb-2 block">Content *</Label>
              <Textarea
                placeholder="Paste or type your content here. NoteflowLM will analyze and generate based on this..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                onPaste={(e) => handlePaste(e, setNoteContent)}
                className="min-h-[200px] resize-none"
              />
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
                onPaste={(e) => handlePaste(e, setCustomPrompt)}
                className="min-h-[80px] resize-none"
              />
            </div>

            {/* Usage Warning */}
            {!canGenerate && (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Daily Limit Reached</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  You've used all {dailyLimit} generations today. 
                  {currentPlan === 'free' && " Upgrade to Pro for 12/day or Premium for 20/day."}
                </p>
                {currentPlan === 'free' && (
                  <Link to="/pricing">
                    <Button size="sm" className="mt-3 gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      Upgrade Now
                    </Button>
                  </Link>
                )}
              </div>
            )}

            {/* Generate Button */}
            {step === "input" && (
              <Button
                onClick={generatePreview}
                disabled={!noteContent.trim() || !canGenerate}
                className="w-full gap-2"
                size="lg"
              >
                <Sparkles className="w-4 h-4" />
                Preview Generation
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Right Panel - Preview/Result */}
          <div className="space-y-6">
            {step === "input" && (
              <div className="h-full flex items-center justify-center p-8 rounded-xl border-2 border-dashed">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/10 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-violet-600" />
                  </div>
                  <p className="text-lg font-medium">Ready to Generate</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter your content and click "Preview Generation"
                  </p>
                </div>
              </div>
            )}

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
                      <li key={i} className="text-sm text-foreground">
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep("input")}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={startGeneration}
                    className="flex-1 gap-2"
                    disabled={!canGenerate}
                  >
                    <Check className="w-4 h-4" />
                    Approve & Generate
                  </Button>
                </div>
              </div>
            )}

            {step === "generating" && (
              <div className="text-center py-12 space-y-6">
                {/* Circular Progress Ring */}
                <div className="relative w-40 h-40 mx-auto">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted"
                    />
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
                    <span className="text-3xl font-bold text-primary">{Math.round(progress)}%</span>
                  </div>
                </div>

                <div>
                  <p className="text-lg font-semibold">Generating...</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedType === "image" && "Creating your AI image with CHRONYX branding..."}
                    {selectedType === "slides" && "Building your presentation slides..."}
                  </p>
                </div>
              </div>
            )}

            {step === "result" && result && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <p className="text-sm font-semibold text-emerald-600">Generation Complete!</p>
                  </div>
                </div>

                {/* Display Images */}
                {result.images && result.images.length > 0 && (
                  <div className="space-y-3">
                    {result.images.map((img, index) => (
                      <div key={index} className="rounded-xl overflow-hidden border">
                        <img
                          src={img.image_url.url}
                          alt={`Generated ${index + 1}`}
                          className="w-full h-auto"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Display Text Content */}
                <ScrollArea className="h-[300px]">
                  <div className="p-4 rounded-xl bg-muted/30 border">
                    <p className="text-sm whitespace-pre-wrap">{result.content}</p>
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={reset}
                    className="flex-1 gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Generate Another
                  </Button>
                  <Button
                    onClick={downloadResult}
                    className="flex-1 gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Branding Footer */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-muted-foreground tracking-widest">
            CHRONYX BY ORIGINX LABS PVT LTD
          </p>
        </div>
      </div>
    </div>
  );
}
