import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft,
  ArrowRight,
  Brain,
  Upload,
  FileText,
  Image,
  X,
  Sparkles,
  AlertCircle
} from "lucide-react";

interface Props {
  onParse: (file: File | null, text: string, studyName: string) => void;
  onBack: () => void;
  isParsing: boolean;
}

export const StudyOnboardingAIParse = ({ onParse, onBack, isParsing }: Props) => {
  const [studyName, setStudyName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setText("");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setText("");
    }
  };

  const handleParse = () => {
    if (studyName.trim() && (file || text.trim())) {
      onParse(file, text.trim(), studyName.trim());
    }
  };

  const canSubmit = studyName.trim() && (file || text.trim());

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </motion.div>

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center mb-4"
          >
            <Brain className="w-8 h-8 text-primary" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl font-light tracking-tight text-foreground mb-2"
          >
            AI Parse Syllabus
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground"
          >
            Upload a syllabus and let AI structure it for you
          </motion.p>
        </div>

        {/* Form */}
        <Card className="p-6">
          <div className="space-y-6">
            {/* Study Name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Label htmlFor="studyName" className="mb-2 block">
                Study Name
              </Label>
              <Input
                id="studyName"
                placeholder="e.g., UPSC Prelims 2026"
                value={studyName}
                onChange={(e) => setStudyName(e.target.value)}
              />
            </motion.div>

            {/* File Upload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Label className="mb-2 block">Upload Syllabus</Label>
              
              {file ? (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                  <FileText className="w-8 h-8 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(null)}
                    className="shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    PDF, Image, or Text file
                  </p>
                </div>
              )}
            </motion.div>

            {/* OR Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-3"
            >
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">OR</span>
              <div className="flex-1 h-px bg-border" />
            </motion.div>

            {/* Text Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Label htmlFor="syllabusText" className="mb-2 block">
                Paste Syllabus Text
              </Label>
              <Textarea
                id="syllabusText"
                placeholder="Paste your syllabus content here..."
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (e.target.value) setFile(null);
                }}
                rows={5}
                className="resize-none"
              />
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-start gap-2 p-3 bg-accent/50 rounded-lg"
            >
              <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                AI will analyze your syllabus and create subjects, chapters, and topics automatically. You can edit the structure after creation.
              </p>
            </motion.div>

            {/* Parse Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Button 
                onClick={handleParse} 
                className="w-full gap-2"
                disabled={!canSubmit || isParsing}
              >
                {isParsing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Parse & Create Study
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
