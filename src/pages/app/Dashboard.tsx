import { useState, useEffect } from "react";
import MetricCard from "@/components/dashboard/MetricCard";
import LifespanBar from "@/components/dashboard/LifespanBar";
import TrendChart from "@/components/dashboard/TrendChart";
import Heatmap from "@/components/dashboard/Heatmap";
import ActivityItem from "@/components/dashboard/ActivityItem";
import AchievementItem from "@/components/dashboard/AchievementItem";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todosStats, setTodosStats] = useState({ completed: 0, total: 0 });
  const [studyMinutes, setStudyMinutes] = useState(0);
  const [daysUntilTarget, setDaysUntilTarget] = useState(8412);
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [targetAge, setTargetAge] = useState(60);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    const today = new Date().toISOString().split("T")[0];

    // Fetch todos for today
    const { data: todos } = await supabase
      .from("todos")
      .select("status")
      .eq("date", today);

    if (todos) {
      const completed = todos.filter(t => t.status === "done").length;
      setTodosStats({ completed, total: todos.length });
    }

    // Fetch study logs for today
    const { data: studyLogs } = await supabase
      .from("study_logs")
      .select("duration")
      .eq("date", today);

    if (studyLogs) {
      const total = studyLogs.reduce((acc, log) => acc + log.duration, 0);
      setStudyMinutes(total);
    }

    // Fetch profile for lifespan calculations
    const { data: profile } = await supabase
      .from("profiles")
      .select("birth_date, target_age")
      .eq("id", user?.id)
      .maybeSingle();

    if (profile) {
      if (profile.birth_date) {
        setBirthDate(new Date(profile.birth_date));
      }
      setTargetAge(profile.target_age || 60);
    }

    setLoading(false);
  };

  // Calculate lifespan data
  const effectiveBirthDate = birthDate || new Date(1991, 0, 1);
  const today = new Date();
  const daysLived = Math.floor((today.getTime() - effectiveBirthDate.getTime()) / (1000 * 60 * 60 * 24));
  const targetDate = new Date(effectiveBirthDate);
  targetDate.setFullYear(effectiveBirthDate.getFullYear() + targetAge);
  const daysRemaining = Math.max(0, Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  // Sample data for charts (will be replaced with real data)
  const studyTrend = [
    { name: "Mon", value: 45 },
    { name: "Tue", value: 60 },
    { name: "Wed", value: 35 },
    { name: "Thu", value: 90 },
    { name: "Fri", value: 75 },
    { name: "Sat", value: 120 },
    { name: "Sun", value: studyMinutes || 80 },
  ];

  const heatmapData = Array.from({ length: 84 }, () => Math.floor(Math.random() * 5));

  const recentActivity = [
    { action: "Completed 3 tasks", module: "Todos", timestamp: "2h ago" },
    { action: "Logged study session", module: "Study", timestamp: "4h ago" },
  ];

  const recentAchievements = [
    { 
      date: "Dec 28, 2024", 
      title: "First Week Complete", 
      description: "Used VYOM for 7 consecutive days",
      category: "Personal"
    },
  ];

  const completionRate = todosStats.total > 0 
    ? Math.round((todosStats.completed / todosStats.total) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

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
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard value={completionRate} suffix="%" label="Todo Completion" />
        <MetricCard value={studyMinutes} suffix="min" label="Study Today" />
        <MetricCard value="—" label="EMI Due" />
        <MetricCard value="—" label="Active Policies" />
      </section>

      {/* Days Remaining Highlight */}
      <section className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wider">Days Until {targetAge}</p>
            <p className="text-4xl md:text-5xl font-semibold text-foreground mt-2">
              {daysRemaining.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              ~{Math.floor(daysRemaining / 365)} years
            </p>
          </div>
        </div>
      </section>

      {/* Trends Section */}
      <section>
        <h2 className="text-lg font-light text-foreground mb-4">Trends</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Heatmap title="Productivity" data={heatmapData} />
          <TrendChart title="Study This Week" data={studyTrend} />
        </div>
      </section>

      {/* Life Section */}
      <section>
        <h2 className="text-lg font-light text-foreground mb-4">Life</h2>
        <LifespanBar daysLived={daysLived} daysRemaining={daysRemaining} />
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
