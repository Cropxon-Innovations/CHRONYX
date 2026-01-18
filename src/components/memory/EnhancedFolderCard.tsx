import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Lock, 
  Unlock, 
  Palette,
  Trash2,
  Pencil,
  Check,
  Images,
  FolderOpen,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FolderIconPicker, getIconByName, getColorConfig, FOLDER_COLORS } from "./FolderIconPicker";
import { FolderContextMenu } from "./MemoryContextMenu";

type Folder = {
  id: string;
  name: string;
  parent_folder_id: string | null;
  is_locked: boolean;
  lock_hash: string | null;
  color?: string;
  icon?: string;
};

interface EnhancedFolderCardProps {
  folder: Folder;
  isUnlocked: boolean;
  isOpen?: boolean;
  memoryCount?: number;
  hasSubfolders?: boolean;
  onLock: () => void;
  onUnlock: () => void;
  onRelock: () => void;
  onUpdate: (updates: { color?: string; icon?: string; name?: string }) => void;
  onDelete: () => void;
  onClick?: () => void;
  onCreateSubfolder?: () => void;
  onDrop?: (memoryId: string) => void;
}

export const EnhancedFolderCard = ({
  folder,
  isUnlocked,
  isOpen = false,
  memoryCount = 0,
  hasSubfolders = false,
  onLock,
  onUnlock,
  onRelock,
  onUpdate,
  onDelete,
  onClick,
  onCreateSubfolder,
}: EnhancedFolderCardProps) => {
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(folder.color || FOLDER_COLORS[0].bg);
  const [selectedIcon, setSelectedIcon] = useState(folder.icon || "Default");
  const [isDragOver, setIsDragOver] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEmoji = folder.icon?.startsWith("emoji:");
  const colorConfig = getColorConfig(folder.color || FOLDER_COLORS[0].bg);
  
  // Check if folder is actually accessible (not locked OR unlocked with password)
  const isAccessible = !folder.is_locked || isUnlocked;

  // Sync newName when folder.name changes
  useEffect(() => {
    setNewName(folder.name);
  }, [folder.name]);

  // Sync selected values when folder changes
  useEffect(() => {
    setSelectedColor(folder.color || FOLDER_COLORS[0].bg);
    setSelectedIcon(folder.icon || "Default");
  }, [folder.color, folder.icon]);

  useEffect(() => {
    if (renameOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [renameOpen]);

  const handleRename = () => {
    if (newName.trim() && newName !== folder.name) {
      onUpdate({ name: newName.trim() });
    } else {
      setNewName(folder.name);
    }
    setRenameOpen(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isAccessible) return; // Don't allow drops on locked folders
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  // Handle click - if locked, prompt for password; if unlocked, navigate
  const handleClick = () => {
    if (folder.is_locked && !isUnlocked) {
      // Folder is locked and not yet unlocked - prompt for password
      onUnlock();
    } else {
      // Folder is accessible - navigate inside
      onClick?.();
    }
  };

  const saveCustomization = () => {
    onUpdate({ color: selectedColor, icon: selectedIcon });
    setCustomizeOpen(false);
  };

  // Mac-style folder card
  const cardContent = (
    <div
      className={cn(
        "group relative cursor-pointer transition-all duration-300 ease-out",
        "transform hover:-translate-y-1",
        isDragOver && "scale-105",
      )}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Mac-style folder shape */}
      <div className="relative">
        {/* Folder back (tab) */}
        <div 
          className={cn(
            "absolute top-0 left-2 w-8 h-3 rounded-t-md transition-all duration-300",
            colorConfig.bg,
            "border-t border-l border-r",
            colorConfig.border
          )}
          style={{
            background: `linear-gradient(180deg, ${colorConfig.hex}40 0%, ${colorConfig.hex}20 100%)`,
          }}
        />
        
        {/* Folder body */}
        <div 
          className={cn(
            "relative mt-2 rounded-lg transition-all duration-300 overflow-hidden",
            "border shadow-sm",
            colorConfig.border,
            isDragOver && "ring-2 ring-primary shadow-lg",
            isHovered && "shadow-md",
            folder.is_locked && !isUnlocked && "opacity-90"
          )}
          style={{
            background: `linear-gradient(145deg, ${colorConfig.hex}25 0%, ${colorConfig.hex}15 50%, ${colorConfig.hex}10 100%)`,
          }}
        >
          {/* Folder content area */}
          <div className="p-3 sm:p-4">
            {/* Icon area */}
            <div className="flex items-center justify-center mb-3">
              <div 
                className={cn(
                  "relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center",
                  "bg-background/40 backdrop-blur-sm",
                  "transition-all duration-300",
                  isHovered && isAccessible && "scale-110",
                  folder.is_locked && !isUnlocked && "blur-[2px]"
                )}
              >
                {isEmoji ? (
                  <span className="text-3xl sm:text-4xl select-none">
                    {folder.icon?.replace("emoji:", "")}
                  </span>
                ) : (
                  (() => {
                    const IconComponent = getIconByName(folder.icon || "Default");
                    return (
                      <IconComponent 
                        className={cn(
                          "w-8 h-8 sm:w-10 sm:h-10 transition-all duration-300",
                          colorConfig.text
                        )} 
                      />
                    );
                  })()
                )}
              </div>
            </div>

            {/* Folder name */}
            <div className="text-center">
              <span 
                className={cn(
                  "text-sm sm:text-base font-medium line-clamp-2 transition-all",
                  folder.is_locked && !isUnlocked && "blur-[1px]"
                )}
                title={folder.name}
              >
                {folder.name}
              </span>
              
              {/* Meta info */}
              <div className="flex items-center justify-center gap-2 mt-1 text-xs text-muted-foreground">
                {memoryCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Images className="w-3 h-3" />
                    {memoryCount}
                  </span>
                )}
                {hasSubfolders && (
                  <span className="flex items-center gap-1">
                    <FolderOpen className="w-3 h-3" />
                  </span>
                )}
                {hasSubfolders && isAccessible && (
                  <ChevronRight className="w-3 h-3" />
                )}
              </div>
            </div>
          </div>

          {/* Lock overlay for locked folders */}
          {folder.is_locked && !isUnlocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center animate-pulse">
                  <Lock className="w-6 h-6 text-amber-500" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Click to unlock</span>
              </div>
            </div>
          )}

          {/* Unlocked indicator */}
          {folder.is_locked && isUnlocked && (
            <div className="absolute top-2 right-2">
              <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center">
                <Unlock className="w-3.5 h-3.5 text-green-500" />
              </div>
            </div>
          )}

          {/* Action buttons (only show when accessible and hovered) */}
          {isAccessible && (
            <div 
              className={cn(
                "absolute top-2 right-2 flex items-center gap-1 transition-all duration-200",
                isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            >
              {folder.is_locked && isUnlocked && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-background/80 hover:bg-background shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRelock();
                  }}
                  title="Re-lock folder"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                </Button>
              )}
              {!folder.is_locked && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-background/80 hover:bg-background shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLock();
                  }}
                  title="Lock folder"
                >
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 bg-background/80 hover:bg-background shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setNewName(folder.name);
                  setRenameOpen(true);
                }}
                title="Rename folder"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 bg-background/80 hover:bg-background shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setCustomizeOpen(true);
                }}
                title="Customize folder"
              >
                <Palette className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Only wrap with context menu if accessible
  const wrappedContent = isAccessible ? (
    <FolderContextMenu
      folder={folder}
      isUnlocked={isUnlocked}
      onOpen={() => onClick?.()}
      onRename={() => {
        setNewName(folder.name);
        setRenameOpen(true);
      }}
      onCustomize={() => setCustomizeOpen(true)}
      onLock={onLock}
      onUnlock={onUnlock}
      onRelock={onRelock}
      onDelete={onDelete}
      onCreateSubfolder={() => onCreateSubfolder?.()}
    >
      {cardContent}
    </FolderContextMenu>
  ) : (
    cardContent
  );

  return (
    <>
      {wrappedContent}

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Folder Name</Label>
              <Input
                ref={inputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter folder name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRename();
                  } else if (e.key === "Escape") {
                    setNewName(folder.name);
                    setRenameOpen(false);
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setNewName(folder.name);
              setRenameOpen(false);
            }}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newName.trim()}>
              <Check className="w-4 h-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customize Dialog */}
      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Customize Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Icon & Color Picker */}
            <FolderIconPicker
              selectedIcon={selectedIcon}
              selectedColor={selectedColor}
              onIconChange={setSelectedIcon}
              onColorChange={setSelectedColor}
            />

            {/* Preview */}
            <div>
              <label className="text-sm font-medium mb-3 block">Preview</label>
              <div 
                className="p-4 rounded-lg border flex items-center gap-3"
                style={{
                  background: `linear-gradient(145deg, ${getColorConfig(selectedColor).hex}25 0%, ${getColorConfig(selectedColor).hex}15 100%)`,
                  borderColor: `${getColorConfig(selectedColor).hex}40`,
                }}
              >
                <div className="w-12 h-12 rounded-xl bg-background/60 flex items-center justify-center">
                  {selectedIcon.startsWith("emoji:") ? (
                    <span className="text-2xl">{selectedIcon.replace("emoji:", "")}</span>
                  ) : (
                    (() => {
                      const PreviewIcon = getIconByName(selectedIcon);
                      return <PreviewIcon className={cn("w-6 h-6", getColorConfig(selectedColor).text)} />;
                    })()
                  )}
                </div>
                <span className="text-sm font-medium">{folder.name}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => {
                onDelete();
                setCustomizeOpen(false);
              }}
              className="mr-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button variant="outline" onClick={() => setCustomizeOpen(false)}>Cancel</Button>
            <Button onClick={saveCustomization}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
