import { cn } from "@/lib/utils";
import { 
  Clock, 
  BookOpen, 
  FileText, 
  Wallet, 
  Camera, 
  Receipt, 
  Feather,
  StickyNote,
  Search,
  Archive
} from "lucide-react";
import { NoteType } from "./NoteTypeSelector";

export type SmartSection = 
  | "recent" 
  | "quick_note" 
  | "journal" 
  | "document" 
  | "finance_note" 
  | "memory_note" 
  | "tax_note" 
  | "story"
  | "archived";

interface SmartSectionConfig {
  id: SmartSection;
  label: string;
  icon: React.ElementType;
  color: string;
  filterType?: NoteType;
}

export const SMART_SECTIONS: SmartSectionConfig[] = [
  { id: "recent", label: "Recent", icon: Clock, color: "text-foreground" },
  { id: "quick_note", label: "Quick Notes", icon: StickyNote, color: "text-amber-600", filterType: "quick_note" },
  { id: "journal", label: "Journals", icon: BookOpen, color: "text-purple-600", filterType: "journal" },
  { id: "document", label: "Documents", icon: FileText, color: "text-blue-600", filterType: "document" },
  { id: "finance_note", label: "Finance", icon: Wallet, color: "text-emerald-600", filterType: "finance_note" },
  { id: "memory_note", label: "Memories", icon: Camera, color: "text-pink-600", filterType: "memory_note" },
  { id: "tax_note", label: "Tax", icon: Receipt, color: "text-orange-600", filterType: "tax_note" },
  { id: "story", label: "Stories", icon: Feather, color: "text-indigo-600", filterType: "story" },
  { id: "archived", label: "Archived", icon: Archive, color: "text-muted-foreground" },
];

interface SmartSectionsProps {
  selectedSection: SmartSection;
  onSelectSection: (section: SmartSection) => void;
  noteCounts: Record<SmartSection, number>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const SmartSections = ({
  selectedSection,
  onSelectSection,
  noteCounts,
  searchQuery,
  onSearchChange,
}: SmartSectionsProps) => {
  return (
    <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            "w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card",
            "text-sm placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
            "transition-all duration-200"
          )}
        />
      </div>

      {/* Sections */}
      <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
        {SMART_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isSelected = selectedSection === section.id;
          const count = noteCounts[section.id] || 0;

          return (
            <button
              key={section.id}
              onClick={() => onSelectSection(section.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200",
                "whitespace-nowrap lg:whitespace-normal flex-shrink-0 lg:flex-shrink",
                "text-sm font-medium",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <Icon className={cn(
                "w-4 h-4 flex-shrink-0",
                isSelected ? "text-primary-foreground" : section.color
              )} />
              <span className="flex-1 text-left">{section.label}</span>
              {count > 0 && (
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  isSelected 
                    ? "bg-primary-foreground/20 text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
