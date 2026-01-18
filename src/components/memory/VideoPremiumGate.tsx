import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Video, Crown, Sparkles, Check, Lock, Zap, Cloud, Shield } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useRazorpay } from "@/hooks/useRazorpay";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface VideoPremiumGateProps {
  open: boolean;
  onClose: () => void;
  onUpgradeSuccess?: () => void;
}

export const VideoPremiumGate = ({ open, onClose, onUpgradeSuccess }: VideoPremiumGateProps) => {
  const { initiatePayment, isLoading } = useRazorpay();
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "premium">("premium");

  const handleUpgrade = async () => {
    try {
      await initiatePayment(selectedPlan);
      toast({ 
        title: "🎉 Welcome to Premium!", 
        description: "You can now upload videos and enjoy all premium features." 
      });
      onUpgradeSuccess?.();
      onClose();
    } catch {
      toast({ title: "Payment failed", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <Video className="w-6 h-6 text-purple-500" />
            </div>
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
              Premium Feature
            </Badge>
          </div>
          <DialogTitle className="text-xl">Unlock Video Uploads</DialogTitle>
          <DialogDescription>
            Video storage requires a Premium subscription. Upgrade now to preserve your precious video memories.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {/* Feature highlights */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Video, label: "Video uploads", desc: "Up to 4K quality" },
              { icon: Cloud, label: "100 GB storage", desc: "Secure cloud" },
              { icon: Shield, label: "Encrypted", desc: "End-to-end" },
              { icon: Zap, label: "Fast uploads", desc: "Optimized" },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-accent/30">
                <feature.icon className="w-4 h-4 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{feature.label}</p>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Plan selection */}
          <div className="space-y-2">
            <button
              onClick={() => setSelectedPlan("pro")}
              className={cn(
                "w-full p-4 rounded-lg border text-left transition-all flex items-center justify-between",
                selectedPlan === "pro"
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Pro Plan</p>
                  <p className="text-sm text-muted-foreground">50 GB storage, video uploads</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">₹299<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                {selectedPlan === "pro" && <Check className="w-4 h-4 text-primary ml-auto" />}
              </div>
            </button>

            <button
              onClick={() => setSelectedPlan("premium")}
              className={cn(
                "w-full p-4 rounded-lg border text-left transition-all flex items-center justify-between relative overflow-hidden",
                selectedPlan === "premium"
                  ? "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500"
                  : "border-border hover:border-amber-500/50"
              )}
            >
              <Badge className="absolute top-2 right-2 bg-amber-500 text-white border-0 text-[10px]">
                Best Value
              </Badge>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium">Premium Plan</p>
                  <p className="text-sm text-muted-foreground">100 GB storage, all features</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">₹499<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                {selectedPlan === "premium" && <Check className="w-4 h-4 text-amber-500 ml-auto" />}
              </div>
            </button>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Maybe Later
          </Button>
          <Button 
            onClick={handleUpgrade} 
            disabled={isLoading}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Crown className="w-4 h-4 mr-2" />
            {isLoading ? "Processing..." : "Upgrade Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
