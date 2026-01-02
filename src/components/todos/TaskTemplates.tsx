import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Layers, Check, Calendar, Clock, Briefcase, Coffee, Users, BookOpen, Dumbbell, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

type Priority = "high" | "medium" | "low";

interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  tasks: {
    text: string;
    priority: Priority;
    recurrence_type: "daily" | "weekly" | "monthly";
    recurrence_days?: number[];
  }[];
}

const templates: TaskTemplate[] = [
  {
    id: "daily-standup",
    name: "Daily Standup",
    description: "Morning routine for work planning",
    icon: <Coffee className="w-4 h-4" />,
    category: "Work",
    tasks: [
      { text: "Review yesterday's progress", priority: "medium", recurrence_type: "daily" },
      { text: "Plan today's priorities", priority: "high", recurrence_type: "daily" },
      { text: "Check calendar and meetings", priority: "medium", recurrence_type: "daily" },
    ],
  },
  {
    id: "weekly-review",
    name: "Weekly Review",
    description: "End of week reflection and planning",
    icon: <Calendar className="w-4 h-4" />,
    category: "Work",
    tasks: [
      { text: "Review week's accomplishments", priority: "high", recurrence_type: "weekly", recurrence_days: [4] },
      { text: "Clear inbox and pending items", priority: "medium", recurrence_type: "weekly", recurrence_days: [4] },
      { text: "Plan next week's goals", priority: "high", recurrence_type: "weekly", recurrence_days: [4] },
      { text: "Update project status", priority: "medium", recurrence_type: "weekly", recurrence_days: [4] },
    ],
  },
  {
    id: "morning-routine",
    name: "Morning Routine",
    description: "Start your day right",
    icon: <Clock className="w-4 h-4" />,
    category: "Personal",
    tasks: [
      { text: "Morning meditation", priority: "medium", recurrence_type: "daily" },
      { text: "Exercise", priority: "high", recurrence_type: "daily" },
      { text: "Review daily goals", priority: "high", recurrence_type: "daily" },
    ],
  },
  {
    id: "study-session",
    name: "Study Session",
    description: "Focused learning blocks",
    icon: <BookOpen className="w-4 h-4" />,
    category: "Learning",
    tasks: [
      { text: "Review previous notes", priority: "medium", recurrence_type: "daily" },
      { text: "Complete focused study block", priority: "high", recurrence_type: "daily" },
      { text: "Practice problems/exercises", priority: "medium", recurrence_type: "daily" },
      { text: "Update study log", priority: "low", recurrence_type: "daily" },
    ],
  },
  {
    id: "fitness-routine",
    name: "Fitness Routine",
    description: "Stay active throughout the week",
    icon: <Dumbbell className="w-4 h-4" />,
    category: "Health",
    tasks: [
      { text: "Strength training", priority: "high", recurrence_type: "weekly", recurrence_days: [0, 2, 4] },
      { text: "Cardio session", priority: "high", recurrence_type: "weekly", recurrence_days: [1, 3] },
      { text: "Stretching/Yoga", priority: "medium", recurrence_type: "daily" },
    ],
  },
  {
    id: "team-sync",
    name: "Team Sync",
    description: "Regular team communication",
    icon: <Users className="w-4 h-4" />,
    category: "Work",
    tasks: [
      { text: "Team standup meeting", priority: "high", recurrence_type: "weekly", recurrence_days: [0, 1, 2, 3, 4] },
      { text: "One-on-one check-in", priority: "medium", recurrence_type: "weekly", recurrence_days: [2] },
      { text: "Team retrospective", priority: "medium", recurrence_type: "weekly", recurrence_days: [4] },
    ],
  },
  {
    id: "self-care",
    name: "Self Care",
    description: "Wellness and mental health",
    icon: <Heart className="w-4 h-4" />,
    category: "Health",
    tasks: [
      { text: "Journaling", priority: "medium", recurrence_type: "daily" },
      { text: "Digital detox hour", priority: "low", recurrence_type: "daily" },
      { text: "Connect with a friend", priority: "medium", recurrence_type: "weekly", recurrence_days: [5, 6] },
    ],
  },
  {
    id: "project-management",
    name: "Project Management",
    description: "Keep projects on track",
    icon: <Briefcase className="w-4 h-4" />,
    category: "Work",
    tasks: [
      { text: "Update project board", priority: "medium", recurrence_type: "daily" },
      { text: "Review blocked items", priority: "high", recurrence_type: "daily" },
      { text: "Stakeholder update", priority: "medium", recurrence_type: "weekly", recurrence_days: [4] },
    ],
  },
];

const categoryColors: Record<string, string> = {
  Work: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  Personal: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  Learning: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  Health: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
};

interface TaskTemplatesProps {
  onApplyTemplate: (tasks: TaskTemplate["tasks"]) => void;
}

export default function TaskTemplates({ onApplyTemplate }: TaskTemplatesProps) {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);

  const handleApply = () => {
    if (selectedTemplate) {
      onApplyTemplate(selectedTemplate.tasks);
      setOpen(false);
      setSelectedTemplate(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Layers className="w-4 h-4 mr-2" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">Task Templates</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Quick-start with pre-built task routines
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="grid gap-3">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={cn(
                  "w-full text-left p-4 rounded-lg border transition-all",
                  selectedTemplate?.id === template.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30 bg-card"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    {template.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{template.name}</h3>
                      <Badge variant="outline" className={cn("text-xs", categoryColors[template.category])}>
                        {template.category}
                      </Badge>
                      {selectedTemplate?.id === template.id && (
                        <Check className="w-4 h-4 text-primary ml-auto" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {template.tasks.slice(0, 3).map((task, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                        >
                          {task.text.length > 25 ? task.text.substring(0, 25) + "..." : task.text}
                        </span>
                      ))}
                      {template.tasks.length > 3 && (
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                          +{template.tasks.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedTemplate && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{selectedTemplate.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedTemplate.tasks.length} tasks will be created
                </p>
              </div>
              <Button onClick={handleApply}>
                Apply Template
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
