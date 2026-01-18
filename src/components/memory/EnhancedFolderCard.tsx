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

  // Mac/Apple-style folder card - proper folder shape
  const cardContent = (
    <div
      className={cn(
        "group relative cursor-pointer transition-all duration-300 ease-out flex flex-col items-center",
        "transform hover:-translate-y-1 hover:scale-105",
        isDragOver && "scale-110",
      )}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Mac-style folder icon */}
      <div className="relative w-20 h-16 sm:w-24 sm:h-20">
        {/* Folder back/tab */}
        <div 
          className="absolute top-0 left-1 w-8 sm:w-10 h-3 sm:h-4 rounded-t-lg"
          style={{
            background: `linear-gradient(180deg, ${colorConfig.hex} 0%, ${colorConfig.hex}dd 100%)`,
          }}
        />
        
        {/* Folder body */}
        <div 
          className={cn(
            "absolute top-2 sm:top-3 inset-x-0 bottom-0 rounded-lg sm:rounded-xl transition-all duration-300",
            isDragOver && "ring-2 ring-primary",
            folder.is_locked && !isUnlocked && "opacity-80"
          )}
          style={{
            background: `linear-gradient(160deg, ${colorConfig.hex} 0%, ${colorConfig.hex}dd 50%, ${colorConfig.hex}bb 100%)`,
            boxShadow: isHovered 
              ? `0 8px 20px ${colorConfig.hex}50, inset 0 1px 0 rgba(255,255,255,0.2)` 
              : `0 4px 12px ${colorConfig.hex}30, inset 0 1px 0 rgba(255,255,255,0.15)`,
          }}
        >
          {/* Folder highlight/shine effect */}
          <div 
            className="absolute inset-x-0 top-0 h-2 sm:h-3 rounded-t-lg sm:rounded-t-xl"
            style={{
              background: `linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%)`,
            }}
          />
          
          {/* Inner icon/emoji display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center",
                "bg-white/15 backdrop-blur-[2px]",
                "transition-all duration-300",
                folder.is_locked && !isUnlocked && "blur-[3px] opacity-50"
              )}
            >
              {isEmoji ? (
                <span className="text-xl sm:text-2xl select-none drop-shadow-sm">
                  {folder.icon?.replace("emoji:", "")}
                </span>
              ) : (
                (() => {
                  const IconComponent = getIconByName(folder.icon || "Default");
                  return (
                    <IconComponent 
                      className="w-5 h-5 sm:w-6 sm:h-6 text-white/90 drop-shadow-sm"
                    />
                  );
                })()
              )}
            </div>
          </div>
          
          {/* Lock overlay for locked folders */}
          {folder.is_locked && !isUnlocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] rounded-lg sm:rounded-xl">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-500/25 border-2 border-amber-400/60 flex items-center justify-center animate-pulse shadow-lg">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 drop-shadow" />
              </div>
            </div>
          )}

          {/* Unlocked indicator badge */}
          {folder.is_locked && isUnlocked && (
            <div className="absolute -top-1 -right-1 z-10">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-500 border-2 border-background flex items-center justify-center shadow-md">
                <Unlock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Hover action buttons */}
        {isAccessible && isHovered && (
          <div className="absolute -top-2 -right-2 flex items-center gap-0.5 z-10">
            {folder.is_locked && isUnlocked && (
              <Button
                variant="secondary"
                size="icon"
                className="h-6 w-6 rounded-full shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  onRelock();
                }}
                title="Re-lock"
              >
                <Lock className="w-3 h-3 text-amber-600" />
              </Button>
            )}
            {!folder.is_locked && (
              <Button
                variant="secondary"
                size="icon"
                className="h-6 w-6 rounded-full shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  onLock();
                }}
                title="Lock"
              >
                <Lock className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Folder name and meta - below the folder icon */}
      <div className="mt-2 text-center w-full px-1">
        <span 
          className={cn(
            "text-xs sm:text-sm font-medium line-clamp-2 transition-all leading-tight",
            folder.is_locked && !isUnlocked && "text-muted-foreground"
          )}
          title={folder.name}
        >
          {folder.is_locked && !isUnlocked ? "Click to unlock" : folder.name}
        </span>
        
        {/* Meta info */}
        {isAccessible && (memoryCount > 0 || hasSubfolders) && (
          <div className="flex items-center justify-center gap-1.5 mt-0.5 text-[10px] sm:text-xs text-muted-foreground">
            {memoryCount > 0 && (
              <span className="flex items-center gap-0.5">
                <Images className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {memoryCount}
              </span>
            )}
            {hasSubfolders && (
              <span className="flex items-center gap-0.5">
                <FolderOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </span>
            )}
          </div>
        )}
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

            {/* Preview - Mac-style folder */}
            <div>
              <label className="text-sm font-medium mb-3 block">Preview</label>
              <div className="flex justify-center py-4">
                <div className="flex flex-col items-center">
                  {/* Mac-style folder preview */}
                  <div className="relative w-20 h-16">
                    {/* Tab */}
                    <div 
                      className="absolute top-0 left-1 w-8 h-3 rounded-t-lg"
                      style={{
                        background: `linear-gradient(180deg, ${getColorConfig(selectedColor).hex} 0%, ${getColorConfig(selectedColor).hex}dd 100%)`,
                      }}
                    />
                    {/* Body */}
                    <div 
                      className="absolute top-2 inset-x-0 bottom-0 rounded-xl"
                      style={{
                        background: `linear-gradient(160deg, ${getColorConfig(selectedColor).hex} 0%, ${getColorConfig(selectedColor).hex}dd 50%, ${getColorConfig(selectedColor).hex}bb 100%)`,
                        boxShadow: `0 4px 12px ${getColorConfig(selectedColor).hex}40`,
                      }}
                    >
                      <div 
                        className="absolute inset-x-0 top-0 h-2 rounded-t-xl"
                        style={{ background: `linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                          {selectedIcon.startsWith("emoji:") ? (
                            <span className="text-xl">{selectedIcon.replace("emoji:", "")}</span>
                          ) : (
                            (() => {
                              const PreviewIcon = getIconByName(selectedIcon);
                              return <PreviewIcon className="w-5 h-5 text-white/90" />;
                            })()
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-medium mt-2">{folder.name}</span>
                </div>
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
