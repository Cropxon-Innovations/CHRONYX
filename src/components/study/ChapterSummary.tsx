import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Pencil, Save, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ChapterSummaryProps {
  libraryItemId: string;
  chapterIndex: number;
  chapterText: string;
  existingSummary?: {
    id: string;
    summary_text: string;
    summary_type: string;
  } | null;
  onSummaryGenerated?: (summary: any) => void;
}

type SummaryType = 'short' | 'detailed' | 'study';

const SUMMARY_OPTIONS: { value: SummaryType; label: string; description: string }[] = [
  { value: 'short', label: 'Short', description: '5 bullet points' },
  { value: 'detailed', label: 'Detailed', description: 'Paragraph format' },
  { value: 'study', label: 'Study-focused', description: 'Key ideas & terms' },
];

export const ChapterSummary = ({
  libraryItemId,
  chapterIndex,
  chapterText,
  existingSummary,
  onSummaryGenerated,
}: ChapterSummaryProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [summaryType, setSummaryType] = useState<SummaryType>('short');
  const [summary, setSummary] = useState(existingSummary?.summary_text || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState(summary);
  const [isSaving, setIsSaving] = useState(false);

  const generateSummary = async () => {
    if (!chapterText || chapterText.length < 100) {
      toast({
        title: "Not enough content",
        description: "The chapter needs more text to generate a summary",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setShowTypeSelector(false);

    try {
      const { data, error } = await supabase.functions.invoke('summarize-chapter', {
        body: {
          libraryItemId,
          chapterIndex,
          chapterText,
          summaryType,
        },
      });

      if (error) throw error;

      setSummary(data.summary_text);
      setEditedSummary(data.summary_text);
      onSummaryGenerated?.(data);

      toast({
        title: "Summary generated",
        description: "Your chapter summary is ready",
      });
    } catch (error: any) {
      console.error('Summary generation error:', error);
      toast({
        title: "Failed to generate summary",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveSummary = async () => {
    if (!existingSummary?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('chapter_summaries')
        .update({ summary_text: editedSummary })
        .eq('id', existingSummary.id);

      if (error) throw error;

      setSummary(editedSummary);
      setIsEditing(false);
      toast({ title: "Summary updated" });
    } catch (error) {
      toast({
        title: "Failed to save",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateClick = () => {
    if (summary) {
      // Already have a summary, regenerate with current type
      generateSummary();
    } else {
      // First time - show type selector
      setShowTypeSelector(true);
    }
  };

  return (
    <div className="my-8 border-t border-b border-dashed py-6">
      <div className="text-center max-w-lg mx-auto">
        {!summary && !showTypeSelector && !isGenerating && (
          <>
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-3">
              <div className="h-px w-8 bg-border" />
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Chapter Summary</span>
              <div className="h-px w-8 bg-border" />
            </div>
            <Button onClick={handleGenerateClick} variant="outline">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Summary
            </Button>
          </>
        )}

        {showTypeSelector && (
          <Card className="text-left">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">How would you like this summary?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={summaryType} onValueChange={(v) => setSummaryType(v as SummaryType)}>
                {SUMMARY_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-start space-x-3">
                    <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-muted-foreground ml-2 text-sm">
                        ({option.description})
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <div className="flex gap-2 pt-2">
                <Button onClick={generateSummary} className="flex-1">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate
                </Button>
                <Button variant="ghost" onClick={() => setShowTypeSelector(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isGenerating && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Generating summary...</p>
          </div>
        )}

        {summary && !isGenerating && (
          <Card className="text-left">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Chapter Summary
              </CardTitle>
              <div className="flex gap-1">
                {isEditing ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditedSummary(summary);
                        setIsEditing(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveSummary}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  className="min-h-[200px] text-sm"
                />
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {summary.split('\n').map((line, i) => (
                    <p key={i} className={cn(
                      "text-sm leading-relaxed",
                      line.startsWith('•') || line.startsWith('-') ? "pl-4" : ""
                    )}>
                      {line}
                    </p>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateClick}
                  disabled={isGenerating}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Regenerate
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
