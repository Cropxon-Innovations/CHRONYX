import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  HardDrive, 
  Cloud, 
  Sparkles, 
  Check,
  CreditCard,
  TrendingUp,
  Crown
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useRazorpay } from "@/hooks/useRazorpay";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface StorageWidgetProps {
  usedBytes: number;
  totalPhotos: number;
  totalVideos: number;
}

const STORAGE_TIERS = [
  { gb: 2.5, label: "Free", price: 0, priceLabel: "Included" },
  { gb: 10, label: "Basic", price: 99, priceLabel: "₹99/month" },
  { gb: 50, label: "Pro", price: 299, priceLabel: "₹299/month" },
  { gb: 100, label: "Premium", price: 499, priceLabel: "₹499/month" },
  { gb: 500, label: "Enterprise", price: 1499, priceLabel: "₹1,499/month" },
];

export const StorageWidget = ({
  usedBytes,
  totalPhotos,
  totalVideos,
}: StorageWidgetProps) => {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const { isPremium, isPro } = useSubscription();
  const { initiatePayment, isLoading } = useRazorpay();

  // Calculate storage based on subscription
  const getStorageLimit = () => {
    if (isPremium()) return 100 * 1024 * 1024 * 1024; // 100 GB
    if (isPro()) return 50 * 1024 * 1024 * 1024; // 50 GB
    return 2.5 * 1024 * 1024 * 1024; // 2.5 GB free
  };

  const totalBytes = getStorageLimit();
  const usedGB = usedBytes / (1024 * 1024 * 1024);
  const totalGB = totalBytes / (1024 * 1024 * 1024);
  const percentage = Math.min((usedBytes / totalBytes) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 95;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleUpgrade = async () => {
    if (selectedTier === null) return;
    
    const tier = STORAGE_TIERS[selectedTier];
    if (tier.price === 0) {
      setUpgradeOpen(false);
      return;
    }

    try {
      await initiatePayment(tier.gb >= 50 ? 'premium' : 'pro');
      setUpgradeOpen(false);
      toast({ title: "Payment successful!", description: `Your storage has been upgraded to ${tier.gb} GB` });
    } catch {
      toast({ title: "Payment failed", variant: "destructive" });
    }
  };

  return (
    <>
      <Card className={cn(
        "transition-all",
        isAtLimit && "border-destructive bg-destructive/5",
        isNearLimit && !isAtLimit && "border-amber-500 bg-amber-500/5"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-2 rounded-lg",
                isAtLimit ? "bg-destructive/10" : isNearLimit ? "bg-amber-500/10" : "bg-primary/10"
              )}>
                <Cloud className={cn(
                  "w-4 h-4",
                  isAtLimit ? "text-destructive" : isNearLimit ? "text-amber-500" : "text-primary"
                )} />
              </div>
              <div>
                <p className="text-sm font-medium">Storage</p>
                <p className="text-xs text-muted-foreground">
                  {isPremium() ? "Premium" : isPro() ? "Pro" : "Free"} Plan
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setUpgradeOpen(true)}>
              <TrendingUp className="w-3 h-3 mr-1" />
              Upgrade
            </Button>
          </div>

          <Progress 
            value={percentage} 
            className={cn(
              "h-2 mb-2",
              isAtLimit && "[&>div]:bg-destructive",
              isNearLimit && !isAtLimit && "[&>div]:bg-amber-500"
            )} 
          />

          <div className="flex items-center justify-between text-xs">
            <span className={cn(
              isAtLimit ? "text-destructive font-medium" : "text-muted-foreground"
            )}>
              {formatSize(usedBytes)} of {totalGB} GB used
            </span>
            <span className="text-muted-foreground">
              {percentage.toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              {totalPhotos} photos
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              {totalVideos} videos
            </div>
          </div>

          {isNearLimit && (
            <div className={cn(
              "mt-3 p-2 rounded-lg text-xs flex items-center gap-2",
              isAtLimit ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            )}>
              <HardDrive className="w-3 h-3 flex-shrink-0" />
              {isAtLimit 
                ? "Storage full! Upgrade to continue uploading." 
                : "Running low on storage. Consider upgrading."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Upgrade Storage
            </DialogTitle>
            <DialogDescription>
              Choose a plan that fits your needs. Store more memories securely.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            {STORAGE_TIERS.map((tier, index) => (
              <button
                key={tier.gb}
                onClick={() => setSelectedTier(index)}
                className={cn(
                  "p-3 rounded-lg border text-left transition-all flex items-center justify-between",
                  selectedTier === index 
                    ? "border-primary bg-primary/5 ring-1 ring-primary" 
                    : "border-border hover:border-primary/50 hover:bg-accent/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    index === 0 && "bg-muted",
                    index === 1 && "bg-blue-500/10",
                    index === 2 && "bg-purple-500/10",
                    index === 3 && "bg-amber-500/10",
                    index === 4 && "bg-primary/10"
                  )}>
                    {index >= 3 ? (
                      <Crown className={cn(
                        "w-4 h-4",
                        index === 3 ? "text-amber-500" : "text-primary"
                      )} />
                    ) : (
                      <HardDrive className={cn(
                        "w-4 h-4",
                        index === 0 ? "text-muted-foreground" : index === 1 ? "text-blue-500" : "text-purple-500"
                      )} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm flex items-center gap-2">
                      {tier.gb} GB
                      {index === 0 && (
                        <Badge variant="secondary" className="text-[10px]">Current</Badge>
                      )}
                      {index === 3 && (
                        <Badge className="text-[10px] bg-amber-500">Popular</Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{tier.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{tier.priceLabel}</span>
                  {selectedTier === index && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="text-xs text-muted-foreground p-3 bg-accent/30 rounded-lg">
            <p className="font-medium mb-1">All plans include:</p>
            <ul className="space-y-0.5">
              <li>• End-to-end encryption for locked folders</li>
              <li>• EXIF metadata extraction</li>
              <li>• Photo & video organization</li>
              <li>• Download & share options</li>
            </ul>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpgrade}
              disabled={selectedTier === null || selectedTier === 0 || isLoading}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isLoading ? "Processing..." : "Upgrade Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
