import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, Palette, Folder } from "lucide-react";
import {
  FolderOpen,
  FolderClosed,
  FolderHeart,
  FolderArchive,
  FolderCog,
  FolderCheck,
  FolderClock,
  FolderDot,
  FolderDown,
  FolderGit,
  FolderGit2,
  FolderInput,
  FolderKanban,
  FolderKey,
  FolderLock,
  FolderMinus,
  FolderOutput,
  FolderPen,
  FolderPlus,
  FolderRoot,
  FolderSearch,
  FolderSymlink,
  FolderSync,
  FolderTree,
  FolderUp,
  FolderX,
  Star,
  Heart,
  Music,
  Camera,
  Video,
  Image,
  FileText,
  Book,
  Bookmark,
  Archive,
  Briefcase,
  GraduationCap,
  Home,
  Building,
  Car,
  Plane,
  Ship,
  Globe,
  Map,
  MapPin,
  Cloud,
  Sun,
  Moon,
  Sparkles,
  Zap,
  Flame,
  Snowflake,
  Leaf,
  Flower2,
  Trophy,
  Medal,
  Crown,
  Diamond,
  Gift,
  Cake,
  PartyPopper,
  Baby,
  Dog,
  Cat,
  Bird,
  Fish,
  Bug,
  Coffee,
  Pizza,
  Apple,
  Gamepad2,
  Dumbbell,
  Bike,
  Timer,
  Calendar,
  Clock,
  Wallet,
  CreditCard,
  DollarSign,
  PiggyBank,
  ShieldCheck,
  Lock,
  Key,
  Settings,
  Wrench,
  Hammer,
  Paintbrush,
  Palette as PaletteIcon,
  Lightbulb,
  Megaphone,
  Bell,
  Mail,
  MessageCircle,
  Phone,
  Headphones,
  Mic,
  Radio,
  Tv,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Server,
  Database,
  HardDrive,
  Usb,
  Wifi,
  Battery,
  Code,
  Terminal,
  Github,
  Chrome,
  type LucideIcon,
} from "lucide-react";

interface FolderIconPickerProps {
  selectedIcon: string;
  selectedColor: string;
  onIconChange: (icon: string) => void;
  onColorChange: (color: string) => void;
}

