import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useActivityLog } from "@/hooks/useActivityLog";
import { EnhancedCalendar } from "@/components/ui/date-picker-enhanced";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, differenceInYears, differenceInMonths, differenceInDays } from "date-fns";
import { CalendarIcon, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataExport } from "@/components/export/DataExport";

interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  birth_date: string | null;
  target_age: number | null;
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLog();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [birthDate, setBirthDate] = useState<Date | undefined>();
  const [targetAge, setTargetAge] = useState(60);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user?.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
    } else if (data) {
      setProfile(data);
      setDisplayName(data.display_name || "");
      setBirthDate(data.birth_date ? new Date(data.birth_date) : undefined);
      setTargetAge(data.target_age || 60);
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName || null,
        birth_date: birthDate ? format(birthDate, "yyyy-MM-dd") : null,
        target_age: targetAge,
      })
      .eq("id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated.",
      });
      logActivity("Updated profile settings", "Settings");
    }
    setSaving(false);
  };

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
        <h1 className="text-2xl font-light text-foreground tracking-wide">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your personal preferences</p>
      </header>

      {/* Profile Section */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Profile
        </h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              value={profile?.email || ""}
              disabled
              className="h-11 bg-muted/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-xs uppercase tracking-wider text-muted-foreground">
              Display Name
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="h-11 bg-background"
            />
          </div>
        </div>
      </section>

      {/* Lifespan Configuration */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Lifespan Settings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Birth Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-11 justify-start text-left font-normal",
                    !birthDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {birthDate ? format(birthDate, "PPP") : "Select your birth date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <EnhancedCalendar
                  mode="single"
                  selected={birthDate}
                  onSelect={setBirthDate}
                  disabled={(date) => date > new Date()}
                  fromYear={1920}
                  toYear={new Date().getFullYear()}
                />
              </PopoverContent>
            </Popover>
            
            {/* Exact Age Display */}
            {birthDate && (
              <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border">
                <p className="text-xs text-muted-foreground mb-2">Your Exact Age</p>
                <div className="flex items-center gap-4">
                  {(() => {
                    const now = new Date();
                    const years = differenceInYears(now, birthDate);
                    const monthsAfterYears = differenceInMonths(now, birthDate) % 12;
                    const lastBirthday = new Date(
                      now.getFullYear(),
                      birthDate.getMonth(),
                      birthDate.getDate()
                    );
                    if (lastBirthday > now) {
                      lastBirthday.setFullYear(lastBirthday.getFullYear() - 1);
                    }
                    const nextMonthDate = new Date(lastBirthday);
                    nextMonthDate.setMonth(lastBirthday.getMonth() + monthsAfterYears);
                    const days = differenceInDays(now, nextMonthDate);
                    
                    return (
                      <>
                        <div className="text-center">
                          <p className="text-2xl font-light text-foreground">{years}</p>
                          <p className="text-xs text-muted-foreground">Years</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-light text-foreground">{monthsAfterYears}</p>
                          <p className="text-xs text-muted-foreground">Months</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-light text-foreground">{Math.abs(days)}</p>
                          <p className="text-xs text-muted-foreground">Days</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAge" className="text-xs uppercase tracking-wider text-muted-foreground">
              Target Age (for lifespan calculations)
            </Label>
            <Input
              id="targetAge"
              type="number"
              value={targetAge}
              onChange={(e) => setTargetAge(parseInt(e.target.value) || 60)}
              min={1}
              max={120}
              className="h-11 bg-background"
            />
          </div>
        </div>
      </section>

      {/* Data Export Section */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Data Export
        </h2>
        <p className="text-sm text-muted-foreground">
          Download all your data including todos, study logs, achievements, and activity history.
        </p>
        <DataExport />
      </section>

      {/* Save Button */}
      <Button
        onClick={saveSettings}
        disabled={saving}
        className="w-full sm:w-auto"
      >
        <Save className="w-4 h-4 mr-2" />
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
};

export default Settings;
