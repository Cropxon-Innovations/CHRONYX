import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Droplet, 
  Scale, 
  Ruler, 
  User, 
  AlertCircle,
  Info
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BioData {
  blood_group: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  bio_updated_at: string | null;
}

const BLOOD_GROUP_COLORS: Record<string, string> = {
  "A+": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "A-": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "B+": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "B-": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "AB+": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "AB-": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "O+": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "O-": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export const BioCard = () => {
  const { user } = useAuth();
  const [bioData, setBioData] = useState<BioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchBioData();
  }, [user]);

  const fetchBioData = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("blood_group, weight_kg, height_cm, bio_updated_at")
      .eq("id", user?.id)
      .maybeSingle();

    if (!error && data) {
      setBioData(data as BioData);
    }
    setLoading(false);
  };

  // Calculate BMI
  const calculateBMI = () => {
    if (!bioData?.weight_kg || !bioData?.height_cm) return null;
    const heightM = bioData.height_cm / 100;
    const bmi = bioData.weight_kg / (heightM * heightM);
    return bmi.toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Underweight", color: "text-yellow-600" };
    if (bmi < 25) return { label: "Normal", color: "text-emerald-600" };
    if (bmi < 30) return { label: "Overweight", color: "text-orange-600" };
    return { label: "Obese", color: "text-red-600" };
  };

  const hasBioData = bioData?.blood_group || bioData?.weight_kg || bioData?.height_cm;

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasBioData) {
    return (
      <Link to="/app/settings" className="block">
        <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                <User className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Add Health Profile</p>
                <p className="text-xs text-muted-foreground">Blood group, weight, height</p>
              </div>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  const bmi = calculateBMI();
  const bmiCategory = bmi ? getBMICategory(parseFloat(bmi)) : null;

  return (
    <TooltipProvider>
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Blood Group */}
            {bioData.blood_group && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-1 cursor-help">
                    <div className={cn(
                      "p-2 rounded-lg flex items-center gap-1.5",
                      BLOOD_GROUP_COLORS[bioData.blood_group] || "bg-muted text-muted-foreground"
                    )}>
                      <Droplet className="h-4 w-4" />
                      <span className="text-sm font-bold">{bioData.blood_group}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Blood</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Updated: {bioData.bio_updated_at 
                      ? format(new Date(bioData.bio_updated_at), "MMM d, yyyy")
                      : "Not set"}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Weight */}
            {bioData.weight_kg && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-1 cursor-help">
                    <div className="p-2 rounded-lg bg-muted flex items-center gap-1.5">
                      <Scale className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">{bioData.weight_kg} kg</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Weight</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Updated: {bioData.bio_updated_at 
                      ? format(new Date(bioData.bio_updated_at), "MMM d, yyyy")
                      : "Not set"}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Height */}
            {bioData.height_cm && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-1 cursor-help">
                    <div className="p-2 rounded-lg bg-muted flex items-center gap-1.5">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">{bioData.height_cm} cm</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Height</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Updated: {bioData.bio_updated_at 
                      ? format(new Date(bioData.bio_updated_at), "MMM d, yyyy")
                      : "Not set"}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* BMI */}
            {bmi && bmiCategory && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-1 cursor-help ml-auto">
                    <Badge variant="outline" className={cn("text-xs", bmiCategory.color)}>
                      BMI: {bmi}
                    </Badge>
                    <span className={cn("text-[10px]", bmiCategory.color)}>{bmiCategory.label}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <div className="text-xs space-y-1">
                    <p>Body Mass Index</p>
                    <p className="text-muted-foreground">
                      Based on {bioData.weight_kg}kg / {bioData.height_cm}cm
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Edit link */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link 
                  to="/app/settings" 
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                >
                  <Info className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="text-xs">Edit in Settings</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};