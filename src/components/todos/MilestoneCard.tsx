import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import chronyxLogo from "@/assets/chronyx-circular-logo.png";
import { format, startOfYear, endOfYear } from "date-fns";
import { 
  Download, Share2, X, Trophy, Flame, Star,
  CheckCircle2, Award
} from "lucide-react";
import { BADGE_ICONS, BADGE_CATEGORIES, BADGE_DEFINITIONS } from "./badgeDefinitions";
import { toast } from "sonner";

interface MilestoneCardProps {
  badges: Array<{
    id: string;
    badge_date: string;
    badge_type: string;
    badge_name: string;
    badge_icon: string;
    description: string;
    points: number;
  }>;
  totalTasks: number;
  streak: number;
  onClose: () => void;
}

const MilestoneCard = ({ badges, totalTasks, streak, onClose }: MilestoneCardProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const currentYear = new Date().getFullYear();
  const yearStart = startOfYear(new Date());
  const yearEnd = endOfYear(new Date());
  
  // Calculate year stats
  const yearBadges = badges.filter(b => {
    const badgeDate = new Date(b.badge_date);
    return badgeDate >= yearStart && badgeDate <= yearEnd;
  });
  
  const totalPoints = yearBadges.reduce((sum, b) => sum + (b.points || 10), 0);
  
  // Group by category
  const badgesByCategory = yearBadges.reduce((acc, badge) => {
    const def = BADGE_DEFINITIONS.find(d => d.type === badge.badge_type);
    const category = def?.category || "daily";
    if (!acc[category]) acc[category] = [];
    acc[category].push(badge);
    return acc;
  }, {} as Record<string, typeof yearBadges>);
  
  // Top badges (highest points)
  const topBadges = [...yearBadges]
    .sort((a, b) => b.points - a.points)
    .slice(0, 6);
  
  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    setIsDownloading(true);
    try {
      // Dynamic import to avoid build issues
      const html2canvas = (await import("html2canvas")).default;
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      
      const link = document.createElement("a");
      link.download = `CHRONYX-${currentYear}-Milestone.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast.success("Milestone card downloaded!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download card");
    } finally {
      setIsDownloading(false);
    }
  };
  
  const handleShareWhatsApp = () => {
    const text = `🏆 My ${currentYear} CHRONYX Milestone!\n\n` +
      `✅ ${totalTasks} Tasks Completed\n` +
      `🔥 ${streak} Day Streak\n` +
      `🎖️ ${yearBadges.length} Badges Earned\n` +
      `⭐ ${totalPoints} Total Points\n\n` +
      `Track your life with CHRONYX by ORIGINX LABS`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="relative">
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      
      {/* Downloadable Card */}
      <div 
        ref={cardRef}
        className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="milestone-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#milestone-grid)" />
          </svg>
        </div>
        
        {/* Gradient Orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/30 to-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/20 to-purple-500/10 rounded-full blur-3xl" />
        
        {/* Content */}
        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={chronyxLogo} alt="CHRONYX" className="w-10 h-10" />
              <div>
                <h2 className="text-lg font-bold tracking-wider">CHRONYX</h2>
                <p className="text-xs text-white/60 uppercase tracking-widest">by ORIGINX LABS</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-amber-400">{currentYear}</p>
              <p className="text-xs text-white/60 uppercase tracking-wider">Year Review</p>
            </div>
          </div>
          
          {/* Main Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <p className="text-2xl sm:text-3xl font-bold">{totalTasks}</p>
              <p className="text-xs text-white/60 uppercase tracking-wider">Tasks Done</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
              <p className="text-2xl sm:text-3xl font-bold">{streak}</p>
              <p className="text-xs text-white/60 uppercase tracking-wider">Day Streak</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="text-2xl sm:text-3xl font-bold">{yearBadges.length}</p>
              <p className="text-xs text-white/60 uppercase tracking-wider">Badges</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl sm:text-3xl font-bold">{totalPoints}</p>
              <p className="text-xs text-white/60 uppercase tracking-wider">Points</p>
            </div>
          </div>
          
          {/* Top Badges */}
          {topBadges.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white/80 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Top Achievements
              </h3>
              <div className="flex flex-wrap gap-2">
                {topBadges.map((badge) => {
                  const IconComponent = BADGE_ICONS[badge.badge_icon] || Award;
                  
                  return (
                    <div 
                      key={badge.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30"
                    >
                      <IconComponent className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium">{badge.badge_name}</span>
                      <span className="text-xs text-amber-400">+{badge.points}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Category Breakdown */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-4 border-t border-white/10">
            {Object.entries(BADGE_CATEGORIES).map(([key, info]) => {
              const count = badgesByCategory[key]?.length || 0;
              return (
                <div key={key} className="text-center p-2 rounded-lg bg-white/5">
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-[10px] text-white/60 uppercase">{info.label}</p>
                </div>
              );
            })}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <p className="text-xs text-white/40">
              Generated on {format(new Date(), "MMMM d, yyyy")}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">chronyx.originxlabs.com</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="p-4 bg-background border-t flex gap-3 justify-center">
        <Button 
          variant="outline" 
          onClick={handleShareWhatsApp}
          className="gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share to WhatsApp
        </Button>
        <Button 
          onClick={handleDownload}
          disabled={isDownloading}
          className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
        >
          <Download className="w-4 h-4" />
          {isDownloading ? "Generating..." : "Download Card"}
        </Button>
      </div>
    </div>
  );
};

export default MilestoneCard;