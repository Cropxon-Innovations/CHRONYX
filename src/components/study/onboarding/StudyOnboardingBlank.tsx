import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft,
  ArrowRight,
  PenLine,
  Building2,
  Code2,
  Globe2,
  BookOpen,
  Sparkles
} from "lucide-react";
import { StudyCategory } from "@/hooks/useStudyOnboarding";

interface Props {
  onCreate: (studyName: string, category: StudyCategory | null) => void;
  onBack: () => void;
  isCreating: boolean;
}

const categories = [
  { id: "government" as StudyCategory, icon: Building2, label: "Government Exam" },
  { id: "technical" as StudyCategory, icon: Code2, label: "Technical Career" },
  { id: "international" as StudyCategory, icon: Globe2, label: "International Exam" },
  { id: null, icon: BookOpen, label: "Other / Custom" },
];

export const StudyOnboardingBlank = ({ onCreate, onBack, isCreating }: Props) => {
  const [studyName, setStudyName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<StudyCategory | null>(null);

  const handleCreate = () => {
    if (studyName.trim()) {
      onCreate(studyName.trim(), selectedCategory);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
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
            className="w-16 h-16 mx-auto rounded-2xl bg-muted/50 border border-border flex items-center justify-center mb-4"
          >
            <PenLine className="w-8 h-8 text-primary" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl font-light tracking-tight text-foreground mb-2"
          >
            Start from Blank
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground"
          >
            Create your own study structure
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
                placeholder="e.g., My UPSC Prep 2026"
                value={studyName}
                onChange={(e) => setStudyName(e.target.value)}
                autoFocus
              />
            </motion.div>

            {/* Category Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Label className="mb-3 block">Category (Optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <Card
                    key={cat.label}
                    className={`cursor-pointer transition-all p-3 hover:border-primary/30 ${
                      selectedCategory === cat.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border"
                    }`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <cat.icon className={`w-5 h-5 mb-2 ${
                      selectedCategory === cat.id ? "text-primary" : "text-muted-foreground"
                    }`} />
                    <p className="text-sm font-medium">{cat.label}</p>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* Create Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button 
                onClick={handleCreate} 
                className="w-full gap-2"
                disabled={!studyName.trim() || isCreating}
              >
                {isCreating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                    Creating...
                  </>
                ) : (
                  <>
                    Create Study
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </Card>

        {/* Info text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-xs text-muted-foreground mt-4"
        >
          You'll be able to add subjects, chapters, and topics after creation
        </motion.p>
      </motion.div>
    </div>
  );
};
