import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { differenceInDays, differenceInYears, differenceInMonths } from "date-fns";

interface LifespanData {
  percentage: number;
  daysLived: number;
  daysRemaining: number;
  yearsLived: number;
  monthsLived: number;
  targetAge: number;
  birthDate: string | null;
}

export const LifespanSpinner = () => {
  const { user } = useAuth();
  const [lifespanData, setLifespanData] = useState<LifespanData | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const fetchLifespanData = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("birth_date, target_age")
      .eq("id", user.id)
      .single();

    if (data?.birth_date) {
      const birthDate = new Date(data.birth_date);
      const today = new Date();
      const targetAge = data.target_age || 60;
      
      const daysLived = differenceInDays(today, birthDate);
      const totalDays = targetAge * 365.25; // Account for leap years
      const daysRemaining = Math.max(0, Math.floor(totalDays - daysLived));
      const percentage = Math.min(100, (daysLived / totalDays) * 100);
      const yearsLived = differenceInYears(today, birthDate);
      const monthsLived = differenceInMonths(today, birthDate);

      setLifespanData({
        percentage,
        daysLived,
        daysRemaining,
        yearsLived,
        monthsLived,
        targetAge,
        birthDate: data.birth_date,
      });
    } else {
      setLifespanData(null);
    }
  }, [user]);

  useEffect(() => {
    fetchLifespanData();
    
    // Subscribe to profile changes for real-time updates
    const channel = supabase
      .channel('lifespan-profile-changes')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles', 
          filter: `id=eq.${user?.id}` 
        },
        () => {
          fetchLifespanData();
        }
      )
      .subscribe();

    // Update every minute for real-time feel
    const interval = setInterval(fetchLifespanData, 60000);
    
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user, fetchLifespanData]);

  if (!lifespanData) {
    return (
      <Link to="/app/settings" className="relative cursor-pointer">
        <motion.div
          className="w-11 h-11 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
        >
          <span className="text-[9px] text-muted-foreground">Set</span>
        </motion.div>
      </Link>
    );
  }

  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (lifespanData.percentage / 100) * circumference;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <motion.div
          className="relative cursor-pointer"
          onHoverStart={() => setIsSpinning(true)}
          onHoverEnd={() => setIsSpinning(false)}
          whileHover={{ scale: 1.1 }}
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 44 44"
            className="transform -rotate-90"
          >
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              strokeWidth="3"
              className="stroke-muted"
            />
            <motion.circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              className="stroke-primary"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
              }}
              animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
              transition={{
                rotate: {
                  duration: 2,
                  repeat: isSpinning ? Infinity : 0,
                  ease: "linear",
                },
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-foreground">
              {lifespanData.percentage.toFixed(0)}%
            </span>
          </div>
        </motion.div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-4" side="bottom" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
              <h4 className="font-semibold text-sm">Life Progress</h4>
            </div>
            <Link 
              to="/app/lifespan" 
              className="text-xs text-primary hover:underline"
            >
              View Details →
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1 bg-muted/50 rounded-lg p-2">
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Age</p>
              <p className="font-semibold text-lg">{lifespanData.yearsLived} <span className="text-xs font-normal">years</span></p>
            </div>
            <div className="space-y-1 bg-muted/50 rounded-lg p-2">
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Target</p>
              <p className="font-semibold text-lg">{lifespanData.targetAge} <span className="text-xs font-normal">years</span></p>
            </div>
            <div className="space-y-1 bg-primary/10 rounded-lg p-2">
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Days Lived</p>
              <p className="font-semibold text-lg text-primary">{lifespanData.daysLived.toLocaleString()}</p>
            </div>
            <div className="space-y-1 bg-amber-500/10 rounded-lg p-2">
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Days Left</p>
              <p className="font-semibold text-lg text-amber-600 dark:text-amber-400">{lifespanData.daysRemaining.toLocaleString()}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="text-muted-foreground">Life completed</span>
              <span className="font-bold text-primary">{lifespanData.percentage.toFixed(2)}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-primary to-primary/60 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${lifespanData.percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground italic text-center pt-1">
            "Make each day count. You have <span className="font-semibold text-foreground">{lifespanData.daysRemaining.toLocaleString()}</span> opportunities left."
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default LifespanSpinner;