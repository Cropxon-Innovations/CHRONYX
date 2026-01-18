import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import {
  Download,
  Edit,
  Trash2,
  Copy,
  Share2,
  FolderInput,
  Layers,
  Lock,
  Play,
  ExternalLink,
  Image as ImageIcon,
  Info,
  Star,
  Eye,
} from "lucide-react";

interface Memory {
  id: string;
  title: string | null;
  file_url: string;
  media_type: "photo" | "video";
  collection_id: string | null;
  folder_id: string | null;
}

interface Collection {
  id: string;
  name: string;
}

interface Folder {
  id: string;
  name: string;
  is_locked: boolean;
}

interface MemoryContextMenuProps {
  children: React.ReactNode;
  memory: Memory;
  collections: Collection[];
  folders: Folder[];
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onShare: () => void;
  onCopyLink: () => void;
  onMoveToCollection: (collectionId: string | null) => void;
  onMoveToFolder: (folderId: string | null) => void;
  onSlideshow: () => void;
  onOpenInNewTab: () => void;
}

export const MemoryContextMenu = ({
  children,
  memory,
  collections,
  folders,
  onView,
  onEdit,
  onDelete,
  onDownload,
  onShare,
  onCopyLink,
  onMoveToCollection,
  onMoveToFolder,
  onSlideshow,
  onOpenInNewTab,
}: MemoryContextMenuProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={onView}>
          <Eye className="w-4 h-4 mr-2" />
          View Details
          <ContextMenuShortcut>Enter</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuItem onClick={onEdit}>
          <Edit className="w-4 h-4 mr-2" />
          Edit
          <ContextMenuShortcut>E</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={onSlideshow}>
          <Play className="w-4 h-4 mr-2" />
          Start Slideshow
          <ContextMenuShortcut>S</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem onClick={onOpenInNewTab}>
          <ExternalLink className="w-4 h-4 mr-2" />
          Open in New Tab
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Layers className="w-4 h-4 mr-2" />
            Move to Collection
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={() => onMoveToCollection(null)}>
              <span className="text-muted-foreground">No Collection</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
            {collections.map((c) => (
              <ContextMenuItem 
                key={c.id} 
                onClick={() => onMoveToCollection(c.id)}
                className={memory.collection_id === c.id ? "bg-accent" : ""}
              >
                {c.name}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FolderInput className="w-4 h-4 mr-2" />
            Move to Folder
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={() => onMoveToFolder(null)}>
              <span className="text-muted-foreground">No Folder</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
            {folders.map((f) => (
              <ContextMenuItem 
                key={f.id} 
                onClick={() => onMoveToFolder(f.id)}
                className={memory.folder_id === f.id ? "bg-accent" : ""}
              >
                {f.is_locked && <Lock className="w-3 h-3 mr-1" />}
                {f.name}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={onDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download
          <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem onClick={onShare}>
          <Share2 className="w-4 h-4 mr-2" />
          Share
          <ContextMenuShortcut>⌘S</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem onClick={onCopyLink}>
          <Copy className="w-4 h-4 mr-2" />
          Copy Link
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem 
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

interface FolderContextMenuProps {
  children: React.ReactNode;
  folder: Folder;
  isUnlocked: boolean;
  onOpen: () => void;
  onRename: () => void;
  onCustomize: () => void;
  onLock: () => void;
  onUnlock: () => void;
  onRelock: () => void;
  onDelete: () => void;
  onCreateSubfolder: () => void;
}

export const FolderContextMenu = ({
  children,
  folder,
  isUnlocked,
  onOpen,
  onRename,
  onCustomize,
  onLock,
  onUnlock,
  onRelock,
  onDelete,
  onCreateSubfolder,
}: FolderContextMenuProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onOpen}>
          <FolderInput className="w-4 h-4 mr-2" />
          Open
          <ContextMenuShortcut>Enter</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={onRename}>
          <Edit className="w-4 h-4 mr-2" />
          Rename
          <ContextMenuShortcut>F2</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem onClick={onCustomize}>
          <ImageIcon className="w-4 h-4 mr-2" />
          Customize
        </ContextMenuItem>

        <ContextMenuItem onClick={onCreateSubfolder}>
          <FolderInput className="w-4 h-4 mr-2" />
          New Subfolder
        </ContextMenuItem>

        <ContextMenuSeparator />

        {!folder.is_locked ? (
          <ContextMenuItem onClick={onLock}>
            <Lock className="w-4 h-4 mr-2" />
            Lock Folder
          </ContextMenuItem>
        ) : isUnlocked ? (
          <ContextMenuItem onClick={onRelock}>
            <Lock className="w-4 h-4 mr-2" />
            Re-lock Folder
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onClick={onUnlock}>
            <Lock className="w-4 h-4 mr-2" />
            Unlock Folder
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        <ContextMenuItem 
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
