import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Wallet, 
  Building2, 
  Smartphone, 
  Save, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Info,
  TrendingUp
} from "lucide-react";

interface PaymentSettings {
  id?: string;
  payment_method: 'upi' | 'bank';
  upi_id: string | null;
  bank_name: string | null;
  account_holder_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  is_verified: boolean;
}

interface EarningsStats {
  totalEarnings: number;
  pendingPayout: number;
  completedPayouts: number;
  totalSales: number;
}

export const CreatorPaymentSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PaymentSettings>({
    payment_method: 'upi',
    upi_id: '',
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    is_verified: false
  });
  const [earnings, setEarnings] = useState<EarningsStats>({
    totalEarnings: 0,
    pendingPayout: 0,
    completedPayouts: 0,
    totalSales: 0
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
      fetchEarnings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('creator_payment_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings({
          id: data.id,
          payment_method: data.payment_method as 'upi' | 'bank',
          upi_id: data.upi_id || '',
          bank_name: data.bank_name || '',
          account_holder_name: data.account_holder_name || '',
          account_number: data.account_number || '',
          ifsc_code: data.ifsc_code || '',
          is_verified: data.is_verified || false
        });
      }
    } catch (error) {
      console.error("Error fetching payment settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEarnings = async () => {
    if (!user) return;
    try {
      // Get total earnings from library items
      const { data: items } = await supabase
        .from('library_items')
        .select('total_earnings, purchase_count')
        .eq('user_id', user.id)
        .eq('is_public', true);

      const totalEarnings = items?.reduce((sum, item) => sum + (Number(item.total_earnings) || 0), 0) || 0;
      const totalSales = items?.reduce((sum, item) => sum + (item.purchase_count || 0), 0) || 0;

      // Get payout status
      const { data: payouts } = await supabase
        .from('creator_payouts')
        .select('amount, status')
        .eq('user_id', user.id);

      const completedPayouts = payouts?.filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const pendingPayout = totalEarnings - completedPayouts;

      setEarnings({
        totalEarnings,
        pendingPayout: Math.max(0, pendingPayout),
        completedPayouts,
        totalSales
      });
    } catch (error) {
      console.error("Error fetching earnings:", error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Validate based on payment method
      if (settings.payment_method === 'upi' && !settings.upi_id) {
        toast.error("Please enter your UPI ID");
        setSaving(false);
        return;
      }

      if (settings.payment_method === 'bank') {
        if (!settings.bank_name || !settings.account_holder_name || 
            !settings.account_number || !settings.ifsc_code) {
          toast.error("Please fill all bank details");
          setSaving(false);
          return;
        }
      }

      const payload = {
        user_id: user.id,
        payment_method: settings.payment_method,
        upi_id: settings.payment_method === 'upi' ? settings.upi_id : null,
        bank_name: settings.payment_method === 'bank' ? settings.bank_name : null,
        account_holder_name: settings.payment_method === 'bank' ? settings.account_holder_name : null,
        account_number: settings.payment_method === 'bank' ? settings.account_number : null,
        ifsc_code: settings.payment_method === 'bank' ? settings.ifsc_code : null,
      };

      const { error } = await supabase
        .from('creator_payment_settings')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success("Payment settings saved successfully!");
    } catch (error) {
      console.error("Error saving payment settings:", error);
      toast.error("Failed to save payment settings");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

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
    <div className="space-y-6">
      {/* Earnings Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Creator Earnings
          </CardTitle>
          <CardDescription>
            Your earnings from published content on Knowledge Hub
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs text-muted-foreground">Total Earnings</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(earnings.totalEarnings)}</p>
            </div>
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-muted-foreground">Pending Payout</p>
              <p className="text-xl font-bold text-amber-600">{formatCurrency(earnings.pendingPayout)}</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-muted-foreground">Paid Out</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(earnings.completedPayouts)}</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <p className="text-xs text-muted-foreground">Total Sales</p>
              <p className="text-xl font-bold text-purple-600">{earnings.totalSales}</p>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Payouts are processed within 5-7 working days after reaching ₹100 minimum threshold. 
              Chronyx charges 5-10% commission based on content type.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Payout Settings
          </CardTitle>
          <CardDescription>
            Add your payment details to receive earnings from your published content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <RadioGroup
              value={settings.payment_method}
              onValueChange={(value: 'upi' | 'bank') => 
                setSettings(prev => ({ ...prev, payment_method: value }))
              }
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upi" id="upi" />
                <Label htmlFor="upi" className="flex items-center gap-2 cursor-pointer">
                  <Smartphone className="h-4 w-4 text-green-600" />
                  UPI
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bank" id="bank" />
                <Label htmlFor="bank" className="flex items-center gap-2 cursor-pointer">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  Bank Transfer
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* UPI Settings */}
          {settings.payment_method === 'upi' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="upi_id">UPI ID</Label>
                <Input
                  id="upi_id"
                  placeholder="yourname@upi"
                  value={settings.upi_id || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, upi_id: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your UPI ID (e.g., name@paytm, name@oksbi)
                </p>
              </div>
            </div>
          )}

          {/* Bank Settings */}
          {settings.payment_method === 'bank' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="account_holder">Account Holder Name</Label>
                <Input
                  id="account_holder"
                  placeholder="As per bank records"
                  value={settings.account_holder_name || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, account_holder_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  placeholder="e.g., State Bank of India"
                  value={settings.bank_name || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, bank_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  type="password"
                  placeholder="Your account number"
                  value={settings.account_number || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, account_number: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifsc">IFSC Code</Label>
                <Input
                  id="ifsc"
                  placeholder="e.g., SBIN0001234"
                  value={settings.ifsc_code || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, ifsc_code: e.target.value.toUpperCase() }))}
                />
              </div>
            </div>
          )}

          {/* Verification Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              {settings.is_verified ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
              <span className="text-sm">
                {settings.is_verified ? 'Verified' : 'Pending Verification'}
              </span>
            </div>
            <Badge variant={settings.is_verified ? 'default' : 'secondary'}>
              {settings.is_verified ? 'Active' : 'Pending'}
            </Badge>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Payment Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
