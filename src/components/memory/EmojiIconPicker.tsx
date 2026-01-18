import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, SmilePlus } from "lucide-react";

interface EmojiIconPickerProps {
  value: string;
  onChange: (value: string) => void;
  trigger?: React.ReactNode;
}

const EMOJI_CATEGORIES = {
  faces: {
    label: "Smileys",
    emojis: ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😍", "🥰", "😘", "😗", "😚", "😋", "😛", "😜", "🤪", "😎", "🤩", "🥳", "😏", "😌", "😔", "🙄", "😬", "🤐", "😴", "🤮", "🤠", "🥺", "🤯", "🧐", "🤓", "😈", "👿", "🤡", "👻", "💀", "☠️", "👽", "🤖", "🎃"],
  },
  nature: {
    label: "Nature",
    emojis: ["🌸", "🌺", "🌷", "🌹", "🌻", "🌼", "💐", "🌾", "🌿", "☘️", "🍀", "🍃", "🍂", "🍁", "🌵", "🌴", "🌲", "🌳", "🪴", "🎋", "🎍", "🪹", "🌱", "🌈", "☀️", "🌤️", "⛅", "🌦️", "🌧️", "⛈️", "🌩️", "🌨️", "❄️", "☃️", "⛄", "🌪️", "🌫️", "🌊", "💧", "💦", "🔥", "✨", "⭐", "🌟", "💫", "🌙", "☁️"],
  },
  animals: {
    label: "Animals",
    emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐔", "🐧", "🐦", "🐤", "🐣", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🦟", "🐢", "🐍", "🦎", "🦂", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊"],
  },
  food: {
    label: "Food",
    emojis: ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🥑", "🥦", "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🫒", "🧄", "🧅", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🦴", "🌭", "🍔", "🍟", "🍕", "🫓", "🥪", "🥙", "🧆", "🌮", "🌯", "🫔", "🥗"],
  },
  activities: {
    label: "Activities",
    emojis: ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸️", "🥌", "🎿", "⛷️", "🏂", "🪂", "🏋️", "🤸", "⛹️", "🤾", "🏌️", "🏇", "🧘", "🏄", "🏊", "🤽", "🚣", "🧗", "🚴", "🚵", "🎮", "🎯", "🎲", "🧩", "♟️"],
  },
  objects: {
    label: "Objects",
    emojis: ["💼", "👜", "🎒", "👓", "🕶️", "🥽", "🌂", "☂️", "🧳", "💎", "🔑", "🗝️", "🔒", "🔓", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💝", "💟", "📷", "📸", "📹", "🎥", "📽️", "🎬", "📺", "📻", "🎙️", "🎚️", "🎛️", "🎵", "🎶", "🎼", "🎤", "🎧", "📱", "💻", "🖥️", "🖨️", "⌨️", "🖱️", "💾", "💿", "📀"],
  },
  symbols: {
    label: "Symbols",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️", "📴", "📳", "🈶", "🈚", "🈸", "🈺", "🈷️", "✴️", "🆚", "💮", "🉐"],
  },
  flags: {
    label: "Flags",
    emojis: ["🏳️", "🏴", "🏁", "🚩", "🎌", "🏴‍☠️", "🇦🇨", "🇦🇩", "🇦🇪", "🇦🇫", "🇦🇬", "🇦🇮", "🇦🇱", "🇦🇲", "🇦🇴", "🇦🇶", "🇦🇷", "🇦🇸", "🇦🇹", "🇦🇺", "🇦🇼", "🇦🇽", "🇦🇿", "🇧🇦", "🇧🇧", "🇧🇩", "🇧🇪", "🇧🇫", "🇧🇬", "🇧🇭", "🇧🇮", "🇧🇯", "🇧🇱", "🇧🇲", "🇧🇳", "🇧🇴", "🇧🇶", "🇧🇷", "🇧🇸", "🇧🇹", "🇧🇻", "🇧🇼", "🇧🇾", "🇧🇿", "🇨🇦", "🇨🇨", "🇨🇩", "🇨🇫", "🇨🇬", "🇨🇭", "🇨🇮", "🇨🇰", "🇨🇱", "🇨🇲", "🇨🇳", "🇨🇴", "🇨🇵", "🇨🇷", "🇨🇺", "🇨🇻", "🇨🇼", "🇨🇽", "🇨🇾", "🇨🇿", "🇩🇪"],
  },
};

export const EmojiIconPicker = ({ value, onChange, trigger }: EmojiIconPickerProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("faces");

  const handleSelect = (emoji: string) => {
    onChange(`emoji:${emoji}`);
    setOpen(false);
  };

  const filteredEmojis = searchQuery
    ? Object.values(EMOJI_CATEGORIES)
        .flatMap((cat) => cat.emojis)
        .filter((emoji) => emoji.includes(searchQuery))
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            {value?.startsWith("emoji:") ? (
              <span className="text-lg">{value.replace("emoji:", "")}</span>
            ) : (
              <SmilePlus className="w-4 h-4" />
            )}
            Pick Emoji
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search emojis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {searchQuery ? (
          <ScrollArea className="h-64 p-2">
            <div className="flex flex-wrap gap-1">
              {filteredEmojis?.length ? (
                filteredEmojis.map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(emoji)}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center text-xl hover:bg-accent rounded-md transition-colors",
                      value === `emoji:${emoji}` && "bg-primary/10 ring-1 ring-primary"
                    )}
                  >
                    {emoji}
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground p-4 text-center w-full">
                  No emojis found
                </p>
              )}
            </div>
          </ScrollArea>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full rounded-none border-b border-border bg-transparent h-auto p-0">
              <div className="flex overflow-x-auto w-full">
                {Object.entries(EMOJI_CATEGORIES).map(([key, cat]) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-xs"
                  >
                    {cat.emojis[0]}
                  </TabsTrigger>
                ))}
              </div>
            </TabsList>
            {Object.entries(EMOJI_CATEGORIES).map(([key, cat]) => (
              <TabsContent key={key} value={key} className="m-0">
                <ScrollArea className="h-52 p-2">
                  <div className="flex flex-wrap gap-1">
                    {cat.emojis.map((emoji, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelect(emoji)}
                        className={cn(
                          "w-8 h-8 flex items-center justify-center text-xl hover:bg-accent rounded-md transition-colors",
                          value === `emoji:${emoji}` && "bg-primary/10 ring-1 ring-primary"
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </PopoverContent>
    </Popover>
  );
};
