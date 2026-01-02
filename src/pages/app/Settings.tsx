import { useState, useEffect } from "react";
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
import { CalendarIcon, Save, Mail, Phone, CheckCircle2, AlertCircle, Shield, Database, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataExport } from "@/components/export/DataExport";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  birth_date: string | null;
  target_age: number | null;
  phone_number: string | null;
  email_verified: boolean | null;
  phone_verified: boolean | null;
  secondary_email: string | null;
  secondary_phone: string | null;
  primary_contact: string | null;
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
  const [phoneNumber, setPhoneNumber] = useState("");
  const [secondaryEmail, setSecondaryEmail] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [primaryContact, setPrimaryContact] = useState("email");
  
  // OTP verification state
  const [verifyDialog, setVerifyDialog] = useState<{
    open: boolean;
    type: "email" | "phone";
    value: string;
  }>({ open: false, type: "email", value: "" });
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

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
      setPhoneNumber(data.phone_number || "");
      setSecondaryEmail(data.secondary_email || "");
      setSecondaryPhone(data.secondary_phone || "");
      setPrimaryContact(data.primary_contact || "email");
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
        phone_number: phoneNumber || null,
        secondary_email: secondaryEmail || null,
        secondary_phone: secondaryPhone || null,
        primary_contact: primaryContact,
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
      fetchProfile(); // Refresh profile data
    }
    setSaving(false);
  };

  const handleVerifyOTP = async () => {
    setIsVerifying(true);
    // Simulate OTP verification
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    if (otp === "123456") {
      const updateField = verifyDialog.type === "email" ? "email_verified" : "phone_verified";
      const { error } = await supabase
        .from("profiles")
        .update({ [updateField]: true })
        .eq("id", user?.id);
      
      if (!error) {
        setProfile((prev) => prev ? { ...prev, [updateField]: true } : null);
        toast({
          title: "Verified",
          description: `${verifyDialog.type === "email" ? "Email" : "Phone"} verified successfully!`,
        });
        setVerifyDialog({ open: false, type: "email", value: "" });
        setOtp("");
        logActivity(`Verified ${verifyDialog.type}`, "Settings");
      }
    } else {
      toast({
        title: "Invalid OTP",
        description: "Try 123456 for demo.",
        variant: "destructive",
      });
    }
    setIsVerifying(false);
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
              Email (Primary - Cannot be changed)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="email"
                value={profile?.email || ""}
                disabled
                className="h-11 bg-muted/50 flex-1"
              />
              {profile?.email_verified ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVerifyDialog({ open: true, type: "email", value: profile?.email || "" })}
                >
                  <AlertCircle className="w-4 h-4 text-amber-500 mr-1" />
                  Verify
                </Button>
              )}
            </div>
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

      {/* Contact Information */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Phone className="w-4 h-4" />
          Contact Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-xs uppercase tracking-wider text-muted-foreground">
              Phone Number
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 9876543210"
                className="h-11 bg-background flex-1"
              />
              {phoneNumber && (
                profile?.phone_verified ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVerifyDialog({ open: true, type: "phone", value: phoneNumber })}
                  >
                    <AlertCircle className="w-4 h-4 text-amber-500 mr-1" />
                    Verify
                  </Button>
                )
              )}
            </div>
          </div>

          {/* Secondary Email */}
          <div className="space-y-2">
            <Label htmlFor="secondaryEmail" className="text-xs uppercase tracking-wider text-muted-foreground">
              Secondary Email
            </Label>
            <Input
              id="secondaryEmail"
              type="email"
              value={secondaryEmail}
              onChange={(e) => setSecondaryEmail(e.target.value)}
              placeholder="backup@example.com"
              className="h-11 bg-background"
            />
          </div>

          {/* Secondary Phone */}
          <div className="space-y-2">
            <Label htmlFor="secondaryPhone" className="text-xs uppercase tracking-wider text-muted-foreground">
              Secondary Phone
            </Label>
            <Input
              id="secondaryPhone"
              value={secondaryPhone}
              onChange={(e) => setSecondaryPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="h-11 bg-background"
            />
          </div>

          {/* Primary Contact Selection */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Shield className="w-3 h-3" />
              Primary Contact Method
            </Label>
            <RadioGroup
              value={primaryContact}
              onValueChange={setPrimaryContact}
              className="flex gap-6 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="primary-email" />
                <Label htmlFor="primary-email" className="cursor-pointer flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="phone" id="primary-phone" />
                <Label htmlFor="primary-phone" className="cursor-pointer flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  Phone
                </Label>
              </div>
            </RadioGroup>
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

      {/* Backup Section */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Database className="w-4 h-4" />
          Backup & Restore
        </h2>
        <p className="text-sm text-muted-foreground">
          Create full backups of your VYOM data or restore from previous backups.
        </p>
        <Button variant="outline" asChild>
          <a href="/app/backup">
            <HardDrive className="w-4 h-4 mr-2" />
            Open Backup Manager
          </a>
        </Button>
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

      {/* OTP Verification Dialog */}
      <Dialog open={verifyDialog.open} onOpenChange={(open) => setVerifyDialog((v) => ({ ...v, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify {verifyDialog.type === "email" ? "Email" : "Phone"}</DialogTitle>
            <DialogDescription>
              Enter the OTP sent to {verifyDialog.value}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
            />
            <p className="text-xs text-muted-foreground">
              Demo: Use OTP <code className="bg-muted px-1 rounded">123456</code>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setVerifyDialog({ open: false, type: "email", value: "" }); setOtp(""); }}>
              Cancel
            </Button>
            <Button onClick={handleVerifyOTP} disabled={otp.length !== 6 || isVerifying}>
              {isVerifying ? "Verifying..." : "Verify"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