// Extended icon categories
const ICON_CATEGORIES = {
  folders: {
    label: "Folders",
    icons: [
      { name: "Default", icon: FolderOpen },
      { name: "Closed", icon: FolderClosed },
      { name: "Heart", icon: FolderHeart },
      { name: "Archive", icon: FolderArchive },
      { name: "Settings", icon: FolderCog },
      { name: "Check", icon: FolderCheck },
      { name: "Clock", icon: FolderClock },
      { name: "Dot", icon: FolderDot },
      { name: "Input", icon: FolderInput },
      { name: "Key", icon: FolderKey },
      { name: "Lock", icon: FolderLock },
      { name: "Pen", icon: FolderPen },
      { name: "Search", icon: FolderSearch },
      { name: "Tree", icon: FolderTree },
    ],
  },
  favorites: {
    label: "Favorites",
    icons: [
      { name: "Star", icon: Star },
      { name: "Heart", icon: Heart },
      { name: "Crown", icon: Crown },
      { name: "Diamond", icon: Diamond },
      { name: "Trophy", icon: Trophy },
      { name: "Medal", icon: Medal },
      { name: "Bookmark", icon: Bookmark },
      { name: "Sparkles", icon: Sparkles },
    ],
  },
  media: {
    label: "Media",
    icons: [
      { name: "Camera", icon: Camera },
      { name: "Video", icon: Video },
      { name: "Image", icon: Image },
      { name: "Music", icon: Music },
      { name: "Mic", icon: Mic },
      { name: "Radio", icon: Radio },
      { name: "Headphones", icon: Headphones },
      { name: "Tv", icon: Tv },
    ],
  },
  work: {
    label: "Work",
    icons: [
      { name: "Briefcase", icon: Briefcase },
      { name: "FileText", icon: FileText },
      { name: "Book", icon: Book },
      { name: "GraduationCap", icon: GraduationCap },
      { name: "Calendar", icon: Calendar },
      { name: "Clock", icon: Clock },
      { name: "Mail", icon: Mail },
      { name: "MessageCircle", icon: MessageCircle },
    ],
  },
  travel: {
    label: "Travel",
    icons: [
      { name: "Globe", icon: Globe },
      { name: "Map", icon: Map },
      { name: "MapPin", icon: MapPin },
      { name: "Plane", icon: Plane },
      { name: "Car", icon: Car },
      { name: "Ship", icon: Ship },
      { name: "Bike", icon: Bike },
      { name: "Home", icon: Home },
    ],
  },
  nature: {
    label: "Nature",
    icons: [
      { name: "Sun", icon: Sun },
      { name: "Moon", icon: Moon },
      { name: "Cloud", icon: Cloud },
      { name: "Snowflake", icon: Snowflake },
      { name: "Flame", icon: Flame },
      { name: "Leaf", icon: Leaf },
      { name: "Flower", icon: Flower2 },
      { name: "Zap", icon: Zap },
    ],
  },
  life: {
    label: "Life",
    icons: [
      { name: "Gift", icon: Gift },
      { name: "Cake", icon: Cake },
      { name: "Party", icon: PartyPopper },
      { name: "Baby", icon: Baby },
      { name: "Dog", icon: Dog },
      { name: "Cat", icon: Cat },
      { name: "Coffee", icon: Coffee },
      { name: "Pizza", icon: Pizza },
    ],
  },
  finance: {
    label: "Finance",
    icons: [
      { name: "Wallet", icon: Wallet },
      { name: "CreditCard", icon: CreditCard },
      { name: "Dollar", icon: DollarSign },
      { name: "PiggyBank", icon: PiggyBank },
      { name: "Shield", icon: ShieldCheck },
      { name: "Lock", icon: Lock },
      { name: "Key", icon: Key },
      { name: "Building", icon: Building },
    ],
  },
  tech: {
    label: "Tech",
    icons: [
      { name: "Code", icon: Code },
      { name: "Terminal", icon: Terminal },
      { name: "Laptop", icon: Laptop },
      { name: "Smartphone", icon: Smartphone },
      { name: "Settings", icon: Settings },
      { name: "Wrench", icon: Wrench },
      { name: "Lightbulb", icon: Lightbulb },
      { name: "Gamepad", icon: Gamepad2 },
    ],
  },
};

// Extended emoji list for quick selection
const QUICK_EMOJIS = [
  "📁", "📂", "🗂️", "📚", "📖", "📝", "✏️", "🖼️", "📷", "📹", "🎬", "🎵", "🎶", "🎤",
  "💼", "🏠", "🏢", "🚗", "✈️", "🌍", "🗺️", "📍", "⭐", "❤️", "💎", "👑", "🏆", "🎖️",
  "🎁", "🎂", "🎉", "👶", "🐕", "🐈", "☕", "🍕", "🍎", "🎮", "💪", "🚴", "⏱️", "📅",
  "💰", "💳", "🔒", "🔑", "⚙️", "💡", "🔔", "📧", "💬", "📱", "💻", "🌸", "🌺", "🌻",
  "🌴", "🌙", "☀️", "⛅", "❄️", "🔥", "⚡", "🌈", "🎓", "📐", "🔬", "🎨", "🎭", "🎪",
];

