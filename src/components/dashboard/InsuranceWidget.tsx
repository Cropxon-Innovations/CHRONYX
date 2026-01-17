import { useState, useEffect } from "react";
import { Shield, Heart, Users, FileText, Car, Bike, Home, Plane, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface PolicyByType {
  type: string;
  count: number;
}

interface InsuranceSummary {
  totalPolicies: number;
  selfPolicies: number;
  familyPolicies: number;
  claimsFiled: number;
  claimsSettled: number;
  totalClaimedAmount: number;
  totalSettledAmount: number;
  policyByType: PolicyByType[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Policy type icons and colors mapping
const getPolicyTypeConfig = (type: string) => {
  const typeConfigs: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
    'Health': { icon: Heart, color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
    'Term Life': { icon: FileText, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    'Life': { icon: FileText, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    'Term': { icon: FileText, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    'Vehicle': { icon: Car, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    'Car': { icon: Car, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    'Bike': { icon: Bike, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    'Two Wheeler': { icon: Bike, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    'Home': { icon: Home, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    'Property': { icon: Home, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    'Travel': { icon: Plane, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
    'Family': { icon: Users, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  };
  return typeConfigs[type] || { icon: Shield, color: 'text-primary', bgColor: 'bg-primary/10' };
};

const InsuranceWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<InsuranceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInsuranceSummary();
    }
  }, [user]);

  const fetchInsuranceSummary = async () => {
    try {
      // Fetch insurances
      const { data: insurances } = await supabase
        .from("insurances")
        .select("id, insured_type, status, policy_type")
        .eq("status", "active");

      // Fetch claims
      const { data: claims } = await supabase
        .from("insurance_claims")
        .select("status, claimed_amount, settled_amount");

      const totalPolicies = insurances?.length || 0;
      const selfPolicies = insurances?.filter(i => i.insured_type === 'self').length || 0;
      const familyPolicies = totalPolicies - selfPolicies;

      // Group by policy type
      const typeGroups: Record<string, number> = {};
      insurances?.forEach(ins => {
        const type = ins.policy_type || 'Other';
        typeGroups[type] = (typeGroups[type] || 0) + 1;
      });
      const policyByType: PolicyByType[] = Object.entries(typeGroups).map(([type, count]) => ({ type, count }));

      const claimsFiled = claims?.length || 0;
      const claimsSettled = claims?.filter(c => c.status === 'Settled').length || 0;
      const totalClaimedAmount = claims?.reduce((sum, c) => sum + Number(c.claimed_amount || 0), 0) || 0;
      const totalSettledAmount = claims?.reduce((sum, c) => sum + Number(c.settled_amount || 0), 0) || 0;

      setSummary({
        totalPolicies,
        selfPolicies,
        familyPolicies,
        claimsFiled,
        claimsSettled,
        totalClaimedAmount,
        totalSettledAmount,
        policyByType,
      });
    } catch (error) {
      console.error("Error fetching insurance summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToInsurance = () => {
    navigate('/app/insurance');
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-8 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!summary || summary.totalPolicies === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Insurance</h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-3">No active policies</p>
        <button 
          onClick={handleNavigateToInsurance}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          Add your first policy <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Policies</h3>
            <p className="text-2xl font-semibold text-foreground">{summary.totalPolicies}</p>
          </div>
        </div>
        <button 
          onClick={handleNavigateToInsurance}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Policy Types with Icons */}
      {summary.policyByType.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {summary.policyByType.map((item) => {
            const config = getPolicyTypeConfig(item.type);
            const Icon = config.icon;
            return (
              <button
                key={item.type}
                onClick={handleNavigateToInsurance}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${config.bgColor} hover:scale-105 transition-transform cursor-pointer`}
              >
                <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <span className="text-lg font-semibold text-foreground">{item.count}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider truncate w-full text-center">
                  {item.type}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Self/Family breakdown */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Shield className="w-3 h-3 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{summary.selfPolicies}</p>
            <p className="text-[10px] text-muted-foreground">Self</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Users className="w-3 h-3 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{summary.familyPolicies}</p>
            <p className="text-[10px] text-muted-foreground">Family</p>
          </div>
        </div>
      </div>

      {/* Claim Stats */}
      {(summary.claimsFiled > 0 || summary.claimsSettled > 0) && (
        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Claims Filed</span>
            <span className="font-medium">{summary.claimsFiled}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Settled</span>
            <span className="font-medium text-green-600">{summary.claimsSettled}</span>
          </div>
          {summary.totalSettledAmount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Amount Settled</span>
              <span className="font-medium text-green-600">{formatCurrency(summary.totalSettledAmount)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InsuranceWidget;
