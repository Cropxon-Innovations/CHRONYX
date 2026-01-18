import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen, 
  Volume2, 
  Trash2, 
  Search,
  Clock,
  TrendingUp,
  RotateCcw,
  ChevronRight,
  Check,
  X,
  Sparkles
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

interface VocabularyItem {
  id: string;
  word: string;
  meaning: string;
  phonetic?: string;
  translation_language?: string;
  translation_text?: string;
  synonyms?: string[];
  antonyms?: string[];
  examples?: any;
  source_type?: string;
  lookup_count?: number;
  last_seen_at?: string;
  created_at: string;
}

// Calm, intelligent review scoring algorithm
const calculateReviewScore = (item: VocabularyItem): number => {
  const lookupCount = item.lookup_count || 1;
  const lastSeen = item.last_seen_at ? new Date(item.last_seen_at) : new Date(item.created_at);
  const daysSinceLastSeen = differenceInDays(new Date(), lastSeen);
  
  // Higher score = should review sooner
  // Weights: lookup frequency matters, recency matters inversely
  const score = (lookupCount * 2) + daysSinceLastSeen;
  
  return score;
};

export const VocabularyScreen = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isPro } = useSubscription();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  
  // Session limit based on plan
  const sessionLimit = isPro() ? 10 : 5;

  const { data: vocabulary = [], isLoading } = useQuery({
    queryKey: ['vocabulary', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('vocabulary')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as VocabularyItem[];
    },
    enabled: !!user?.id,
  });

  const deleteWord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vocabulary')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
      toast({ title: "Word removed from vocabulary" });
    },
  });

  const updateLastSeen = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vocabulary')
        .update({ 
          last_seen_at: new Date().toISOString(),
          lookup_count: vocabulary.find(v => v.id === id)?.lookup_count || 1 + 1
        })
        .eq('id', id);
      if (error) throw error;
    },
  });

  const pronounce = (word: string) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
  };

  // Filter vocabulary based on tab and search
  const filteredVocabulary = vocabulary.filter(item => {
    const matchesSearch = item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.meaning.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (activeTab === 'recent') {
      const lastSeen = item.last_seen_at ? new Date(item.last_seen_at) : new Date(item.created_at);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      return lastSeen > threeDaysAgo;
    }
    
    if (activeTab === 'frequent') {
      return (item.lookup_count || 1) > 1;
    }
    
    return true;
  });

  // Review mode - use intelligent scoring algorithm
  const reviewWords = useMemo(() => {
    return [...vocabulary]
      .map(item => ({ ...item, score: calculateReviewScore(item) }))
      .sort((a, b) => b.score - a.score) // Higher score = review first
      .slice(0, sessionLimit);
  }, [vocabulary, sessionLimit]);

  const currentReviewWord = reviewWords[reviewIndex];

  const handleNextReview = () => {
    if (currentReviewWord) {
      updateLastSeen.mutate(currentReviewWord.id);
    }
    setShowMeaning(false);
    if (reviewIndex < reviewWords.length - 1) {
      setReviewIndex(prev => prev + 1);
    } else {
      setReviewMode(false);
      setReviewIndex(0);
      toast({ 
        title: "Review complete!", 
        description: `You reviewed ${reviewWords.length} words. Take your time.` 
      });
    }
  };

  const startReview = () => {
    if (reviewWords.length === 0) {
      toast({
        title: "No words to review",
        description: "Save some words to your vocabulary first",
        variant: "destructive",
      });
      return;
    }
    setReviewMode(true);
    setReviewIndex(0);
    setShowMeaning(false);
  };

  if (reviewMode && currentReviewWord) {
    return (
      <div className="max-w-lg mx-auto py-8">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((reviewIndex + 1) / reviewWords.length) * 100}%` }}
            />
          </div>
          
          <CardHeader className="text-center pt-8">
            <p className="text-sm text-muted-foreground mb-2">
              {reviewIndex + 1} of {reviewWords.length}
            </p>
            <CardTitle className="text-3xl capitalize">{currentReviewWord.word}</CardTitle>
            {currentReviewWord.phonetic && (
              <p className="text-muted-foreground">{currentReviewWord.phonetic}</p>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="mx-auto mt-2"
              onClick={() => pronounce(currentReviewWord.word)}
            >
              <Volume2 className="w-5 h-5" />
            </Button>
          </CardHeader>

          <CardContent className="text-center pb-8">
            {!showMeaning ? (
              <Button onClick={() => setShowMeaning(true)} className="mt-4">
                Show Meaning
              </Button>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                <p className="text-lg">{currentReviewWord.meaning}</p>
                
                {currentReviewWord.translation_text && (
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Translation</p>
                    <p className="font-medium">{currentReviewWord.translation_text}</p>
                  </div>
                )}
                
                {currentReviewWord.examples && Array.isArray(currentReviewWord.examples) && currentReviewWord.examples.length > 0 && (
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground mb-1">Examples:</p>
                    <ul className="text-sm text-muted-foreground italic space-y-1">
                      {(currentReviewWord.examples as string[]).slice(0, 2).map((ex, i) => (
                        <li key={i}>• {ex}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button onClick={handleNextReview} className="mt-6">
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Button 
          variant="ghost" 
          className="mt-4 w-full"
          onClick={() => setReviewMode(false)}
        >
          <X className="w-4 h-4 mr-2" />
          Exit Review
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Vocabulary
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {vocabulary.length} words saved
          </p>
        </div>

        <Button onClick={startReview} disabled={vocabulary.length === 0}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Review ({Math.min(vocabulary.length, 10)})
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search words..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="recent">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Recent
          </TabsTrigger>
          <TabsTrigger value="frequent">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            Frequent
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading vocabulary...
            </div>
          ) : filteredVocabulary.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No words match your search' : 'No words saved yet'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Select words while reading to look them up and save
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3 pr-4">
                {filteredVocabulary.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium capitalize">{item.word}</h3>
                          {item.phonetic && (
                            <span className="text-xs text-muted-foreground">
                              {item.phonetic}
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => pronounce(item.word)}
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {item.meaning}
                        </p>
                        
                        {item.translation_text && (
                          <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-primary/10 rounded text-xs">
                            <span className="font-medium">{item.translation_language?.toUpperCase()}:</span>
                            <span>{item.translation_text}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          </span>
                          {(item.lookup_count || 1) > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              Looked up {item.lookup_count}×
                            </Badge>
                          )}
                          {item.source_type && (
                            <Badge variant="outline" className="text-xs">
                              {item.source_type.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteWord.mutate(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
