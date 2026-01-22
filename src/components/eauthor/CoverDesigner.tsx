import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Upload, Palette, Download, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Book {
  id: string;
  title: string;
  subtitle: string | null;
  author_name: string | null;
  cover_url: string | null;
}

interface CoverDesignerProps {
  book: Book;
  onUpdate: (coverUrl: string) => void;
}

const coverTemplates = [
  { id: "minimal", name: "Minimal", gradient: "from-slate-900 to-slate-700", textColor: "text-white" },
  { id: "gradient-purple", name: "Purple", gradient: "from-purple-600 to-indigo-900", textColor: "text-white" },
  { id: "gradient-blue", name: "Ocean", gradient: "from-blue-600 to-cyan-400", textColor: "text-white" },
  { id: "gradient-sunset", name: "Sunset", gradient: "from-orange-500 to-pink-600", textColor: "text-white" },
  { id: "gradient-forest", name: "Forest", gradient: "from-emerald-700 to-teal-900", textColor: "text-white" },
  { id: "cream", name: "Classic", gradient: "from-amber-50 to-orange-100", textColor: "text-amber-900" },
];

const CoverDesigner = ({ book, onUpdate }: CoverDesignerProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState(coverTemplates[0]);
  const [customImage, setCustomImage] = useState<string | null>(book.cover_url);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${book.id}/cover.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("book-assets")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", variant: "destructive" });
      setIsUploading(false);
      return;
    }

    const { data } = supabase.storage.from("book-assets").getPublicUrl(filePath);
    const coverUrl = data.publicUrl;

    const { error: updateError } = await supabase
      .from("books")
      .update({ cover_url: coverUrl })
      .eq("id", book.id);

    if (!updateError) {
      setCustomImage(coverUrl);
      onUpdate(coverUrl);
      toast({ title: "Cover updated!" });
    }
    setIsUploading(false);
  };

  const generateCover = () => {
    // In production, this would call an AI image generation API
    toast({ title: "AI cover generation coming soon!" });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h3 className="font-medium text-sm flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Cover Designer
        </h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Preview */}
          <div className="flex justify-center">
            <div className="w-40 aspect-[2/3] rounded-lg shadow-xl overflow-hidden">
              {customImage ? (
                <img
                  src={customImage}
                  alt="Book cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={cn(
                    "w-full h-full bg-gradient-to-br flex flex-col items-center justify-center p-4 text-center",
                    selectedTemplate.gradient,
                    selectedTemplate.textColor
                  )}
                >
                  <BookOpen className="w-8 h-8 mb-3 opacity-60" />
                  <h3 className="font-serif font-bold text-sm leading-tight">
                    {book.title}
                  </h3>
                  {book.subtitle && (
                    <p className="text-[10px] opacity-80 mt-1">
                      {book.subtitle}
                    </p>
                  )}
                  <p className="text-[10px] opacity-60 mt-2">
                    {book.author_name || "Author"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Upload Image */}
          <div>
            <Label className="text-xs">Upload Cover Image</Label>
            <div className="mt-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="cover-upload"
              />
              <label
                htmlFor="cover-upload"
                className={cn(
                  "flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-border rounded-lg cursor-pointer transition-colors",
                  "hover:border-primary hover:bg-primary/5",
                  isUploading && "opacity-50 pointer-events-none"
                )}
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm">
                  {isUploading ? "Uploading..." : "Upload Image"}
                </span>
              </label>
            </div>
          </div>

          {/* AI Generate */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={generateCover}
          >
            <Sparkles className="w-4 h-4" />
            Generate with AI
          </Button>

          {/* Templates */}
          <div>
            <Label className="text-xs">Or Choose a Template</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {coverTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setCustomImage(null);
                  }}
                  className={cn(
                    "aspect-[2/3] rounded-md overflow-hidden border-2 transition-all",
                    selectedTemplate.id === template.id && !customImage
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-transparent hover:border-border"
                  )}
                >
                  <div
                    className={cn(
                      "w-full h-full bg-gradient-to-br flex items-center justify-center",
                      template.gradient
                    )}
                  >
                    <span className={cn("text-[8px] font-medium", template.textColor)}>
                      {template.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Export */}
          <Button variant="outline" className="w-full gap-2">
            <Download className="w-4 h-4" />
            Export Cover
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
};

export default CoverDesigner;
