import { useState, useEffect } from "react";
import { Shield, Plus, Pencil, Trash2, Calendar, ChevronRight, Heart, Users, FileText, Car, Bike, Home, Plane, Umbrella, Baby, Stethoscope, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useActivityLog } from "@/hooks/useActivityLog";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import AddInsuranceForm from "./AddInsuranceForm";
import PolicyDetailDialog from "./PolicyDetailDialog";
import PremiumPaymentButton from "./PremiumPaymentButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface InsuranceProvider {
  id: string;
  name: string;
  short_name: string | null;
  logo_url: string | null;
}

interface Insurance {
  id: string;
  policy_name: string;
  provider: string;
  policy_number: string;
  policy_type: string;
  premium_amount: number;
  sum_assured: number;
  start_date: string;
  renewal_date: string;
  insured_type: string;
  insured_member_id: string | null;
  vehicle_registration: string | null;
  notes: string | null;
  status: string;
  family_member?: { full_name: string } | null;
  reminder_days?: number[] | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const getDaysUntilRenewal = (dateStr: string) => {
  const renewal = new Date(dateStr);
  const today = new Date();
  return Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

// Policy type icons and colors mapping - extended
const getPolicyTypeConfig = (type: string) => {
  const typeConfigs: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
    'Health': { icon: Heart, color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
    'Term Life': { icon: FileText, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    'Life': { icon: Shield, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    'Term': { icon: FileText, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    'Vehicle': { icon: Car, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    'Car': { icon: Car, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    'Bike': { icon: Bike, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    'Two Wheeler': { icon: Bike, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    'Home': { icon: Home, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    'Property': { icon: Building2, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    'Travel': { icon: Plane, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
    'Family': { icon: Users, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    'Critical Illness': { icon: Stethoscope, color: 'text-red-500', bgColor: 'bg-red-500/10' },
    'Child Plan': { icon: Baby, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
    'Personal Accident': { icon: Umbrella, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
  };
  return typeConfigs[type] || { icon: Shield, color: 'text-primary', bgColor: 'bg-primary/10' };
};

const PoliciesList = () => {
  const { user } = useAuth();
  const { logActivity } = useActivityLog();
  const [policies, setPolicies] = useState<Insurance[]>([]);
  const [providers, setProviders] = useState<InsuranceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Insurance | null>(null);

  useEffect(() => {
    if (user) {
      fetchPolicies();
      fetchProviders();
    }
  }, [user]);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from("insurance_providers")
        .select("id, name, short_name, logo_url");

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error("Error fetching providers:", error);
    }
  };

  const getProviderLogo = (providerName: string) => {
    const provider = providers.find(p => p.name.toLowerCase() === providerName.toLowerCase());
    return provider?.logo_url || null;
  };

  const getProviderShortName = (providerName: string) => {
    const provider = providers.find(p => p.name.toLowerCase() === providerName.toLowerCase());
    return provider?.short_name || providerName.slice(0, 2);
  };

  const fetchPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from("insurances")
        .select("*, family_member:family_members(full_name)")
        .order("renewal_date", { ascending: true });

      if (error) throw error;
      setPolicies(data || []);
    } catch (error) {
      console.error("Error fetching policies:", error);
      toast.error("Failed to fetch policies");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPolicy) return;
    try {
      const { error } = await supabase.from("insurances").delete().eq("id", selectedPolicy.id);
      if (error) throw error;
      await logActivity("Deleted insurance policy", "insurance");
      toast.success("Policy deleted");
      setDeleteDialogOpen(false);
      fetchPolicies();
    } catch (error) {
      console.error("Error deleting policy:", error);
      toast.error("Failed to delete policy");
    }
  };

  const totalPremium = policies.filter(p => p.status === 'active').reduce((acc, p) => acc + Number(p.premium_amount), 0);

  if (loading) {
    return <div className="flex items-center justify-center h-32"><div className="text-muted-foreground">Loading...</div></div>;
  }

  // Group policies by type for the summary
  const activePolicies = policies.filter(p => p.status === 'active');
  const policyTypeGroups: Record<string, number> = {};
  activePolicies.forEach(p => {
    const type = p.policy_type || 'Other';
    policyTypeGroups[type] = (policyTypeGroups[type] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Policies</p>
          <p className="text-3xl font-semibold text-foreground mt-2">{activePolicies.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Annual Premium</p>
          <p className="text-3xl font-semibold text-primary mt-2">{formatCurrency(totalPremium)}</p>
        </div>
      </div>

      {/* Policy Types Grid with Icons */}
      {Object.keys(policyTypeGroups).length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Policy Types</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {Object.entries(policyTypeGroups).map(([type, count]) => {
              const config = getPolicyTypeConfig(type);
              const Icon = config.icon;
              return (
                <div
                  key={type}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl ${config.bgColor} hover:scale-105 transition-transform cursor-pointer`}
                  onClick={() => {
                    // Scroll to first policy of this type
                    const el = document.querySelector(`[data-policy-type="${type}"]`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                >
                  <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <span className="text-xl font-bold text-foreground">{count}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider text-center">
                    {type}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">All Policies</h2>
        <Button onClick={() => { setSelectedPolicy(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Policy
        </Button>
      </div>

      {/* Policies List */}
      {policies.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No policies</h3>
          <p className="text-sm text-muted-foreground">Add your first insurance policy</p>
        </div>
      ) : (
        <div className="space-y-4">
          {policies.map((policy) => {
            const daysUntil = getDaysUntilRenewal(policy.renewal_date);
            const isExpiringSoon = daysUntil <= 30 && daysUntil > 0;

            const policyConfig = getPolicyTypeConfig(policy.policy_type);
            const PolicyIcon = policyConfig.icon;

            return (
              <div 
                key={policy.id}
                data-policy-type={policy.policy_type}
                className="bg-card border border-border rounded-lg p-6 hover:bg-accent/30 transition-colors cursor-pointer group"
                onClick={() => { setSelectedPolicy(policy); setDetailOpen(true); }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${policyConfig.bgColor} flex items-center justify-center`}>
                      <PolicyIcon className={`w-5 h-5 ${policyConfig.color}`} />
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-foreground">{policy.policy_name}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${policyConfig.bgColor} ${policyConfig.color}`}>
                          {policy.policy_type}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={getProviderLogo(policy.provider) || undefined} alt={policy.provider} />
                            <AvatarFallback className="text-[6px] bg-muted">
                              {getProviderShortName(policy.provider)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">{policy.provider}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs",
                      isExpiringSoon ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                    )}>
                      <Calendar className="w-3 h-3" />
                      {daysUntil > 0 ? `${daysUntil} days` : 'Expired'}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <PremiumPaymentButton
                        insuranceId={policy.id}
                        policyName={policy.policy_name}
                        premiumAmount={policy.premium_amount}
                        onSuccess={fetchPolicies}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={(e) => { e.stopPropagation(); setSelectedPolicy(policy); setFormOpen(true); }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setSelectedPolicy(policy); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{formatCurrency(policy.sum_assured)}</p>
                    <p className="text-xs text-muted-foreground">Sum Assured</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{formatCurrency(policy.premium_amount)}</p>
                    <p className="text-xs text-muted-foreground">Premium</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{format(new Date(policy.renewal_date), 'MMM d, yyyy')}</p>
                    <p className="text-xs text-muted-foreground">Renewal</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {policy.insured_type === 'family' ? policy.family_member?.full_name : policy.insured_type === 'vehicle' ? policy.vehicle_registration : 'Self'}
                    </p>
                    <p className="text-xs text-muted-foreground">Insured For</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddInsuranceForm open={formOpen} onOpenChange={setFormOpen} insurance={selectedPolicy} onSuccess={fetchPolicies} />

      <PolicyDetailDialog 
        open={detailOpen} 
        onOpenChange={setDetailOpen} 
        policy={selectedPolicy} 
        onUpdate={fetchPolicies} 
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Policy</AlertDialogTitle>
            <AlertDialogDescription>This will also delete all claims and documents linked to this policy.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PoliciesList;
