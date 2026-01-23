import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Target, 
  Plus, 
  TrendingUp, 
  Wallet, 
  Home, 
  Car, 
  GraduationCap, 
  Plane, 
  Shield, 
  PiggyBank,
  Trash2,
  Edit2,
  CheckCircle2,
  Calendar,
  DollarSign,
  BarChart3,
  Loader2,
  Sparkles,
  Flag,
  Clock,
  PartyPopper
} from "lucide-react";
import { format, differenceInDays, addMonths } from "date-fns";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface FinancialGoal {
  id: string;
  title: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  currency: string;
  category: string;
  target_date: string | null;
  priority: string;
  status: string;
  color: string | null;
  icon: string | null;
  created_at: string;
}

interface GoalMilestone {
  id: string;
  goal_id: string;
  title: string;
  target_percentage: number;
  achieved_at: string | null;
}

const CATEGORY_CONFIG: Record<string, { icon: typeof Target; color: string; label: string }> = {
  savings: { icon: PiggyBank, color: "text-emerald-500", label: "Savings" },
  investment: { icon: TrendingUp, color: "text-blue-500", label: "Investment" },
  debt_payoff: { icon: Wallet, color: "text-orange-500", label: "Debt Payoff" },
  emergency_fund: { icon: Shield, color: "text-purple-500", label: "Emergency Fund" },
  retirement: { icon: Clock, color: "text-amber-500", label: "Retirement" },
  education: { icon: GraduationCap, color: "text-indigo-500", label: "Education" },
  home: { icon: Home, color: "text-rose-500", label: "Home" },
  vehicle: { icon: Car, color: "text-cyan-500", label: "Vehicle" },
  vacation: { icon: Plane, color: "text-pink-500", label: "Vacation" },
  other: { icon: Target, color: "text-gray-500", label: "Other" },
};

const DEFAULT_MILESTONES = [
  { title: "Getting Started", percentage: 10 },
  { title: "Quarter Way", percentage: 25 },
  { title: "Halfway There!", percentage: 50 },
  { title: "Almost There", percentage: 75 },
  { title: "Goal Achieved!", percentage: 100 },
];

