import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, FileText, BookOpen, Image, X, Crop } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactCrop, { Crop as CropType, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface AddBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (data: {
    file: File;
    title: string;
    author: string;
    cover?: File;
    totalPages?: number;
  }) => void;
  isUploading?: boolean;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 80 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

export const AddBookDialog = ({
  open,
  onOpenChange,
  onUpload,
  isUploading,
}: AddBookDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [dragActive, setDragActive] = useState(false);
  
  // Cropping state
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile) return;

    const validExtensions = [
      ".pdf", ".epub",
      ".doc", ".docx",
      ".ppt", ".pptx",
      ".xls", ".xlsx",
      ".txt", ".rtf"
    ];
    
    const fileName = selectedFile.name.toLowerCase();
    const isValidFile = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidFile) return;

    setFile(selectedFile);

    if (!title) {
      const nameWithoutExt = selectedFile.name.replace(/\.(pdf|epub|docx?|pptx?|xlsx?|txt|rtf)$/i, "");
      setTitle(nameWithoutExt);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(selectedFile);
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 2 / 3)); // Book cover aspect ratio
  }, []);

  const applyCrop = useCallback(async () => {
    if (!imgRef.current || !completedCrop) return;

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Output size for cover (reasonable quality)
    const outputWidth = 300;
    const outputHeight = 450;
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const sourceX = completedCrop.x * scaleX;
    const sourceY = completedCrop.y * scaleY;
    const sourceWidth = completedCrop.width * scaleX;
    const sourceHeight = completedCrop.height * scaleY;

    ctx.drawImage(
      image,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, outputWidth, outputHeight
    );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const croppedFile = new File([blob], "cover.jpg", { type: "image/jpeg" });
          setCover(croppedFile);
          setCoverPreview(URL.createObjectURL(blob));
          setShowCropper(false);
          setCropImageSrc(null);
        }
      },
      "image/jpeg",
      0.9
    );
  }, [completedCrop]);

  const handleSubmit = () => {
    if (!file || !title.trim()) return;

    onUpload({
      file,
      title: title.trim(),
      author: author.trim(),
      cover: cover || undefined,
      totalPages: totalPages ? parseInt(totalPages) : undefined,
    });
  };

  const resetForm = () => {
    setFile(null);
    setCover(null);
    setCoverPreview(null);
    setTitle("");
    setAuthor("");
    setTotalPages("");
    setShowCropper(false);
    setCropImageSrc(null);
  };

  const getFileFormat = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['doc', 'docx'].includes(ext)) return ext;
    if (['ppt', 'pptx'].includes(ext)) return ext;
    if (['xls', 'xlsx'].includes(ext)) return ext;
    if (ext === 'epub') return 'epub';
    if (ext === 'txt' || ext === 'rtf') return 'txt';
    return 'pdf';
  };

  const fileFormat = file ? getFileFormat(file.name) : 'pdf';

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  // Cropper view
  if (showCropper && cropImageSrc) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crop className="w-5 h-5 text-primary" />
              Crop Cover Image
            </DialogTitle>
            <DialogDescription>
              Adjust the crop area for your book cover
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="relative max-h-[400px] overflow-hidden rounded-lg bg-muted flex items-center justify-center">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={2 / 3}
                className="max-h-[400px]"
              >
                <img
                  ref={imgRef}
                  src={cropImageSrc}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  className="max-h-[400px] w-auto"
                />
              </ReactCrop>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCropper(false);
              setCropImageSrc(null);
            }}>
              Cancel
            </Button>
            <Button onClick={applyCrop}>
              Apply Crop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Add to Library
          </DialogTitle>
          <DialogDescription>
            Upload documents, books, slides, or spreadsheets to your private library
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* File Upload Area */}
          {!file ? (
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-foreground mb-1">
                Drop your file here
              </p>
              <p className="text-sm text-muted-foreground">
                PDF, EPUB, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.epub,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.rtf"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground uppercase">
                  {fileFormat} • {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFile(null)}
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Book Details */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter book title"
                className="bg-card"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Enter author name"
                className="bg-card"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pages">Total Pages</Label>
                <Input
                  id="pages"
                  type="number"
                  value={totalPages}
                  onChange={(e) => setTotalPages(e.target.value)}
                  placeholder="Optional"
                  className="bg-card"
                />
              </div>

              <div className="grid gap-2">
                <Label>Cover Image</Label>
                {coverPreview ? (
                  <div className="relative aspect-[2/3] w-20 rounded-lg overflow-hidden border border-border">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => {
                        setCover(null);
                        setCoverPreview(null);
                      }}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className="flex items-center justify-center aspect-[2/3] w-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors"
                  >
                    <Image className="w-5 h-5 text-muted-foreground" />
                  </button>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!file || !title.trim() || isUploading}
          >
            {isUploading ? "Uploading..." : "Add to Library"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
