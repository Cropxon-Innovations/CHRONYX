import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BillingAddressForm, BillingAddress } from "./BillingAddressForm";
import { useRazorpay } from "@/hooks/useRazorpay";
import { useAuth } from "@/contexts/AuthContext";
import { Crown, Sparkles, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: "pro" | "premium";
  onSuccess?: () => void;
}

export const CheckoutDialog = ({ open, onOpenChange, plan, onSuccess }: CheckoutDialogProps) => {
  const { user } = useAuth();
  const { initiatePayment, isLoading, planConfig } = useRazorpay();
  const [step, setStep] = useState<"billing" | "processing" | "success">("billing");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");

  const planDetails = {
    pro: {
      name: "Pro",
      price: planConfig.pro.amount,
      icon: Sparkles,
      color: "from-blue-500 to-indigo-600",
      features: ["Unlimited Tasks", "Finance Tracking", "Cloud Sync", "Priority Support"],
    },
    premium: {
      name: "Premium",
      price: planConfig.premium.amount,
      icon: Crown,
      color: "from-amber-500 to-orange-600",
      features: ["All Pro Features", "AI Assistant", "Advanced Analytics", "Family Sharing", "Vault Access"],
    },
  };

  const currentPlan = planDetails[plan];
  const Icon = currentPlan.icon;

  const handleBillingSubmit = async (billingAddress: BillingAddress) => {
    setStep("processing");
    
    const result = await initiatePayment(
      plan,
      { email: user?.email || "" },
      billingAddress
    );

    if (result.success) {
      setInvoiceNumber(result.invoiceNumber || "");
      setStep("success");
      onSuccess?.();
    } else {
      setStep("billing");
    }
  };

  const handleClose = () => {
    if (step !== "processing") {
      onOpenChange(false);
      // Reset state after dialog closes
      setTimeout(() => setStep("billing"), 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        {/* Plan Header */}
        <div className={`bg-gradient-to-br ${currentPlan.color} p-6 text-white`}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-white">
                  CHRONYX {currentPlan.name}
                </DialogTitle>
                <DialogDescription className="text-white/80 mt-0.5">
                  ₹{currentPlan.price}/month
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex flex-wrap gap-2 mt-4">
            {currentPlan.features.map((feature) => (
              <span 
                key={feature}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 text-xs font-medium"
              >
                <Check className="w-3 h-3" />
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === "billing" && (
              <motion.div
                key="billing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <BillingAddressForm
                  onSubmit={handleBillingSubmit}
                  onCancel={handleClose}
                  isLoading={isLoading}
                />
              </motion.div>
            )}

            {step === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-spin border-t-primary" />
                  <Icon className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">Completing payment...</p>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <motion.div 
                  className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  <Check className="w-10 h-10 text-emerald-500" />
                </motion.div>
                <h3 className="mt-4 text-xl font-semibold text-foreground">Welcome to {currentPlan.name}!</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your invoice has been sent to your email.
                </p>
                {invoiceNumber && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Invoice: {invoiceNumber}
                  </p>
                )}
                <button
                  onClick={handleClose}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm"
                >
                  Start Exploring
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