export const FinancialGoalsTracker = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [showContributeDialog, setShowContributeDialog] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [category, setCategory] = useState("savings");
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [contributionAmount, setContributionAmount] = useState("");

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["financial-goals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_goals")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as FinancialGoal[];
    },
    enabled: !!user?.id,
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ["goal-milestones", user?.id],
    queryFn: async () => {
      const goalIds = goals.map(g => g.id);
      if (goalIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("goal_milestones")
        .select("*")
        .in("goal_id", goalIds);
      
      if (error) throw error;
      return data as GoalMilestone[];
    },
    enabled: goals.length > 0,
  });

  const createGoalMutation = useMutation({
    mutationFn: async (goalData: Omit<FinancialGoal, 'id' | 'created_at' | 'currency' | 'color' | 'icon' | 'status'>) => {
      const { data: goal, error } = await supabase
        .from("financial_goals")
        .insert({
          user_id: user?.id!,
          title: goalData.title,
          description: goalData.description,
          target_amount: goalData.target_amount,
          current_amount: goalData.current_amount,
          category: goalData.category,
          target_date: goalData.target_date,
          priority: goalData.priority,
          status: "active", // Default status for new goals
        })
        .select()
        .single();

      if (error) throw error;

      // Create default milestones
      const milestonesToCreate = DEFAULT_MILESTONES.map(m => ({
        goal_id: goal.id,
        title: m.title,
        target_percentage: m.percentage,
      }));

      await supabase.from("goal_milestones").insert(milestonesToCreate);

      return goal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal-milestones"] });
      toast.success("Goal created successfully!");
      resetForm();
      setShowAddDialog(false);
    },
    onError: (error) => {
      toast.error("Failed to create goal");
      console.error(error);
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FinancialGoal> & { id: string }) => {
      const { error } = await supabase
        .from("financial_goals")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-goals"] });
      toast.success("Goal updated!");
      setEditingGoal(null);
      resetForm();
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("financial_goals")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-goals"] });
      toast.success("Goal deleted");
    },
  });

  const contributeToGoalMutation = useMutation({
    mutationFn: async ({ goalId, amount }: { goalId: string; amount: number }) => {
      // Add contribution record
      await supabase.from("goal_contributions").insert({
        goal_id: goalId,
        amount,
        source: "manual",
      });

      // Update goal current amount
      const goal = goals.find(g => g.id === goalId);
      if (!goal) throw new Error("Goal not found");

      const oldProgress = (goal.current_amount / goal.target_amount) * 100;
      const newAmount = goal.current_amount + amount;
      const newProgress = (newAmount / goal.target_amount) * 100;
      const isComplete = newAmount >= goal.target_amount;

      await supabase
        .from("financial_goals")
        .update({
          current_amount: newAmount,
          status: isComplete ? "completed" : "active",
          completed_at: isComplete ? new Date().toISOString() : null,
        })
        .eq("id", goalId);

      // Check and update milestones
      const goalMilestones = milestones.filter(m => m.goal_id === goalId && !m.achieved_at);

      for (const milestone of goalMilestones) {
        if (newProgress >= milestone.target_percentage) {
          await supabase
            .from("goal_milestones")
            .update({ achieved_at: new Date().toISOString() })
            .eq("id", milestone.id);
        }
      }

      // Return milestone info for celebration
      return { oldProgress, newProgress, goalTitle: goal.title };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["financial-goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal-milestones"] });
      
      const { oldProgress, newProgress, goalTitle } = data;
      
      // Trigger confetti for milestone achievements
      const milestonesHit = [25, 50, 75, 100].filter(
        m => oldProgress < m && newProgress >= m
      );
      
      if (milestonesHit.length > 0) {
        const highestMilestone = Math.max(...milestonesHit);
        
        // Celebration confetti
        const duration = highestMilestone === 100 ? 4000 : 2000;
        const particleCount = highestMilestone === 100 ? 200 : 100;
        
        const colors = highestMilestone === 100 
          ? ['#FFD700', '#FFA500', '#FF6347', '#32CD32', '#00CED1']
          : ['#22c55e', '#3b82f6', '#8b5cf6'];

        confetti({
          particleCount,
          spread: 70,
          origin: { y: 0.6 },
          colors,
        });

        if (highestMilestone === 100) {
          // Extra celebration for completion
          setTimeout(() => {
            confetti({
              particleCount: 50,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors,
            });
          }, 250);
          setTimeout(() => {
            confetti({
              particleCount: 50,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors,
            });
          }, 400);
          
          toast.success(`🎉 Congratulations! You've completed "${goalTitle}"!`, {
            duration: 5000,
          });
        } else {
          toast.success(`🎯 ${highestMilestone}% milestone reached for "${goalTitle}"!`, {
            duration: 3000,
          });
        }
      } else {
        toast.success("Contribution added!");
      }
      
      setShowContributeDialog(null);
      setContributionAmount("");
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTargetAmount("");
    setCurrentAmount("");
    setCategory("savings");
    setTargetDate("");
    setPriority("medium");
  };

  const handleSubmit = () => {
    if (!title || !targetAmount) {
      toast.error("Please fill in required fields");
      return;
    }

    const goalData = {
      title,
      description: description || null,
      target_amount: parseFloat(targetAmount),
      current_amount: parseFloat(currentAmount) || 0,
      category,
      target_date: targetDate || null,
      priority,
    };

    if (editingGoal) {
      updateGoalMutation.mutate({ id: editingGoal.id, ...goalData });
    } else {
      createGoalMutation.mutate(goalData);
    }
  };

  const openEditDialog = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || "");
    setTargetAmount(goal.target_amount.toString());
    setCurrentAmount(goal.current_amount.toString());
    setCategory(goal.category);
    setTargetDate(goal.target_date || "");
    setPriority(goal.priority);
    setShowAddDialog(true);
  };

  // Summary calculations
  const activeGoals = goals.filter(g => g.status === "active");
  const completedGoals = goals.filter(g => g.status === "completed");
  const totalTargetAmount = activeGoals.reduce((sum, g) => sum + g.target_amount, 0);
  const totalCurrentAmount = activeGoals.reduce((sum, g) => sum + g.current_amount, 0);
  const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Goals</p>
                <p className="text-2xl font-light">{activeGoals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-light">{completedGoals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target Total</p>
                <p className="text-2xl font-light">₹{(totalTargetAmount / 100000).toFixed(1)}L</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-amber-500/5 to-amber-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overall Progress</p>
                <p className="text-2xl font-light">{overallProgress.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Financial Goals
            </CardTitle>
            <CardDescription>Track your progress towards financial freedom</CardDescription>
          </div>
          <Dialog open={showAddDialog} onOpenChange={(open) => {
            setShowAddDialog(open);
            if (!open) {
              setEditingGoal(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingGoal ? "Edit Goal" : "Create New Goal"}</DialogTitle>
                <DialogDescription>
                  Set a financial goal and track your progress
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Goal Title *</Label>
                  <Input
                    placeholder="e.g., Emergency Fund"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Why is this goal important?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Target Amount (₹) *</Label>
                    <Input
                      type="number"
                      placeholder="500000"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Saved (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <span className="flex items-center gap-2">
                              <config.icon className={cn("w-4 h-4", config.color)} />
                              {config.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Target Date</Label>
                  <Input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={createGoalMutation.isPending || updateGoalMutation.isPending}>
                  {(createGoalMutation.isPending || updateGoalMutation.isPending) && (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  )}
                  {editingGoal ? "Save Changes" : "Create Goal"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No financial goals yet</p>
              <p className="text-sm text-muted-foreground/70">
                Start by creating your first savings or investment goal
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {goals.map((goal, index) => {
                const config = CATEGORY_CONFIG[goal.category] || CATEGORY_CONFIG.other;
                const Icon = config.icon;
                const progress = goal.target_amount > 0 
                  ? (goal.current_amount / goal.target_amount) * 100 
                  : 0;
                const daysRemaining = goal.target_date 
                  ? differenceInDays(new Date(goal.target_date), new Date()) 
                  : null;
                const goalMilestones = milestones.filter(m => m.goal_id === goal.id);
                const achievedMilestones = goalMilestones.filter(m => m.achieved_at).length;

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "p-4 rounded-xl border transition-all hover:shadow-md",
                      goal.status === "completed"
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-muted/20 border-border/50 hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                        goal.status === "completed" 
                          ? "bg-emerald-500/20" 
                          : "bg-muted"
                      )}>
                        {goal.status === "completed" ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <Icon className={cn("w-6 h-6", config.color)} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground truncate">{goal.title}</h3>
                          <Badge variant="secondary" className="text-[10px]">
                            {config.label}
                          </Badge>
                          {goal.priority === "high" && (
                            <Badge className="text-[10px] bg-red-500/20 text-red-600 border-0">
                              <Flag className="w-3 h-3 mr-1" />
                              High
                            </Badge>
                          )}
                        </div>

                        {goal.description && (
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                            {goal.description}
                          </p>
                        )}

                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">
                              ₹{goal.current_amount.toLocaleString("en-IN")} of ₹{goal.target_amount.toLocaleString("en-IN")}
                            </span>
                            <span className="font-medium">{progress.toFixed(0)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {daysRemaining !== null && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {daysRemaining > 0 ? `${daysRemaining} days left` : "Overdue"}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {achievedMilestones}/{goalMilestones.length} milestones
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {goal.status !== "completed" && (
                          <Dialog open={showContributeDialog === goal.id} onOpenChange={(open) => 
                            setShowContributeDialog(open ? goal.id : null)
                          }>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-primary">
                                <Plus className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm">
                              <DialogHeader>
                                <DialogTitle>Add Contribution</DialogTitle>
                                <DialogDescription>
                                  Add money towards "{goal.title}"
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-4">
                                <Label>Amount (₹)</Label>
                                <Input
                                  type="number"
                                  placeholder="10000"
                                  value={contributionAmount}
                                  onChange={(e) => setContributionAmount(e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setShowContributeDialog(null)}>
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => contributeToGoalMutation.mutate({
                                    goalId: goal.id,
                                    amount: parseFloat(contributionAmount) || 0,
                                  })}
                                  disabled={!contributionAmount || contributeToGoalMutation.isPending}
                                >
                                  Add Contribution
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(goal)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteGoalMutation.mutate(goal.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialGoalsTracker;
