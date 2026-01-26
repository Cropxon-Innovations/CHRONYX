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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  coins_redeemed?: number;
  points_to_redeem?: number;
  amount_rupees?: number;
  inr_amount?: number;
  payment_method: string;
  status: string;
  created_at: string;
}

export const WalletRedemption = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "upi">("upi");
  const [coinsToRedeem, setCoinsToRedeem] = useState(1);
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
      
      // Try to get existing wallet or create one
      let { data, error } = await supabase
        .from("user_wallet")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (!data && !error) {
        // Create wallet if doesn't exist
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
      return (data || []).map(req => ({
        id: req.id,
        coins_redeemed: req.points_to_redeem || 0,
        inr_amount: Number(req.amount_rupees) || 0,
        payment_method: req.payment_method,
        status: req.status || 'pending',
        created_at: req.created_at,
      })) as RedemptionRequest[];
    },
    enabled: !!user,
  });

  // Submit redemption request
  const submitRedemption = useMutation({
    mutationFn: async () => {
      if (!user || !wallet) throw new Error("Not authenticated");
      if (coinsToRedeem < 1) throw new Error("Minimum 1 coin required");
      if (coinsToRedeem > wallet.total_coins) throw new Error("Insufficient coins");
      
      const inrAmount = coinsToRedeem * 10;
      
      // Create redemption request using existing schema
      const { error: reqError } = await supabase
        .from("redemption_requests")
        .insert({
          user_id: user.id,
          points_to_redeem: coinsToRedeem,
          amount_rupees: inrAmount,
          payment_method: paymentMethod,
          payment_details: {
            upi_id: paymentMethod === "upi" ? paymentDetails.upi_id : null,
            bank_name: paymentMethod === "bank" ? paymentDetails.bank_name : null,
            account_number: paymentMethod === "bank" ? paymentDetails.account_number : null,
            ifsc_code: paymentMethod === "bank" ? paymentDetails.ifsc_code : null,
            account_holder: paymentMethod === "bank" ? paymentDetails.account_holder : null,
          },
        });
      
      if (reqError) throw reqError;
      
      // Deduct coins from wallet
      const { error: walletError } = await supabase
        .from("user_wallet")
        .update({
          total_coins: wallet.total_coins - coinsToRedeem,
          redeemable_balance: wallet.redeemable_balance - inrAmount,
          lifetime_redeemed: (wallet.lifetime_redeemed || 0) + inrAmount,
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
          reason: `Redeemed ${coinsToRedeem} coins for ₹${inrAmount}`,
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["redemption-requests"] });
      setIsRedeemDialogOpen(false);
      setCoinsToRedeem(1);
      setPaymentDetails({ upi_id: "", bank_name: "", account_number: "", ifsc_code: "", account_holder: "" });
      toast.success("Redemption request submitted! You'll receive payment within 24 hours.");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit redemption");
    },
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: { icon: Clock, color: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
      processing: { icon: AlertCircle, color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
      completed: { icon: CheckCircle, color: "bg-green-500/10 text-green-600 border-green-500/30" },
      failed: { icon: XCircle, color: "bg-red-500/10 text-red-600 border-red-500/30" },
    };
    const { icon: Icon, color } = styles[status as keyof typeof styles] || styles.pending;
    return (
      <Badge variant="outline" className={cn("gap-1", color)}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

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
          
          <Dialog open={isRedeemDialogOpen} onOpenChange={setIsRedeemDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                disabled={!wallet || wallet.total_coins < 1}
              >
                <Gift className="w-4 h-4" />
                Redeem
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Redeem Coins</DialogTitle>
                <DialogDescription>
                  Convert your coins to INR and transfer to your bank or UPI
                </DialogDescription>
              </DialogHeader>
              
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
                    = ₹{((wallet?.total_coins || 0) * 10).toLocaleString('en-IN')} redeemable
                  </p>
                </div>
                
                {/* Coins to Redeem */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Coins to Redeem</label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={1}
                      max={wallet?.total_coins || 0}
                      value={coinsToRedeem}
                      onChange={(e) => setCoinsToRedeem(Math.min(Number(e.target.value), wallet?.total_coins || 0))}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
                      <IndianRupee className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-600">{coinsToRedeem * 10}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">1 coin = ₹10 INR</p>
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
                  onClick={() => submitRedemption.mutate()}
                  disabled={
                    coinsToRedeem < 1 ||
                    submitRedemption.isPending ||
                    (paymentMethod === "upi" && !paymentDetails.upi_id) ||
                    (paymentMethod === "bank" && (!paymentDetails.bank_name || !paymentDetails.account_number || !paymentDetails.ifsc_code || !paymentDetails.account_holder))
                  }
                >
                  {submitRedemption.isPending ? (
                    "Processing..."
                  ) : (
                    <>
                      Redeem ₹{coinsToRedeem * 10}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
          <span className="text-muted-foreground">₹10</span>
          <IndianRupee className="w-4 h-4 text-green-500" />
        </div>
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
          <ScrollArea className="h-48">
            {transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        tx.transaction_type === "earn" ? "bg-green-500/10" :
                        tx.transaction_type === "convert" ? "bg-amber-500/10" :
                        "bg-red-500/10"
                      )}>
                        {tx.transaction_type === "earn" ? <TrendingUp className="w-4 h-4 text-green-500" /> :
                         tx.transaction_type === "convert" ? <Sparkles className="w-4 h-4 text-amber-500" /> :
                         <Gift className="w-4 h-4 text-red-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tx.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {tx.points_amount !== 0 && (
                        <p className={cn(
                          "text-sm font-medium",
                          tx.points_amount > 0 ? "text-green-500" : "text-muted-foreground"
                        )}>
                          {tx.points_amount > 0 ? "+" : ""}{tx.points_amount} pts
                        </p>
                      )}
                      {tx.coins_amount !== 0 && (
                        <p className={cn(
                          "text-sm font-medium",
                          tx.coins_amount > 0 ? "text-amber-500" : "text-muted-foreground"
                        )}>
                          {tx.coins_amount > 0 ? "+" : ""}{tx.coins_amount} coins
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No transactions yet</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="redemptions" className="mt-4">
          <ScrollArea className="h-48">
            {redemptions.length > 0 ? (
              <div className="space-y-2">
                {redemptions.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">
                        {req.coins_redeemed} coins → ₹{req.inr_amount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {req.payment_method.toUpperCase()} • {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No redemptions yet</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WalletRedemption;
