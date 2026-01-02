import { useState, useEffect } from "react";
import LifespanBar from "@/components/dashboard/LifespanBar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

const Lifespan = () => {
  const [reflection, setReflection] = useState("");
  const { user } = useAuth();
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [targetAge, setTargetAge] = useState(60);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("birth_date, target_age")
      .eq("id", user?.id)
      .maybeSingle();

    if (data) {
      setBirthDate(data.birth_date ? new Date(data.birth_date) : null);
      setTargetAge(data.target_age || 60);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Default to sample data if no birth date configured
  const effectiveBirthDate = birthDate || new Date(1991, 0, 1);
  const today = new Date();
  
  const daysLived = Math.floor((today.getTime() - effectiveBirthDate.getTime()) / (1000 * 60 * 60 * 24));
  const targetDate = new Date(effectiveBirthDate);
  targetDate.setFullYear(effectiveBirthDate.getFullYear() + targetAge);
  const daysRemaining = Math.max(0, Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  
  const yearsLived = Math.floor(daysLived / 365);
  const monthsLived = Math.floor((daysLived % 365) / 30);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-light text-foreground tracking-wide">Lifespan</h1>
        <p className="text-sm text-muted-foreground mt-1">Perspective on time</p>
      </header>

      {/* Configure Prompt */}
      {!birthDate && (
        <div className="bg-vyom-accent-soft border border-vyom-accent/20 rounded-lg p-4">
          <p className="text-sm text-foreground mb-2">
            Configure your birth date in settings for accurate lifespan calculations.
          </p>
          <Link to="/app/settings">
            <Button variant="vyom" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Go to Settings
            </Button>
          </Link>
        </div>
      )}

      {/* Main Visualization */}
      <LifespanBar daysLived={daysLived} daysRemaining={daysRemaining} />

      {/* Time Lived Detail */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
          Time Lived
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-3xl font-semibold text-foreground">{yearsLived}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Years</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-foreground">{yearsLived * 12 + monthsLived}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Months</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-foreground">{Math.floor(daysLived / 7).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Weeks</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-foreground">{daysLived.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Days</p>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
          Life Markers
        </h3>
        <div className="space-y-4">
          {[25, 30, 35, 40, 50, 60].map((age) => {
            const status = yearsLived >= age ? "passed" : "upcoming";
            return (
              <div key={age} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    status === "passed" ? "bg-vyom-success" : "bg-muted"
                  }`} />
                  <span className="text-sm text-foreground">Age {age}</span>
                </div>
                <span className={`text-xs ${
                  status === "passed" ? "text-vyom-success" : "text-muted-foreground"
                }`}>
                  {status === "passed" ? "Reached" : `${age - yearsLived} years away`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reflection */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Reflection
        </h3>
        <Textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="What matters most to you right now?"
          className="min-h-[120px] bg-background resize-none"
        />
        <Button variant="vyom" size="sm" className="mt-4">
          Save Reflection
        </Button>
      </div>
    </div>
  );
};

export default Lifespan;