// Extended color palette with more variety
const FOLDER_COLORS = [
  // Neutral
  { name: "Default", bg: "bg-accent/30", text: "text-muted-foreground", border: "border-border", hex: "#94a3b8" },
  { name: "Slate", bg: "bg-slate-500/20", text: "text-slate-500", border: "border-slate-500/30", hex: "#64748b" },
  
  // Blues
  { name: "Blue", bg: "bg-blue-500/20", text: "text-blue-500", border: "border-blue-500/30", hex: "#3b82f6" },
  { name: "Sky", bg: "bg-sky-500/20", text: "text-sky-500", border: "border-sky-500/30", hex: "#0ea5e9" },
  { name: "Cyan", bg: "bg-cyan-500/20", text: "text-cyan-500", border: "border-cyan-500/30", hex: "#06b6d4" },
  { name: "Indigo", bg: "bg-indigo-500/20", text: "text-indigo-500", border: "border-indigo-500/30", hex: "#6366f1" },
  
  // Greens
  { name: "Green", bg: "bg-green-500/20", text: "text-green-500", border: "border-green-500/30", hex: "#22c55e" },
  { name: "Emerald", bg: "bg-emerald-500/20", text: "text-emerald-500", border: "border-emerald-500/30", hex: "#10b981" },
  { name: "Teal", bg: "bg-teal-500/20", text: "text-teal-500", border: "border-teal-500/30", hex: "#14b8a6" },
  { name: "Lime", bg: "bg-lime-500/20", text: "text-lime-500", border: "border-lime-500/30", hex: "#84cc16" },
  
  // Warm
  { name: "Yellow", bg: "bg-yellow-500/20", text: "text-yellow-600", border: "border-yellow-500/30", hex: "#eab308" },
  { name: "Amber", bg: "bg-amber-500/20", text: "text-amber-500", border: "border-amber-500/30", hex: "#f59e0b" },
  { name: "Orange", bg: "bg-orange-500/20", text: "text-orange-500", border: "border-orange-500/30", hex: "#f97316" },
  { name: "Red", bg: "bg-red-500/20", text: "text-red-500", border: "border-red-500/30", hex: "#ef4444" },
  
  // Pink & Purple
  { name: "Rose", bg: "bg-rose-500/20", text: "text-rose-500", border: "border-rose-500/30", hex: "#f43f5e" },
  { name: "Pink", bg: "bg-pink-500/20", text: "text-pink-500", border: "border-pink-500/30", hex: "#ec4899" },
  { name: "Fuchsia", bg: "bg-fuchsia-500/20", text: "text-fuchsia-500", border: "border-fuchsia-500/30", hex: "#d946ef" },
  { name: "Purple", bg: "bg-purple-500/20", text: "text-purple-500", border: "border-purple-500/30", hex: "#a855f7" },
  { name: "Violet", bg: "bg-violet-500/20", text: "text-violet-500", border: "border-violet-500/30", hex: "#8b5cf6" },
];

// Helper to get icon component by name
export const getIconByName = (name: string): LucideIcon => {
  for (const category of Object.values(ICON_CATEGORIES)) {
    const found = category.icons.find(i => i.name === name);
    if (found) return found.icon;
  }
  return FolderOpen;
};

// Helper to get color config by bg class
export const getColorConfig = (bgClass: string) => {
  return FOLDER_COLORS.find(c => c.bg === bgClass) || FOLDER_COLORS[0];
};

