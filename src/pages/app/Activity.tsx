import { useState } from "react";
import { cn } from "@/lib/utils";
import ActivityItem from "@/components/dashboard/ActivityItem";

const modules = ["All", "Todos", "Study", "Loans", "Insurance", "Lifespan", "Achievements"];

const activityLog = [
  { action: "Completed task: Morning meditation", module: "Todos", timestamp: "Today, 8:30 AM" },
  { action: "Logged 45 minutes study session", module: "Study", timestamp: "Today, 7:00 AM" },
  { action: "Added reflection note", module: "Lifespan", timestamp: "Yesterday, 10:15 PM" },
  { action: "Completed 3 daily tasks", module: "Todos", timestamp: "Yesterday, 6:00 PM" },
  { action: "Updated insurance document", module: "Insurance", timestamp: "Yesterday, 3:30 PM" },
  { action: "Recorded EMI payment", module: "Loans", timestamp: "Dec 28, 4:00 PM" },
  { action: "Added achievement: 100 Day Streak", module: "Achievements", timestamp: "Dec 28, 9:00 AM" },
  { action: "Completed book reading goal", module: "Study", timestamp: "Dec 27, 8:00 PM" },
  { action: "Skipped task: Call parents", module: "Todos", timestamp: "Dec 27, 6:00 PM" },
  { action: "Updated loan details", module: "Loans", timestamp: "Dec 26, 2:00 PM" },
  { action: "Logged 90 minutes programming study", module: "Study", timestamp: "Dec 25, 10:00 AM" },
  { action: "Added new policy document", module: "Insurance", timestamp: "Dec 24, 11:30 AM" },
];

const Activity = () => {
  const [filter, setFilter] = useState("All");

  const filteredActivity = filter === "All"
    ? activityLog
    : activityLog.filter(a => a.module === filter);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-light text-foreground tracking-wide">Activity</h1>
        <p className="text-sm text-muted-foreground mt-1">Your recent actions across all modules</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-3xl font-semibold text-foreground">{activityLog.length}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Total Actions</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-3xl font-semibold text-foreground">
            {activityLog.filter(a => a.timestamp.includes("Today")).length}
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Today</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-3xl font-semibold text-vyom-accent">
            {new Set(activityLog.map(a => a.module)).size}
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Active Modules</p>
        </div>
      </div>

      {/* Module Filters */}
      <div className="flex flex-wrap gap-2">
        {modules.map((module) => (
          <button
            key={module}
            onClick={() => setFilter(module)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              filter === module
                ? "bg-vyom-accent text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {module}
          </button>
        ))}
      </div>

      {/* Activity List */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="divide-y divide-border">
          {filteredActivity.map((activity, i) => (
            <ActivityItem key={i} {...activity} />
          ))}
        </div>
      </div>

      {/* Note */}
      <p className="text-xs text-muted-foreground text-center">
        Activity log is read-only. Actions are recorded automatically.
      </p>
    </div>
  );
};

export default Activity;
