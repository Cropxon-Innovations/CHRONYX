import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  ArrowRight,
  Search,
  Star,
  Sparkles,
  Clock,
  BookOpen,
  Filter
} from "lucide-react";
import { StudyCategory, StudyTemplate } from "@/hooks/useStudyOnboarding";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  category: StudyCategory;
  templates: StudyTemplate[];
  onSelectTemplate: (template: StudyTemplate) => void;
  onBack: () => void;
}

const categoryTitles: Record<StudyCategory, string> = {
  government: "Government Exams",
  technical: "Technical Careers",
  international: "International Exams"
};

export const StudyOnboardingTemplates = ({ 
  category, 
  templates, 
  onSelectTemplate, 
  onBack 
}: Props) => {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");

  const filteredTemplates = useMemo(() => {
    return templates
      .filter(t => t.category === category)
      .filter(t => {
        if (!search) return true;
        return t.name.toLowerCase().includes(search.toLowerCase()) ||
               t.subcategory.toLowerCase().includes(search.toLowerCase()) ||
               t.description.toLowerCase().includes(search.toLowerCase());
      })
      .filter(t => {
        if (levelFilter === "all") return true;
        return t.level === levelFilter;
      })
      .filter(t => {
        if (yearFilter === "all") return true;
        return t.year.toString() === yearFilter;
      });
  }, [templates, category, search, levelFilter, yearFilter]);

  const years = useMemo(() => {
    const uniqueYears = [...new Set(templates.filter(t => t.category === category).map(t => t.year))];
    return uniqueYears.sort((a, b) => b - a);
  }, [templates, category]);

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mx-auto"
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
        <div className="mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full mb-4"
          >
            <span>Step 2 of 4</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <span>Choose Template</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl font-light tracking-tight text-foreground mb-2"
          >
            {categoryTitles[category]} Templates
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground"
          >
            Choose a template to get started with a pre-built syllabus
          </motion.p>
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="full-prep">Full Prep</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Templates Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
            >
              <Card
                className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-border hover:border-primary/30 h-full"
                onClick={() => onSelectTemplate(template)}
              >
                <div className="p-4 flex flex-col h-full">
                  {/* Header with icon and badges */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-2xl">{template.icon}</div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {template.isPopular && (
                        <Badge variant="secondary" className="text-xs gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
                          <Star className="w-3 h-3" />
                          Popular
                        </Badge>
                      )}
                      {template.isNew && (
                        <Badge variant="secondary" className="text-xs gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          <Sparkles className="w-3 h-3" />
                          New
                        </Badge>
                      )}
                      {template.isRecommended && (
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                          Recommended
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Title and description */}
                  <h3 className="font-medium text-foreground mb-1">
                    {template.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2 flex-1">
                    {template.description}
                  </p>
                  
                  {/* Meta info */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {template.subjects} subjects
                      </span>
                      <span>{template.topics} topics</span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {template.year}
                    </span>
                  </div>
                  
                  {/* Level badge */}
                  <div className="mt-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      template.level === 'beginner' ? 'bg-emerald-500/10 text-emerald-600' :
                      template.level === 'intermediate' ? 'bg-blue-500/10 text-blue-600' :
                      template.level === 'advanced' ? 'bg-purple-500/10 text-purple-600' :
                      'bg-amber-500/10 text-amber-600'
                    }`}>
                      {template.level.replace('-', ' ')}
                    </span>
                  </div>
                </div>
                
                {/* Hover arrow */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty state */}
        {filteredTemplates.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">No templates found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