export const FolderIconPicker = ({
  selectedIcon,
  selectedColor,
  onIconChange,
  onColorChange,
}: FolderIconPickerProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"icons" | "emojis" | "colors">("icons");
  const [activeIconCategory, setActiveIconCategory] = useState("folders");
  const [searchQuery, setSearchQuery] = useState("");

  const isEmoji = selectedIcon.startsWith("emoji:");
  const currentColorConfig = getColorConfig(selectedColor);

  // Filter icons based on search
  const filteredIcons = searchQuery
    ? Object.values(ICON_CATEGORIES).flatMap(cat => 
        cat.icons.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : null;

  const filteredEmojis = searchQuery
    ? QUICK_EMOJIS.filter(e => e.includes(searchQuery))
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="lg" 
          className={cn(
            "h-16 w-full gap-3 justify-start",
            currentColorConfig.bg,
            currentColorConfig.border
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center bg-background/60",
            currentColorConfig.border
          )}>
            {isEmoji ? (
              <span className="text-2xl">{selectedIcon.replace("emoji:", "")}</span>
            ) : (
              (() => {
                const IconComp = getIconByName(selectedIcon);
                return <IconComp className={cn("w-5 h-5", currentColorConfig.text)} />;
              })()
            )}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">Icon & Color</span>
            <span className="text-xs text-muted-foreground">
              {isEmoji ? "Emoji" : selectedIcon} • {currentColorConfig.name}
            </span>
          </div>
          <PaletteIcon className="w-4 h-4 ml-auto text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        {/* Search */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search icons, emojis, colors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="w-full rounded-none border-b border-border bg-transparent h-auto p-0">
            <TabsTrigger
              value="icons"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5"
            >
              <Folder className="w-4 h-4 mr-2" />
              Icons
            </TabsTrigger>
            <TabsTrigger
              value="emojis"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5"
            >
              <span className="mr-2">😀</span>
              Emojis
            </TabsTrigger>
            <TabsTrigger
              value="colors"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5"
            >
              <PaletteIcon className="w-4 h-4 mr-2" />
              Colors
            </TabsTrigger>
          </TabsList>

          {/* Icons Tab */}
          <TabsContent value="icons" className="m-0">
            {searchQuery ? (
              <ScrollArea className="h-64 p-2">
                <div className="grid grid-cols-6 gap-1.5">
                  {filteredIcons?.length ? (
                    filteredIcons.map((iconItem) => {
                      const IconComp = iconItem.icon;
                      return (
                        <button
                          key={iconItem.name}
                          onClick={() => {
                            onIconChange(iconItem.name);
                            setSearchQuery("");
                          }}
                          className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-lg transition-all hover:bg-accent",
                            selectedIcon === iconItem.name && "bg-primary/10 ring-1 ring-primary"
                          )}
                          title={iconItem.name}
                        >
                          <IconComp className={cn("w-5 h-5", currentColorConfig.text)} />
                        </button>
                      );
                    })
                  ) : (
                    <p className="col-span-6 text-sm text-muted-foreground p-4 text-center">
                      No icons found
                    </p>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <>
                {/* Icon category tabs */}
                <div className="flex overflow-x-auto border-b border-border p-1 gap-1">
                  {Object.entries(ICON_CATEGORIES).map(([key, cat]) => (
                    <button
                      key={key}
                      onClick={() => setActiveIconCategory(key)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors",
                        activeIconCategory === key
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <ScrollArea className="h-48 p-2">
                  <div className="grid grid-cols-6 gap-1.5">
                    {ICON_CATEGORIES[activeIconCategory as keyof typeof ICON_CATEGORIES]?.icons.map((iconItem) => {
                      const IconComp = iconItem.icon;
                      return (
                        <button
                          key={iconItem.name}
                          onClick={() => onIconChange(iconItem.name)}
                          className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-lg transition-all hover:bg-accent",
                            selectedIcon === iconItem.name && !isEmoji && "bg-primary/10 ring-1 ring-primary"
                          )}
                          title={iconItem.name}
                        >
                          <IconComp className={cn("w-5 h-5", currentColorConfig.text)} />
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </>
            )}
          </TabsContent>

          {/* Emojis Tab */}
          <TabsContent value="emojis" className="m-0">
            <ScrollArea className="h-64 p-2">
              <div className="grid grid-cols-8 gap-1">
                {(searchQuery ? filteredEmojis : QUICK_EMOJIS)?.map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onIconChange(`emoji:${emoji}`);
                      setSearchQuery("");
                    }}
                    className={cn(
                      "w-9 h-9 flex items-center justify-center text-xl hover:bg-accent rounded-lg transition-colors",
                      selectedIcon === `emoji:${emoji}` && "bg-primary/10 ring-1 ring-primary"
                    )}
                  >
                    {emoji}
                  </button>
                )) || (
                  <p className="col-span-8 text-sm text-muted-foreground p-4 text-center">
                    No emojis found
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Colors Tab */}
          <TabsContent value="colors" className="m-0">
            <ScrollArea className="h-64 p-3">
              <div className="grid grid-cols-4 gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => onColorChange(color.bg)}
                    className={cn(
                      "h-12 rounded-lg transition-all relative overflow-hidden border-2",
                      color.bg,
                      color.border,
                      selectedColor === color.bg
                        ? "ring-2 ring-primary ring-offset-2 scale-105"
                        : "hover:scale-105"
                    )}
                    title={color.name}
                  >
                    {selectedColor === color.bg && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", color.text)}>
                          ✓
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Color applies to folder background and icon
              </p>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Preview */}
        <div className="p-3 border-t border-border">
          <div className={cn(
            "p-3 rounded-lg border flex items-center gap-3",
            currentColorConfig.bg,
            currentColorConfig.border
          )}>
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center bg-background/60"
            )}>
              {isEmoji ? (
                <span className="text-xl">{selectedIcon.replace("emoji:", "")}</span>
              ) : (
                (() => {
                  const IconComp = getIconByName(selectedIcon);
                  return <IconComp className={cn("w-5 h-5", currentColorConfig.text)} />;
                })()
              )}
            </div>
            <div>
              <span className="text-sm font-medium">Preview Folder</span>
              <p className="text-xs text-muted-foreground">How your folder will look</p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export { FOLDER_COLORS, ICON_CATEGORIES, QUICK_EMOJIS };
