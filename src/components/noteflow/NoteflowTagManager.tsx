import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { 
  Tag, 
  Plus, 
  X, 
  Hash, 
  Sparkles,
  Check,
  Loader2
} from "lucide-react";

interface SuggestedTag {
  name: string;
  confidence: number;
  source: "ai" | "recent" | "popular";
}

interface NoteflowTagManagerProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  suggestedTags?: SuggestedTag[];
  isAnalyzing?: boolean;
  allTags: string[];
  className?: string;
}

export const NoteflowTagManager = ({
  tags,
  onTagsChange,
  suggestedTags = [],
  isAnalyzing = false,
  allTags,
  className,
}: NoteflowTagManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newTag, setNewTag] = useState("");

  const handleAddTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim().replace(/^#/, "");
    if (normalizedTag && !tags.includes(normalizedTag)) {
      onTagsChange([...tags, normalizedTag]);
    }
    setNewTag("");
  };

  const handleRemoveTag = (tag: string) => {
    onTagsChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      handleAddTag(newTag);
    }
  };

  // Filter existing tags that aren't already added
  const availableTags = allTags.filter((t) => !tags.includes(t));
  const filteredTags = availableTags.filter((t) =>
    t.toLowerCase().includes(newTag.toLowerCase())
  );

  // Filter AI suggestions that aren't already added
  const filteredSuggestions = suggestedTags.filter(
    (s) => !tags.includes(s.name.toLowerCase())
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* Current Tags */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="gap-1 px-2 py-1 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            <Hash className="w-3 h-3" />
            {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="ml-1 hover:text-destructive transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs border-dashed"
            >
              <Plus className="w-3 h-3" />
              Add Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search or create tag..."
                value={newTag}
                onValueChange={setNewTag}
                onKeyDown={handleKeyDown}
              />
              <CommandList>
                <CommandEmpty>
                  {newTag.trim() ? (
                    <button
                      onClick={() => handleAddTag(newTag)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <Plus className="w-4 h-4 text-primary" />
                      Create "{newTag.trim()}"
                    </button>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Type to search or create a tag
                    </p>
                  )}
                </CommandEmpty>

                {/* AI Suggested Tags */}
                {filteredSuggestions.length > 0 && (
                  <>
                    <CommandGroup heading="AI Suggestions">
                      {filteredSuggestions.map((suggestion) => (
                        <CommandItem
                          key={suggestion.name}
                          onSelect={() => handleAddTag(suggestion.name)}
                          className="gap-2"
                        >
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span>{suggestion.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {Math.round(suggestion.confidence * 100)}%
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandSeparator />
                  </>
                )}

                {/* Existing Tags */}
                {filteredTags.length > 0 && (
                  <CommandGroup heading="Existing Tags">
                    {filteredTags.slice(0, 10).map((tag) => (
                      <CommandItem
                        key={tag}
                        onSelect={() => handleAddTag(tag)}
                        className="gap-2"
                      >
                        <Hash className="w-4 h-4 text-cyan-500" />
                        <span>{tag}</span>
                        {tags.includes(tag) && (
                          <Check className="w-4 h-4 ml-auto text-primary" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {isAnalyzing && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Analyzing...
          </div>
        )}
      </div>

      {/* Quick Add AI Suggestions (inline) */}
      {filteredSuggestions.length > 0 && !isOpen && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Suggested:
          </span>
          {filteredSuggestions.slice(0, 5).map((suggestion) => (
            <button
              key={suggestion.name}
              onClick={() => handleAddTag(suggestion.name)}
              className={cn(
                "px-2 py-0.5 text-xs rounded-full border transition-all",
                "border-amber-500/30 text-amber-600 dark:text-amber-400",
                "hover:bg-amber-500/10 hover:border-amber-500/50"
              )}
            >
              +{suggestion.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
