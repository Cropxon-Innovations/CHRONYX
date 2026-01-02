import MetricCard from "@/components/dashboard/MetricCard";
import LifespanBar from "@/components/dashboard/LifespanBar";
import TrendChart from "@/components/dashboard/TrendChart";
import Heatmap from "@/components/dashboard/Heatmap";
import ActivityItem from "@/components/dashboard/ActivityItem";
import AchievementItem from "@/components/dashboard/AchievementItem";

// Sample data
const studyTrend = [
  { name: "Mon", value: 45 },
  { name: "Tue", value: 60 },
  { name: "Wed", value: 35 },
  { name: "Thu", value: 90 },
  { name: "Fri", value: 75 },
  { name: "Sat", value: 120 },
  { name: "Sun", value: 80 },
];

const loanTrend = [
  { name: "Jan", value: 850000 },
  { name: "Feb", value: 820000 },
  { name: "Mar", value: 790000 },
  { name: "Apr", value: 760000 },
  { name: "May", value: 730000 },
  { name: "Jun", value: 700000 },
];

// Generate sample heatmap data (12 weeks)
const heatmapData = Array.from({ length: 84 }, () => Math.floor(Math.random() * 5));

const recentActivity = [
  { action: "Completed 3 tasks", module: "Todos", timestamp: "2h ago" },
  { action: "Logged 45 min study", module: "Study", timestamp: "4h ago" },
  { action: "Updated insurance doc", module: "Insurance", timestamp: "1d ago" },
  { action: "EMI payment recorded", module: "Loans", timestamp: "2d ago" },
  { action: "Added reflection note", module: "Lifespan", timestamp: "3d ago" },
];

const recentAchievements = [
  { 
    date: "Dec 28, 2024", 
    title: "100 Day Study Streak", 
    description: "Maintained consistent learning for 100 consecutive days",
    category: "Learning"
  },
  { 
    date: "Dec 15, 2024", 
    title: "Loan Milestone", 
    description: "Paid off 25% of home loan principal",
    category: "Finance"
  },
];

const Dashboard = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-light text-foreground tracking-wide">Today</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </header>

      {/* Metric Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard value="78" suffix="%" label="Todo Completion" />
        <MetricCard value="45" suffix="min" label="Study Today" />
        <MetricCard value="Yes" label="EMI Due This Month" />
        <MetricCard value="3" label="Active Policies" />
      </section>

      {/* Days Remaining Highlight */}
      <section className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wider">Days Until 60</p>
            <p className="text-5xl font-semibold text-foreground mt-2">8,412</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">~23 years</p>
          </div>
        </div>
      </section>

      {/* Trends Section */}
      <section>
        <h2 className="text-lg font-light text-foreground mb-4">Trends</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Heatmap title="Productivity" data={heatmapData} />
          <TrendChart title="Study Consistency" data={studyTrend} />
        </div>
        <div className="mt-4">
          <TrendChart title="Loan Principal Reduction" data={loanTrend} color="hsl(150, 30%, 45%)" />
        </div>
      </section>

      {/* Life Section */}
      <section>
        <h2 className="text-lg font-light text-foreground mb-4">Life</h2>
        <LifespanBar daysLived={12410} daysRemaining={9590} />
      </section>

      {/* Bottom Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Achievements */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
            Recent Achievements
          </h3>
          <div className="space-y-0">
            {recentAchievements.map((achievement, i) => (
              <AchievementItem key={i} {...achievement} />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
            Recent Activity
          </h3>
          <div>
            {recentActivity.map((activity, i) => (
              <ActivityItem key={i} {...activity} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
