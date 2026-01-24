import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BillingAddress } from "@/components/checkout/BillingAddressForm";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: () => void) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface PlanPricing {
  monthly: number;
  annual: number;
}

interface PlanConfig {
  pro: PlanPricing;
  premium: PlanPricing;
}

const PLAN_PRICES: PlanConfig = {
  pro: {
    monthly: 199,
    annual: 1999,
  },
  premium: {
    monthly: 499,
    annual: 4999,
  },
};

export const useRazorpay = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const initiatePayment = useCallback(
    async (
      plan: "pro" | "premium", 
      userDetails?: { name?: string; email?: string; phone?: string },
      billingAddress?: BillingAddress,
      billingCycle: "monthly" | "annual" = "monthly"
    ) => {
      setIsLoading(true);

      try {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error("Failed to load payment gateway");
        }

        const amount = PLAN_PRICES[plan][billingCycle];
        const cycleLabel = billingCycle === "annual" ? "Annual" : "Monthly";
        const planDescription = `CHRONYX ${plan === "pro" ? "Pro" : "Premium"} - ${cycleLabel} Subscription`;

        const { data: orderData, error: orderError } = await supabase.functions.invoke(
          "create-razorpay-order",
          {
            body: {
              amount,
              plan,
              currency: "INR",
              billingCycle,
            },
          }
        );

        if (orderError || !orderData) {
          throw new Error(orderError?.message || "Failed to create order");
        }

        const { orderId, keyId, amount: orderAmount, currency } = orderData;
        const { data: { user } } = await supabase.auth.getUser();

        return new Promise<{ 
          success: boolean; 
          paymentId?: string; 
          razorpay_order_id?: string; 
          razorpay_payment_id?: string; 
          razorpay_signature?: string;
          invoiceNumber?: string;
        }>((resolve) => {
          const options: RazorpayOptions = {
            key: keyId,
            amount: orderAmount,
            currency: currency,
            name: "CHRONYX by ORIGINX LABS",
            description: planDescription,
            order_id: orderId,
            handler: async (response: RazorpayResponse) => {
              try {
                // Verify payment and create subscription
                const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
                  "verify-razorpay-payment",
                  {
                    body: {
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                      plan,
                      userId: user?.id,
                      billingAddress,
                      email: userDetails?.email || user?.email,
                      billingCycle,
                    },
                  }
                );

                if (verifyError || !verifyData?.verified) {
                  console.error("Verification failed:", verifyError, verifyData);
                  toast({
                    title: "Payment Verification Failed",
                    description: "Please contact support if amount was deducted.",
                    variant: "destructive",
                  });
                  resolve({ success: false });
                  return;
                }

                // Send invoice email with billing address
                if (billingAddress && user?.email) {
                  try {
                    const { data: invoiceData } = await supabase.functions.invoke(
                      "send-invoice-email",
                      {
                        body: {
                          paymentId: response.razorpay_payment_id,
                          orderId: response.razorpay_order_id,
                          plan,
                          amount,
                          billingCycle,
                          billingAddress,
                          email: user.email,
                        },
                      }
                    );
                    
                    toast({
                      title: "Payment Successful!",
                      description: `Invoice sent to ${user.email}`,
                    });

                    resolve({ 
                      success: true, 
                      paymentId: response.razorpay_payment_id,
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                      invoiceNumber: invoiceData?.invoiceNumber,
                    });
                  } catch (invoiceError) {
                    console.error("Invoice email error:", invoiceError);
                    toast({
                      title: "Payment Successful!",
                      description: `Welcome to CHRONYX ${plan === "pro" ? "Pro" : "Premium"}!`,
                    });
                    resolve({ 
                      success: true, 
                      paymentId: response.razorpay_payment_id,
                    });
                  }
                } else {
                  toast({
                    title: "Payment Successful!",
                    description: `Welcome to CHRONYX ${plan === "pro" ? "Pro" : "Premium"}!`,
                  });
                  resolve({ 
                    success: true, 
                    paymentId: response.razorpay_payment_id,
                  });
                }
              } catch (error) {
                console.error("Verification error:", error);
                resolve({ success: false });
              }
            },
            prefill: {
              name: billingAddress?.full_name || userDetails?.name || "",
              email: userDetails?.email || user?.email || "",
              contact: userDetails?.phone || "",
            },
            notes: billingAddress ? {
              billing_name: billingAddress.full_name,
              billing_city: billingAddress.city,
              billing_state: billingAddress.state,
              billing_gstin: billingAddress.gstin || "",
              billing_cycle: billingCycle,
            } : undefined,
            theme: {
              color: "#6366f1",
            },
          };

          const rzp = new window.Razorpay(options);
          rzp.on("payment.failed", () => {
            toast({
              title: "Payment Failed",
              description: "Please try again or use a different payment method.",
              variant: "destructive",
            });
            resolve({ success: false });
          });
          rzp.open();
        });
      } catch (error) {
        console.error("Payment initiation error:", error);
        toast({
          title: "Payment Error",
          description: error instanceof Error ? error.message : "Failed to initiate payment",
          variant: "destructive",
        });
        return { success: false };
      } finally {
        setIsLoading(false);
      }
    },
    [loadRazorpayScript, toast]
  );

  return {
    initiatePayment,
    isLoading,
    planConfig: {
      pro: { amount: PLAN_PRICES.pro.monthly, description: "CHRONYX Pro" },
      premium: { amount: PLAN_PRICES.premium.monthly, description: "CHRONYX Premium" },
    },
    planPrices: PLAN_PRICES,
  };
};
