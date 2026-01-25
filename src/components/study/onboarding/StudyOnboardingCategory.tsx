import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft,
  ArrowRight,
  Building2,
  Code2,
  Globe2
} from "lucide-react";
import { StudyCategory } from "@/hooks/useStudyOnboarding";

interface Props {
  onSelectCategory: (category: StudyCategory) => void;
  onBack: () => void;
}

const categories: {
  id: StudyCategory;
  icon: React.ElementType;
  emoji: string;
  title: string;
  description: string;
  examples: string[];
  gradient: string;
}[] = [
  {
    id: "government",
    icon: Building2,
    emoji: "🏛️",
    title: "Government Exams",
    description: "Civil services, state PSC, and other competitive exams",
    examples: ["UPSC", "OPSC", "State PSC", "SSC"],
    gradient: "from-amber-500/10 to-amber-500/5"
  },
  {
    id: "technical",
    icon: Code2,
    emoji: "💻",
    title: "Technical Careers",
    description: "Software engineering, cloud, DevOps, and AI/ML tracks",
    examples: ["Backend", "Cloud", "AI/ML", "DevOps"],
    gradient: "from-blue-500/10 to-blue-500/5"
  },
  {
    id: "international",
    icon: Globe2,
    emoji: "🌍",
    title: "International Exams",
    description: "Standardized tests for higher education and immigration",
    examples: ["GMAT", "GRE", "IELTS", "TOEFL"],
    gradient: "from-emerald-500/10 to-emerald-500/5"
  }
];

export const StudyOnboardingCategory = ({ onSelectCategory, onBack }: Props) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
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
        <div className="text-center mb-8 sm:mb-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full mb-4"
          >
            <span>Step 1 of 4</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <span>Choose Category</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl font-light tracking-tight text-foreground mb-3"
          >
            What are you preparing for?
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground max-w-md mx-auto"
          >
            Select a category to see relevant templates
          </motion.p>
        </div>

        {/* Category Cards */}
        <div className="grid gap-4 sm:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Card
                className={`group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-border hover:border-primary/30 bg-gradient-to-r ${category.gradient}`}
                onClick={() => onSelectCategory(category.id)}
              >
                <div className="p-4 sm:p-6 flex items-start gap-4">
                  <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-background/80 border border-border flex items-center justify-center text-2xl sm:text-3xl">
                    {category.emoji}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground text-base sm:text-lg mb-1">
                      {category.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {category.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {category.examples.map((example) => (
                        <span
                          key={example}
                          className="text-xs bg-background/60 text-muted-foreground px-2 py-0.5 rounded border border-border/50"
                        >
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <ArrowRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-2" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
