import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Book, 
  Globe, 
  Volume2, 
  X, 
  Loader2,
  BookmarkPlus,
  Copy,
  Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DictionaryResult {
  word: string;
  meaning: string;
  phonetic: string;
  audioUrl?: string;
  synonyms: string[];
  antonyms: string[];
  examples: string[];
  translation?: string;
  partOfSpeech?: string;
}

interface InlineDictionaryProps {
  selectedText: string;
  position: { x: number; y: number };
  onClose: () => void;
  onSaveToVocabulary?: (word: string, data: DictionaryResult) => void;
  libraryItemId?: string;
}

const LANGUAGES = [
  { code: 'or', label: 'OD', name: 'Odia' },
  { code: 'hi', label: 'HI', name: 'Hindi' },
  { code: 'bn', label: 'BN', name: 'Bengali' },
  { code: 'te', label: 'TE', name: 'Telugu' },
  { code: 'ta', label: 'TA', name: 'Tamil' },
  { code: 'ml', label: 'ML', name: 'Malayalam' },
];

export const InlineDictionary = ({
  selectedText,
  position,
  onClose,
  onSaveToVocabulary,
  libraryItemId,
}: InlineDictionaryProps) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<'buttons' | 'define' | 'translate'>('buttons');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [saveToVocab, setSaveToVocab] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const word = selectedText.trim().split(/\s+/)[0].replace(/[^\w]/g, '');

  // Adjust position to keep card in viewport
  const getAdjustedPosition = useCallback(() => {
    const cardWidth = 320;
    const cardHeight = 400;
    const padding = 16;
    
    let x = position.x;
    let y = position.y + 10;
    
    if (typeof window !== 'undefined') {
      if (x + cardWidth > window.innerWidth - padding) {
        x = window.innerWidth - cardWidth - padding;
      }
      if (x < padding) x = padding;
      
      if (y + cardHeight > window.innerHeight - padding) {
        y = position.y - cardHeight - 10;
      }
      if (y < padding) y = padding;
    }
    
    return { x, y };
  }, [position]);

  const adjustedPos = getAdjustedPosition();

  const fetchDefinition = async (targetLang?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('dictionary', {
        body: { word, targetLanguage: targetLang }
      });

      if (error) throw error;
      setResult(data);
      setMode(targetLang ? 'translate' : 'define');
    } catch (error) {
      console.error('Dictionary error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch definition",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDefine = () => {
    fetchDefinition();
  };

  const handleTranslate = (langCode: string) => {
    setSelectedLang(langCode);
    fetchDefinition(langCode);
  };

  const handlePronounce = () => {
    if (result?.audioUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(result.audioUrl);
      }
      audioRef.current.src = result.audioUrl;
      setIsPlaying(true);
      audioRef.current.play().finally(() => setIsPlaying(false));
    } else {
      // Use Web Speech API
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      speechSynthesis.speak(utterance);
    }
  };

  const handleCopy = () => {
    const text = result 
      ? `${word}\n${result.phonetic}\n\n${result.meaning}${result.translation ? `\n\nTranslation: ${result.translation}` : ''}`
      : word;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveVocabulary = () => {
    if (result && onSaveToVocabulary) {
      onSaveToVocabulary(word, result);
      toast({
        title: "Saved to Vocabulary",
        description: `"${word}" added to your vocabulary list`,
      });
      onClose();
    }
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <Card
      ref={cardRef}
      className={cn(
        "fixed z-[100] w-80 max-h-[80vh] overflow-hidden shadow-2xl border-2",
        "bg-background/95 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200"
      )}
      style={{ 
        left: adjustedPos.x, 
        top: adjustedPos.y,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Book className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm capitalize">{word}</span>
          {result?.phonetic && (
            <span className="text-xs text-muted-foreground">{result.phonetic}</span>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-3 overflow-y-auto max-h-[60vh]">
        {mode === 'buttons' && !isLoading && (
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDefine}
              className="flex items-center gap-1.5"
            >
              <Book className="w-3.5 h-3.5" />
              Define
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePronounce}
              disabled={isPlaying}
              className="flex items-center gap-1.5"
            >
              <Volume2 className={cn("w-3.5 h-3.5", isPlaying && "animate-pulse")} />
              Pronounce
            </Button>
            <div className="w-full mt-2">
              <p className="text-xs text-muted-foreground mb-1.5">Translate to:</p>
              <div className="flex flex-wrap gap-1">
                {LANGUAGES.map((lang) => (
                  <Button
                    key={lang.code}
                    variant="secondary"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleTranslate(lang.code)}
                  >
                    {lang.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {result && !isLoading && mode !== 'buttons' && (
          <div className="space-y-3">
            {/* Meaning */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                {result.partOfSpeech && (
                  <Badge variant="secondary" className="text-xs">
                    {result.partOfSpeech}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-auto"
                  onClick={handlePronounce}
                  disabled={isPlaying}
                >
                  <Volume2 className={cn("w-3.5 h-3.5", isPlaying && "animate-pulse")} />
                </Button>
              </div>
              <p className="text-sm">{result.meaning}</p>
            </div>

            {/* Translation */}
            {result.translation && (
              <div className="p-2 bg-primary/10 rounded-md">
                <div className="flex items-center gap-1.5 mb-1">
                  <Globe className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium">
                    {LANGUAGES.find(l => l.code === selectedLang)?.name || 'Translation'}
                  </span>
                </div>
                <p className="text-sm font-medium">{result.translation}</p>
              </div>
            )}

            {/* Synonyms */}
            {result.synonyms?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Synonyms</p>
                <div className="flex flex-wrap gap-1">
                  {result.synonyms.map((syn, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {syn}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Antonyms */}
            {result.antonyms?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Antonyms</p>
                <div className="flex flex-wrap gap-1">
                  {result.antonyms.map((ant, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {ant}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Examples */}
            {result.examples?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Examples</p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  {result.examples.map((ex, i) => (
                    <li key={i} className="italic">• {ex}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Translate to other languages */}
            {mode === 'define' && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1.5">Translate:</p>
                <div className="flex flex-wrap gap-1">
                  {LANGUAGES.map((lang) => (
                    <Button
                      key={lang.code}
                      variant="secondary"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleTranslate(lang.code)}
                    >
                      {lang.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {result && !isLoading && (
        <div className="p-3 border-t bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="save-vocab"
              checked={saveToVocab}
              onCheckedChange={(checked) => setSaveToVocab(!!checked)}
            />
            <label htmlFor="save-vocab" className="text-xs cursor-pointer">
              Save to Vocabulary
            </label>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleCopy}
            >
              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
            {saveToVocab && (
              <Button
                variant="default"
                size="sm"
                className="h-7 text-xs"
                onClick={handleSaveVocabulary}
              >
                <BookmarkPlus className="w-3.5 h-3.5 mr-1" />
                Save
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
