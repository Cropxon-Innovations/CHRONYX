import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Coins,
  Zap,
  Wallet,
  ArrowRight,
  IndianRupee,
  Building2,
  Smartphone,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Gift,
  History,
  Sparkles,
  Eye,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { PLANS, formatPrice } from "@/lib/planConfig";

interface WalletData {
  total_points: number;
  total_coins: number;
  redeemable_balance: number;
  lifetime_points: number;
  lifetime_coins: number;
  lifetime_redeemed: number;
}

interface Transaction {
  id: string;
  transaction_type: string;
  points_amount: number;
  coins_amount: number;
  inr_amount: number;
  reason: string;
  created_at: string;
}

interface RedemptionRequest {
  id: string;
  points_to_redeem: number;
  amount_rupees: number;
  payment_method: string;
  payment_details: Record<string, unknown> | null;
  status: string;
  created_at: string;
}

interface WalletRedemptionProps {
  compact?: boolean;
}

// Conversion rates - IMPORTANT: 100 points = 1 coin = ₹1
const POINTS_PER_COIN = 100;
const RUPEES_PER_COIN = 1;
const MIN_REDEMPTION_COINS = 10; // Minimum ₹10 to redeem

export const WalletRedemption = ({ compact = false }: WalletRedemptionProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "upi">("upi");
  const [coinsToRedeem, setCoinsToRedeem] = useState(MIN_REDEMPTION_COINS);
  const [showPreview, setShowPreview] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    upi_id: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    account_holder: "",
  });

  // Fetch wallet
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      let { data, error } = await supabase
        .from("user_wallet")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (!data && !error) {
        const { data: newWallet, error: createError } = await supabase
          .from("user_wallet")
          .insert({ user_id: user.id })
          .select()
          .single();
        if (createError) throw createError;
        data = newWallet;
      }
      
      if (error) throw error;
      return data as WalletData;
    },
    enabled: !!user,
  });

  // Fetch transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ["wallet-transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });

  // Fetch redemption requests
  const { data: redemptions = [] } = useQuery({
    queryKey: ["redemption-requests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("redemption_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []) as RedemptionRequest[];
    },
    enabled: !!user,
  });

  // Submit redemption request
  const submitRedemption = useMutation({
    mutationFn: async () => {
      if (!user || !wallet) throw new Error("Not authenticated");
      if (coinsToRedeem < MIN_REDEMPTION_COINS) throw new Error(`Minimum ${MIN_REDEMPTION_COINS} coins required`);
      if (coinsToRedeem > wallet.total_coins) throw new Error("Insufficient coins");
      
      // Validate payment details
      if (paymentMethod === "upi" && !paymentDetails.upi_id) {
        throw new Error("Please enter your UPI ID");
      }
      if (paymentMethod === "bank") {
        if (!paymentDetails.bank_name || !paymentDetails.account_number || 
            !paymentDetails.ifsc_code || !paymentDetails.account_holder) {
          throw new Error("Please fill all bank details");
        }
      }
      
      const inrAmount = coinsToRedeem * RUPEES_PER_COIN; // 1 coin = ₹1
      
      // Create redemption request
      const { data: redemption, error: reqError } = await supabase
        .from("redemption_requests")
        .insert({
          user_id: user.id,
          points_to_redeem: coinsToRedeem, // Actually storing coins
          amount_rupees: inrAmount,
          payment_method: paymentMethod,
          payment_details: {
            upi_id: paymentMethod === "upi" ? paymentDetails.upi_id : null,
            bank_name: paymentMethod === "bank" ? paymentDetails.bank_name : null,
            account_number: paymentMethod === "bank" ? paymentDetails.account_number : null,
            ifsc_code: paymentMethod === "bank" ? paymentDetails.ifsc_code : null,
            account_holder: paymentMethod === "bank" ? paymentDetails.account_holder : null,
          },
          status: "pending",
        })
        .select()
        .single();
      
      if (reqError) throw reqError;
      
      // Deduct coins from wallet
      const { error: walletError } = await supabase
        .from("user_wallet")
        .update({
          total_coins: wallet.total_coins - coinsToRedeem,
          redeemable_balance: wallet.redeemable_balance - inrAmount,
        })
        .eq("user_id", user.id);
      
      if (walletError) throw walletError;
      
      // Log transaction
      await supabase
        .from("wallet_transactions")
        .insert({
          user_id: user.id,
          transaction_type: "redeem",
          coins_amount: -coinsToRedeem,
          inr_amount: inrAmount,
          reason: `Redeemed ${coinsToRedeem} coins for ₹${inrAmount} (Pending Approval)`,
        });

      // Send notification emails
      try {
        await supabase.functions.invoke("send-redemption-notification", {
          body: {
            type: "user_request",
            redemptionId: redemption.id,
            userId: user.id,
            userEmail: user.email,
            userName: user.user_metadata?.full_name || user.email?.split("@")[0],
            coinsRedeemed: coinsToRedeem,
            amountInr: inrAmount,
            paymentMethod,
            paymentDetails,
          },
        });
      } catch (emailError) {
        console.error("Failed to send notification:", emailError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["redemption-requests"] });
      setIsRedeemDialogOpen(false);
      setShowPreview(false);
      setCoinsToRedeem(MIN_REDEMPTION_COINS);
      setPaymentDetails({ upi_id: "", bank_name: "", account_number: "", ifsc_code: "", account_holder: "" });
      toast.success("Redemption request submitted! You'll receive payment within 24-72 working hours after admin approval.");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit redemption");
    },
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: { icon: Clock, color: "bg-amber-500/10 text-amber-600 border-amber-500/30", label: "Pending Approval" },
      approved: { icon: CheckCircle, color: "bg-blue-500/10 text-blue-600 border-blue-500/30", label: "Approved" },
      processing: { icon: AlertCircle, color: "bg-blue-500/10 text-blue-600 border-blue-500/30", label: "Processing" },
      completed: { icon: CheckCircle, color: "bg-green-500/10 text-green-600 border-green-500/30", label: "Completed" },
      rejected: { icon: XCircle, color: "bg-red-500/10 text-red-600 border-red-500/30", label: "Rejected" },
      failed: { icon: XCircle, color: "bg-red-500/10 text-red-600 border-red-500/30", label: "Failed" },
    };
    const { icon: Icon, color, label } = styles[status as keyof typeof styles] || styles.pending;
    return (
      <Badge variant="outline" className={cn("gap-1", color)}>
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  const canRedeem = wallet && wallet.total_coins >= MIN_REDEMPTION_COINS;
  const inrAmount = coinsToRedeem * RUPEES_PER_COIN;

  // Get subscription plans with coin costs
  const subscriptionPlans = PLANS.filter(p => p.id !== 'free' && p.id !== 'lifetime').map(plan => ({
    ...plan,
    coinsCost: plan.price.inr.yearly || plan.price.inr.monthly * 12,
  }));

  if (compact) {
    return (
      <div className="p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-amber-500" />
            <span className="font-medium text-sm">Rewards Wallet</span>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setIsRedeemDialogOpen(true)}
            disabled={!canRedeem}
            className="text-xs"
          >
            <Gift className="w-3 h-3 mr-1" />
            Redeem
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-primary/5">
            <p className="text-lg font-bold">{wallet?.total_points || 0}</p>
            <p className="text-[10px] text-muted-foreground">Points</p>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/5">
            <p className="text-lg font-bold text-amber-600">{wallet?.total_coins || 0}</p>
            <p className="text-[10px] text-muted-foreground">Coins</p>
          </div>
          <div className="p-2 rounded-lg bg-green-500/5">
            <p className="text-lg font-bold text-green-600">₹{wallet?.redeemable_balance || 0}</p>
            <p className="text-[10px] text-muted-foreground">Redeemable</p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          100 points = 1 coin = ₹1 • Min ₹{MIN_REDEMPTION_COINS} to redeem
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border bg-gradient-to-r from-amber-500/10 via-primary/5 to-purple-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
              <Wallet className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold">Rewards Wallet</h3>
              <p className="text-xs text-muted-foreground">Earn points, convert to coins, redeem INR</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" disabled={!wallet || wallet.total_coins < 100}>
                  <CreditCard className="w-4 h-4" />
                  Use for Subscription
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Redeem for Subscription</DialogTitle>
                  <DialogDescription>
                    Use your coins to pay for subscription plans
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Your Coins</span>
                      <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-amber-500" />
                        <span className="text-2xl font-bold text-amber-600">{wallet?.total_coins || 0}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">= ₹{wallet?.total_coins || 0} value</p>
                  </div>
                  
                  <div className="space-y-3">
                    {subscriptionPlans.map((plan) => {
                      const canAfford = (wallet?.total_coins || 0) >= plan.coinsCost;
                      return (
                        <div 
                          key={plan.id} 
                          className={cn(
                            "p-4 rounded-xl border transition-all",
                            canAfford ? "border-primary/30 bg-primary/5 cursor-pointer hover:border-primary" : "border-border bg-muted/30 opacity-60"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{plan.name}</h4>
                              <p className="text-xs text-muted-foreground">{plan.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-amber-600">{plan.coinsCost} coins</p>
                              <p className="text-xs text-muted-foreground">= ₹{plan.coinsCost}/year</p>
                            </div>
                          </div>
                          {canAfford && (
                            <Button className="w-full mt-3" size="sm">
                              Redeem {plan.coinsCost} Coins
                            </Button>
                          )}
                          {!canAfford && (
                            <p className="text-xs text-center text-muted-foreground mt-3">
                              Need {plan.coinsCost - (wallet?.total_coins || 0)} more coins
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isRedeemDialogOpen} onOpenChange={setIsRedeemDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                  disabled={!canRedeem}
                >
                  <Gift className="w-4 h-4" />
                  Redeem INR
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Redeem Coins for INR</DialogTitle>
                  <DialogDescription>
                    Convert your coins to real money via UPI or Bank Transfer
                  </DialogDescription>
                </DialogHeader>
                
                {!showPreview ? (
                  <div className="space-y-4 py-4">
                    {/* Balance Display */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Available Coins</span>
                        <div className="flex items-center gap-2">
                          <Coins className="w-5 h-5 text-amber-500" />
                          <span className="text-2xl font-bold text-amber-600">{wallet?.total_coins || 0}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        = ₹{wallet?.total_coins || 0} redeemable (1 coin = ₹1)
                      </p>
                    </div>
                    
                    {/* Coins to Redeem */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Coins to Redeem</label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          min={MIN_REDEMPTION_COINS}
                          max={wallet?.total_coins || 0}
                          value={coinsToRedeem}
                          onChange={(e) => setCoinsToRedeem(Math.min(Number(e.target.value), wallet?.total_coins || 0))}
                          className="flex-1"
                        />
                        <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
                          <IndianRupee className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-green-600">{inrAmount}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        1 coin = ₹1 INR • Minimum {MIN_REDEMPTION_COINS} coins (₹{MIN_REDEMPTION_COINS})
                      </p>
                    </div>
                    
                    {/* Payment Method */}
                    <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "bank" | "upi")}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upi" className="gap-2">
                          <Smartphone className="w-4 h-4" />
                          UPI
                        </TabsTrigger>
                        <TabsTrigger value="bank" className="gap-2">
                          <Building2 className="w-4 h-4" />
                          Bank
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="upi" className="space-y-3 mt-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">UPI ID</label>
                          <Input
                            placeholder="yourname@upi"
                            value={paymentDetails.upi_id}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, upi_id: e.target.value })}
                          />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="bank" className="space-y-3 mt-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Bank Name</label>
                            <Input
                              placeholder="e.g., SBI"
                              value={paymentDetails.bank_name}
                              onChange={(e) => setPaymentDetails({ ...paymentDetails, bank_name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">IFSC Code</label>
                            <Input
                              placeholder="e.g., SBIN0001234"
                              value={paymentDetails.ifsc_code}
                              onChange={(e) => setPaymentDetails({ ...paymentDetails, ifsc_code: e.target.value.toUpperCase() })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Account Number</label>
                          <Input
                            placeholder="Enter account number"
                            value={paymentDetails.account_number}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, account_number: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Account Holder Name</label>
                          <Input
                            placeholder="As per bank records"
                            value={paymentDetails.account_holder}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, account_holder: e.target.value })}
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                    
                    <Button
                      className="w-full gap-2"
                      onClick={() => setShowPreview(true)}
                      disabled={
                        coinsToRedeem < MIN_REDEMPTION_COINS ||
                        (paymentMethod === "upi" && !paymentDetails.upi_id) ||
                        (paymentMethod === "bank" && (!paymentDetails.bank_name || !paymentDetails.account_number || !paymentDetails.ifsc_code || !paymentDetails.account_holder))
                      }
                    >
                      <Eye className="w-4 h-4" />
                      Preview & Confirm
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    {/* Preview */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
                      <h4 className="font-medium text-green-700 dark:text-green-400 mb-3">Redemption Preview</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Coins to Redeem</span>
                          <span className="font-medium">{coinsToRedeem} coins</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-bold text-green-600">₹{inrAmount}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment Method</span>
                          <span className="font-medium">{paymentMethod.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment To</span>
                          <span className="font-medium text-right text-xs">
                            {paymentMethod === "upi" 
                              ? paymentDetails.upi_id 
                              : `${paymentDetails.bank_name} - ****${paymentDetails.account_number?.slice(-4)}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        <strong>⏰ Processing Time:</strong> Your redemption will be reviewed by admin. Once approved, payment will be processed within 24-72 working hours.
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setShowPreview(false)}>
                        Edit Details
                      </Button>
                      <Button
                        className="flex-1 gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                        onClick={() => submitRedemption.mutate()}
                        disabled={submitRedemption.isPending}
                      >
                        {submitRedemption.isPending ? (
                          "Processing..."
                        ) : (
                          <>
                            Confirm Redemption
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Wallet Stats */}
      <div className="grid grid-cols-3 gap-4 p-5 border-b border-border">
        <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/20">
          <Zap className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{wallet?.total_points || 0}</p>
          <p className="text-xs text-muted-foreground">Points</p>
        </div>
        <div className="text-center p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <Coins className="w-5 h-5 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-amber-600">{wallet?.total_coins || 0}</p>
          <p className="text-xs text-muted-foreground">Coins</p>
        </div>
        <div className="text-center p-4 rounded-xl bg-green-500/5 border border-green-500/20">
          <IndianRupee className="w-5 h-5 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-600">₹{wallet?.redeemable_balance || 0}</p>
          <p className="text-xs text-muted-foreground">Redeemable</p>
        </div>
      </div>

      {/* Conversion Info */}
      <div className="px-5 py-3 bg-muted/30 flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">100</span>
          <Zap className="w-4 h-4 text-primary" />
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">1</span>
          <Coins className="w-4 h-4 text-amber-500" />
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">1</span>
          <Coins className="w-4 h-4 text-amber-500" />
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">₹1</span>
          <IndianRupee className="w-4 h-4 text-green-500" />
        </div>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-xs text-muted-foreground">Min ₹{MIN_REDEMPTION_COINS} to redeem</span>
      </div>

      {/* Recent Activity */}
      <Tabs defaultValue="transactions" className="p-5">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="transactions" className="gap-2">
            <History className="w-4 h-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="redemptions" className="gap-2">
            <Gift className="w-4 h-4" />
            Redemptions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="mt-4">
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        tx.transaction_type === "earn" && "bg-green-500/10",
                        tx.transaction_type === "convert" && "bg-amber-500/10",
                        tx.transaction_type === "redeem" && "bg-purple-500/10"
                      )}>
                        {tx.transaction_type === "earn" && <TrendingUp className="w-4 h-4 text-green-500" />}
                        {tx.transaction_type === "convert" && <Sparkles className="w-4 h-4 text-amber-500" />}
                        {tx.transaction_type === "redeem" && <Gift className="w-4 h-4 text-purple-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tx.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {tx.points_amount !== 0 && (
                        <p className={cn("text-sm font-medium", tx.points_amount > 0 ? "text-green-500" : "text-muted-foreground")}>
                          {tx.points_amount > 0 ? "+" : ""}{tx.points_amount} pts
                        </p>
                      )}
                      {tx.coins_amount !== 0 && (
                        <p className={cn("text-sm font-medium", tx.coins_amount > 0 ? "text-amber-500" : "text-muted-foreground")}>
                          {tx.coins_amount > 0 ? "+" : ""}{tx.coins_amount} coins
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No transactions yet</p>
                  <p className="text-xs">Complete tasks to earn points!</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="redemptions" className="mt-4">
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {redemptions.length > 0 ? (
                redemptions.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <IndianRupee className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          ₹{Number(req.amount_rupees).toFixed(0)} via {req.payment_method?.toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(req.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Gift className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No redemption requests yet</p>
                  <p className="text-xs">Collect {MIN_REDEMPTION_COINS}+ coins to redeem</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Lifetime Stats */}
      <div className="p-5 border-t border-border bg-muted/20">
        <h4 className="text-sm font-medium mb-3">Lifetime Stats</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-primary">{wallet?.lifetime_points || 0}</p>
            <p className="text-xs text-muted-foreground">Total Points Earned</p>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-500">{wallet?.lifetime_coins || 0}</p>
            <p className="text-xs text-muted-foreground">Total Coins Earned</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-500">₹{wallet?.lifetime_redeemed || 0}</p>
            <p className="text-xs text-muted-foreground">Total Redeemed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletRedemption;