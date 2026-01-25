import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Sparkles, Crown, Zap, Loader2, Calculator, Bot, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckoutDialog } from "@/components/checkout/CheckoutDialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePricingConfig } from "@/hooks/useAdmin";

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getCurrentPlan, refetch } = useSubscription();
  const [checkoutPlan, setCheckoutPlan] = useState<"pro" | "premium" | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch dynamic pricing from database
  const { data: pricingConfig, isLoading: pricingLoading } = usePricingConfig();

  const currentPlan = getCurrentPlan();

  const handlePlanSelect = (planType: "free" | "pro" | "premium") => {
    if (planType === "free") {
      navigate("/login");
      return;
    }

    if (!user) {
      navigate("/login");
      return;
    }

    // Check if already on this plan or higher
    if (currentPlan === planType) {
      toast.info(`You're already on the ${planType} plan`);
      return;
    }

    if (currentPlan === 'premium') {
      toast.info("You already have Premium access!");
      return;
    }

    // Open checkout dialog
    setCheckoutPlan(planType);
  };

  const handleCheckoutSuccess = () => {
    refetch();
    toast.success(`Welcome to ${checkoutPlan === 'pro' ? 'Pro' : 'Premium'}! Check your email for the invoice.`);
    setCheckoutPlan(null);
    navigate('/app/profile');
  };

  // Build plans from database config or use defaults
  const plans = useMemo(() => {
    // Helper to get price from config or fallback
    const getPlanConfig = (planName: string) => {
      return pricingConfig?.find(p => p.plan_name === planName);
    };

    const freePlan = getPlanConfig('free');
    const proPlan = getPlanConfig('pro');
    const premiumPlan = getPlanConfig('premium');

    return [
      {
        name: freePlan?.display_name || "Free",
        monthlyPrice: Number(freePlan?.monthly_price) || 0,
        annualPrice: Number(freePlan?.annual_price) || 0,
        period: "forever",
        description: freePlan?.description || "Everything you need to get started",
        icon: Zap,
        highlight: false,
        planType: "free" as const,
        features: Array.isArray(freePlan?.features) 
          ? freePlan.features.map(f => String(f))
          : [
              "Unlimited tasks & todos",
              "Study syllabus tracking",
              "Expense & income tracking",
              "Loan EMI management",
              "Insurance policy tracking",
              "Basic tax calculator",
              "3 TAXYN messages/day",
              "2GB memory storage",
              "Basic reports & insights",
              "Email support",
            ],
        cta: "Get Started Free",
      },
      {
        name: proPlan?.display_name || "Pro",
        monthlyPrice: Number(proPlan?.monthly_price) || 199,
        annualPrice: Number(proPlan?.annual_price) || 1999,
        period: billingCycle === "monthly" ? "/month" : "/year",
        savings: billingCycle === "annual" ? `Save ₹${(Number(proPlan?.monthly_price || 199) * 12) - (Number(proPlan?.annual_price || 1999))}` : null,
        description: proPlan?.description || "Enhanced features for power users",
        icon: Sparkles,
        highlight: true,
        popular: true,
        planType: "pro" as const,
        features: Array.isArray(proPlan?.features)
          ? proPlan.features.map(f => String(f))
          : [
              "Everything in Free, plus:",
              "10GB memory storage",
              "Advanced financial analytics",
              "Unlimited tax calculations",
              "Unlimited TAXYN AI assistant",
              "Regime comparison & optimization",
              "Tax PDF reports",
              "FinanceFlow AI (Gmail import)",
              "Priority reminders",
              "Priority email support",
            ],
        cta: currentPlan === "pro" ? "Current Plan" : "Upgrade to Pro",
      },
      {
        name: premiumPlan?.display_name || "Premium",
        monthlyPrice: Number(premiumPlan?.monthly_price) || 499,
        annualPrice: Number(premiumPlan?.annual_price) || 4999,
        period: billingCycle === "monthly" ? "/month" : "/year",
        savings: billingCycle === "annual" ? `Save ₹${(Number(premiumPlan?.monthly_price || 499) * 12) - (Number(premiumPlan?.annual_price || 4999))}` : null,
        description: premiumPlan?.description || "Full access with all premium features",
        icon: Crown,
        highlight: false,
        planType: "premium" as const,
        features: Array.isArray(premiumPlan?.features)
          ? premiumPlan.features.map(f => String(f))
          : [
              "Everything in Pro, plus:",
              "100GB memory storage",
              "Advanced AI insights",
              "Multi-year tax history",
              "CA consultation credits",
              "Family profiles",
              "Export all data formats",
              "Early access to all features",
              "Private Discord access",
              "Direct founder support",
            ],
        cta: currentPlan === "premium" ? "Current Plan" : "Get Premium",
      },
    ];
  }, [pricingConfig, billingCycle, currentPlan]);

  // Tax-only addon pricing section
  const taxAddon = {
    name: "Tax Pro",
    price: "₹49",
    period: "/month",
    description: "Just need tax features? Get unlimited tax calculations and TAXYN AI.",
    icon: Calculator,
    features: [
      "Unlimited tax calculations",
      "Unlimited TAXYN AI assistant", 
      "Old vs New regime comparison",
      "Deduction optimizer",
      "Tax PDF reports",
    ],
  };

  const getDisplayPrice = (plan: typeof plans[0]) => {
    const price = billingCycle === "monthly" ? plan.monthlyPrice : plan.annualPrice;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const getMonthlyEquivalent = (plan: typeof plans[0]) => {
    if (billingCycle === "annual" && plan.annualPrice > 0) {
      const monthlyEquiv = Math.round(plan.annualPrice / 12);
      return `₹${monthlyEquiv}/mo`;
    }
    return null;
  };

  return (
    <motion.main
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-light tracking-wide text-foreground mb-3">
            Simple, Honest Pricing
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Start free, upgrade when you need more. No hidden fees, no surprises.
          </p>
          {currentPlan !== "free" && (
            <Badge variant="secondary" className="mt-4">
              Current Plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            </Badge>
          )}
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <span className={`text-sm font-medium transition-colors ${billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>
            Monthly
          </span>
          <div className="flex items-center gap-2">
            <Switch
              checked={billingCycle === "annual"}
              onCheckedChange={(checked) => setBillingCycle(checked ? "annual" : "monthly")}
              id="billing-toggle"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-medium transition-colors ${billingCycle === "annual" ? "text-foreground" : "text-muted-foreground"}`}>
              Annual
            </span>
            {billingCycle === "annual" && (
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] px-1.5 py-0">
                <Star className="w-2.5 h-2.5 mr-0.5 fill-current" />
                Best Value
              </Badge>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.planType;
            const monthlyEquiv = getMonthlyEquivalent(plan);
            
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-xl border p-6 ${
                  plan.highlight
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : isCurrentPlan
                      ? "border-vyom-success bg-vyom-success/5"
                      : "border-border bg-card/50"
                }`}
              >
                {plan.popular && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                    Most Popular
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-vyom-success text-white text-xs font-medium rounded-full">
                    Current Plan
                  </div>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    plan.highlight ? "bg-primary/20" : "bg-muted"
                  }`}>
                    <Icon className={`w-5 h-5 ${plan.highlight ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <h2 className="text-xl font-medium text-foreground">{plan.name}</h2>
                </div>

                <div className="mb-1">
                  <span className="text-3xl font-light text-foreground">{getDisplayPrice(plan)}</span>
                  <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
                </div>
                
                {plan.savings && (
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                      {plan.savings}
                    </Badge>
                    {monthlyEquiv && (
                      <span className="text-xs text-muted-foreground">({monthlyEquiv})</span>
                    )}
                  </div>
                )}
                
                {!plan.savings && plan.monthlyPrice > 0 && billingCycle === "monthly" && (
                  <p className="text-xs text-muted-foreground mb-2">
                    or ₹{plan.annualPrice.toLocaleString('en-IN')}/year (save {Math.round((1 - plan.annualPrice / (plan.monthlyPrice * 12)) * 100)}%)
                  </p>
                )}
                
                {plan.monthlyPrice === 0 && <div className="mb-2" />}

                <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        plan.highlight ? "text-primary" : "text-muted-foreground"
                      }`} />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full ${
                    isCurrentPlan
                      ? "bg-vyom-success/20 text-vyom-success hover:bg-vyom-success/30"
                      : plan.highlight 
                        ? "" 
                        : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                  variant={plan.highlight && !isCurrentPlan ? "default" : "secondary"}
                  onClick={() => handlePlanSelect(plan.planType)}
                  disabled={(isLoading && plan.planType !== "free") || isCurrentPlan}
                >
                  {isLoading && plan.planType !== "free" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    plan.cta
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Tax-Only Addon Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <Card className="border-violet-500/30 bg-gradient-to-r from-violet-500/5 to-purple-500/5">
            <CardHeader className="text-center pb-2">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              </div>
              <CardTitle className="text-lg font-medium">Just need Tax features?</CardTitle>
              <p className="text-sm text-muted-foreground">
                Get unlimited access to tax calculations and TAXYN AI for just ₹49/month
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap justify-center gap-3 mb-4">
                {taxAddon.features.map((feature, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 py-1">
                    <Check className="w-3 h-3 text-violet-500" />
                    {feature}
                  </Badge>
                ))}
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-foreground">₹49</span>
                <span className="text-muted-foreground">/month</span>
                <p className="text-xs text-muted-foreground mt-1">Coming soon • Be the first to know</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="mt-16 text-center">
          <h3 className="text-lg font-medium text-foreground mb-3">Frequently Asked Questions</h3>
          <div className="max-w-2xl mx-auto space-y-4 text-left">
            <div className="p-4 rounded-lg bg-card/50 border border-border">
              <h4 className="font-medium text-foreground mb-1">Can I switch plans later?</h4>
              <p className="text-sm text-muted-foreground">Yes, you can upgrade anytime. Your new features will be available immediately after payment.</p>
            </div>
            <div className="p-4 rounded-lg bg-card/50 border border-border">
              <h4 className="font-medium text-foreground mb-1">What's the difference between monthly and annual billing?</h4>
              <p className="text-sm text-muted-foreground">Annual billing saves you up to 17% compared to monthly. You pay once for the entire year and get uninterrupted access.</p>
            </div>
            <div className="p-4 rounded-lg bg-card/50 border border-border">
              <h4 className="font-medium text-foreground mb-1">Is my data safe?</h4>
              <p className="text-sm text-muted-foreground">Absolutely. We use end-to-end encryption and your data is never shared with third parties.</p>
            </div>
            <div className="p-4 rounded-lg bg-card/50 border border-border">
              <h4 className="font-medium text-foreground mb-1">What payment methods do you accept?</h4>
              <p className="text-sm text-muted-foreground">We accept UPI, credit/debit cards, net banking, and popular wallets through Razorpay.</p>
            </div>
            <div className="p-4 rounded-lg bg-card/50 border border-border">
              <h4 className="font-medium text-foreground mb-1">Will I get an invoice?</h4>
              <p className="text-sm text-muted-foreground">Yes! A detailed GST invoice will be sent to your registered email immediately after successful payment.</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground/60">CHRONYX by ORIGINX LABS PVT. LTD.</p>
        </div>
      </div>

      {/* Checkout Dialog */}
      {checkoutPlan && (
        <CheckoutDialog
          open={!!checkoutPlan}
          onOpenChange={(open) => !open && setCheckoutPlan(null)}
          plan={checkoutPlan}
          billingCycle={billingCycle}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </motion.main>
  );
};

export default Pricing;
