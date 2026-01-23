import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Droplet, Scale, Ruler, Save, Loader2, Heart } from "lucide-react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

interface BioSettingsProps {
  onSave?: () => void;
}

export const BioSettings = ({ onSave }: BioSettingsProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [bloodGroup, setBloodGroup] = useState<string>("");
  const [weightKg, setWeightKg] = useState<string>("");
  const [heightCm, setHeightCm] = useState<string>("");

  useEffect(() => {
    if (user) fetchBioData();
  }, [user]);

  const fetchBioData = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("blood_group, weight_kg, height_cm")
      .eq("id", user?.id)
      .maybeSingle();

    if (!error && data) {
      setBloodGroup(data.blood_group || "");
      setWeightKg(data.weight_kg?.toString() || "");
      setHeightCm(data.height_cm?.toString() || "");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        blood_group: bloodGroup || null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        height_cm: heightCm ? parseFloat(heightCm) : null,
        bio_updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      toast.error("Failed to save bio information");
    } else {
      toast.success("Health profile updated");
      onSave?.();
    }
  };

  // Calculate BMI for preview
  const calculateBMI = () => {
    const weight = parseFloat(weightKg);
    const height = parseFloat(heightCm);
    if (!weight || !height) return null;
    const heightM = height / 100;
    return (weight / (heightM * heightM)).toFixed(1);
  };

  const bmi = calculateBMI();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Health Profile
        </CardTitle>
        <CardDescription>
          Add your health information for quick reference on your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Blood Group */}
          <div className="space-y-2">
            <Label htmlFor="blood-group" className="flex items-center gap-2">
              <Droplet className="h-4 w-4 text-red-500" />
              Blood Group
            </Label>
            <Select value={bloodGroup} onValueChange={setBloodGroup}>
              <SelectTrigger id="blood-group">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {BLOOD_GROUPS.map((bg) => (
                  <SelectItem key={bg} value={bg}>
                    {bg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <Label htmlFor="weight" className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-blue-500" />
              Weight (kg)
            </Label>
            <Input
              id="weight"
              type="number"
              min="20"
              max="300"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="e.g., 70"
            />
          </div>

          {/* Height */}
          <div className="space-y-2">
            <Label htmlFor="height" className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-emerald-500" />
              Height (cm)
            </Label>
            <Input
              id="height"
              type="number"
              min="50"
              max="250"
              step="0.5"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="e.g., 170"
            />
          </div>
        </div>

        {/* BMI Preview */}
        {bmi && (
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Calculated BMI</span>
              <span className="text-lg font-semibold text-foreground">{bmi}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {parseFloat(bmi) < 18.5 && "Underweight (under 18.5)"}
              {parseFloat(bmi) >= 18.5 && parseFloat(bmi) < 25 && "Normal weight (18.5-24.9)"}
              {parseFloat(bmi) >= 25 && parseFloat(bmi) < 30 && "Overweight (25-29.9)"}
              {parseFloat(bmi) >= 30 && "Obese (30 or above)"}
            </p>
          </div>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Health Profile
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};