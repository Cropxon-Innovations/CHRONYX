import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  FolderOpen, 
  Lock, 
  Unlock, 
  Key, 
  Palette,
  Trash2,
  Pencil,
  Check,
  FolderClosed,
  ChevronRight,
  Images,
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
  const [isLockAnimating, setIsLockAnimating] = useState(false);
  const [isUnlockAnimating, setIsUnlockAnimating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEmoji = folder.icon?.startsWith("emoji:");
  const colorConfig = getColorConfig(folder.color || FOLDER_COLORS[0].bg);
  
  // Get icon component
  const IconComponent = isEmoji 
    ? null 
    : isOpen 
      ? getIconByName(folder.icon || "Default")
      : FolderClosed;

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

  const handleLockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLockAnimating(true);
    setTimeout(() => {
      setIsLockAnimating(false);
      onLock();
    }, 400);
  };

  const handleUnlockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUnlockAnimating(true);
    setTimeout(() => {
      setIsUnlockAnimating(false);
      onUnlock();
    }, 400);
  };

  const handleRelockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLockAnimating(true);
    setTimeout(() => {
      setIsLockAnimating(false);
      onRelock();
    }, 400);
  };

  const saveCustomization = () => {
    onUpdate({ color: selectedColor, icon: selectedIcon });
    setCustomizeOpen(false);
  };

  const cardContent = (
    <Card 
      className={cn(
        "cursor-pointer group border transition-all duration-300 ease-out overflow-hidden",
        "hover:shadow-lg hover:-translate-y-0.5",
        isDragOver && "ring-2 ring-primary scale-105 shadow-xl",
        isOpen && "shadow-md",
        colorConfig.border
      )}
      onClick={onClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className={cn(
        "p-3 sm:p-4 transition-all duration-300",
        colorConfig.bg
      )}>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Animated Folder Icon */}
          <div 
            className={cn(
              "relative flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-background/60 backdrop-blur-sm",
              "transition-all duration-300 ease-out",
              isOpen && "scale-110 rotate-[-3deg]"
            )}
          >
            {isEmoji ? (
              <span className="text-xl sm:text-2xl">{folder.icon?.replace("emoji:", "")}</span>
            ) : IconComponent && (
              <IconComponent 
                className={cn(
                  "w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300",
                  colorConfig.text,
                  isOpen && "animate-pulse"
                )} 
              />
            )}
            
            {/* Lock overlay animation */}
            {folder.is_locked && (
              <div 
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center",
                  "transition-all duration-300",
                  isUnlocked 
                    ? "bg-green-500/20 border border-green-500/50" 
                    : "bg-amber-500/20 border border-amber-500/50",
                  isLockAnimating && "animate-bounce",
                  isUnlockAnimating && "animate-[wiggle_0.4s_ease-in-out]"
                )}
              >
                {isUnlocked ? (
                  <Unlock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-500" />
                ) : (
                  <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500" />
                )}
              </div>
            )}
          </div>
          
          {/* Name and info */}
          <div className="flex-1 min-w-0">
            <span 
              className="text-sm sm:text-base font-medium truncate block"
              title={folder.name}
            >
              {folder.name}
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              {memoryCount > 0 && (
                <span className="flex items-center gap-1">
                  <Images className="w-3 h-3" />
                  {memoryCount}
                </span>
              )}
              {hasSubfolders && (
                <span className="flex items-center gap-1">
                  <FolderOpen className="w-3 h-3" />
                  Subfolders
                </span>
              )}
              {hasSubfolders && (
                <ChevronRight className="w-3 h-3" />
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {folder.is_locked ? (
              isUnlocked ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7 sm:h-8 sm:w-8 transition-all duration-300",
                    isLockAnimating && "scale-110"
                  )}
                  onClick={handleRelockClick}
                  title="Re-lock folder"
                >
                  <Unlock className={cn(
                    "w-4 h-4 text-green-500 transition-transform duration-300",
                    isLockAnimating && "rotate-12"
                  )} />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7 sm:h-8 sm:w-8 transition-all duration-300",
                    isUnlockAnimating && "scale-110"
                  )}
                  onClick={handleUnlockClick}
                  title="Unlock folder"
                >
                  <Lock className={cn(
                    "w-4 h-4 text-amber-500 transition-transform duration-300",
                    isUnlockAnimating && "animate-[shake_0.3s_ease-in-out]"
                  )} />
                </Button>
              )
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 opacity-0 group-hover:opacity-100 transition-all duration-200"
                onClick={handleLockClick}
                title="Lock folder"
              >
                <Key className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform duration-300",
                  isLockAnimating && "rotate-45 scale-110"
                )} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 opacity-0 group-hover:opacity-100 transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                setNewName(folder.name);
                setRenameOpen(true);
              }}
              title="Rename folder"
            >
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 opacity-0 group-hover:opacity-100 transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                setCustomizeOpen(true);
              }}
              title="Customize folder"
            >
              <Palette className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
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

      {/* Rename Dialog (Popup) */}
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
              <Card className={cn(
                "transition-all duration-300",
                getColorConfig(selectedColor).bg,
                getColorConfig(selectedColor).border,
                "border"
              )}>
                <CardContent className="p-4 flex items-center gap-3">
                  {(() => {
                    const previewColor = getColorConfig(selectedColor);
                    const previewIsEmoji = selectedIcon.startsWith("emoji:");
                    return (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-background/60 flex items-center justify-center">
                          {previewIsEmoji ? (
                            <span className="text-xl">{selectedIcon.replace("emoji:", "")}</span>
                          ) : (
                            (() => {
                              const PreviewIcon = getIconByName(selectedIcon);
                              return <PreviewIcon className={cn("w-5 h-5 transition-colors duration-300", previewColor.text)} />;
                            })()
                          )}
                        </div>
                        <span className="text-sm font-medium">{folder.name}</span>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
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
