import AchievementItem from "@/components/dashboard/AchievementItem";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const categories = ["All", "Learning", "Finance", "Health", "Personal", "Career"];

const achievements = [
  {
    date: "December 28, 2024",
    title: "100 Day Study Streak",
    description: "Maintained consistent learning for 100 consecutive days without missing a single day.",
    category: "Learning",
  },
  {
    date: "December 15, 2024",
    title: "25% Loan Milestone",
    description: "Successfully paid off 25% of the home loan principal amount.",
    category: "Finance",
  },
  {
    date: "November 30, 2024",
    title: "Morning Routine Mastery",
    description: "Completed morning routine consistently for 60 days.",
    category: "Personal",
  },
  {
    date: "November 1, 2024",
    title: "First 10K Run",
    description: "Completed first 10 kilometer run under 55 minutes.",
    category: "Health",
  },
  {
    date: "October 15, 2024",
    title: "Emergency Fund Complete",
    description: "Built 6 months of emergency fund savings.",
    category: "Finance",
  },
  {
    date: "September 20, 2024",
    title: "Book Club: 12 Books",
    description: "Completed reading 12 books this year.",
    category: "Learning",
  },
  {
    date: "August 5, 2024",
    title: "Career Promotion",
    description: "Promoted to Senior Engineer role.",
    category: "Career",
  },
];

const Achievements = () => {
  const [filter, setFilter] = useState("All");

  const filteredAchievements = filter === "All" 
    ? achievements 
    : achievements.filter(a => a.category === filter);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-light text-foreground tracking-wide">Achievements</h1>
        <p className="text-sm text-muted-foreground mt-1">Milestones worth remembering</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-3xl font-semibold text-foreground">{achievements.length}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Total</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-3xl font-semibold text-foreground">
            {achievements.filter(a => a.date.includes("2024")).length}
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">This Year</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-3xl font-semibold text-vyom-accent">3</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">This Month</p>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              filter === category
                ? "bg-vyom-accent text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="bg-card border border-border rounded-lg p-6">
        {filteredAchievements.map((achievement, i) => (
          <AchievementItem key={i} {...achievement} />
        ))}
      </div>

      {/* Add Achievement */}
      <Button variant="vyom" className="w-full">
        + Add Achievement
      </Button>
    </div>
  );
};

export default Achievements;
