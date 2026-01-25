import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  ShoppingCart, 
  IndianRupee, 
  User, 
  BookOpen, 
  Loader2,
  CheckCircle2,
  Lock,
  CreditCard
} from "lucide-react";

interface ContentPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    id: string;
    title: string;
    author: string | null;
    price: number;
    cover_url: string | null;
    user_id: string;
  };
  onPurchaseComplete: () => void;
}

export const ContentPurchaseDialog = ({
  open,
  onOpenChange,
  item,
  onPurchaseComplete
}: ContentPurchaseDialogProps) => {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);

  const commissionPercent = item.price >= 500 ? 5 : 10;
  const commissionAmount = (item.price * commissionPercent) / 100;
  const creatorPayout = item.price - commissionAmount;

  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
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

  const handlePurchase = async () => {
    if (!user) {
      toast.error("Please sign in to purchase");
      return;
    }

    setProcessing(true);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load payment gateway");
      }

      // Create order via edge function
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        "create-razorpay-order",
        {
          body: {
            amount: item.price,
            currency: "INR",
            notes: {
              content_id: item.id,
              content_type: 'library_item',
              buyer_id: user.id,
              creator_id: item.user_id
            }
          },
        }
      );

      if (orderError || !orderData) {
        throw new Error(orderError?.message || "Failed to create order");
      }

      const { orderId, keyId, amount, currency } = orderData;

      // Initialize Razorpay
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'Chronyx Knowledge Hub',
        description: `Purchase: ${item.title}`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            // Record the purchase
            const { error } = await supabase
              .from('content_purchases')
              .insert({
                buyer_id: user.id,
                content_id: item.id,
                content_type: 'library_item',
                creator_id: item.user_id,
                amount: item.price,
                commission_percent: commissionPercent,
                commission_amount: commissionAmount,
                creator_payout_amount: creatorPayout,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                status: 'completed'
              });

            if (error) throw error;

            toast.success("Purchase successful! You can now access this content.");
            onPurchaseComplete();
            onOpenChange(false);
          } catch (error) {
            console.error("Error recording purchase:", error);
            toast.error("Payment recorded but failed to save. Contact support.");
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          email: user.email
        },
        theme: {
          color: '#6366f1'
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Error processing purchase:", error);
      toast.error("Failed to process purchase");
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Purchase Content
          </DialogTitle>
          <DialogDescription>
            Complete your purchase to access this content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Content Preview */}
          <div className="flex gap-4 p-4 rounded-lg bg-muted/50">
            <div className="w-20 h-28 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
              {item.cover_url ? (
                <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <BookOpen className="w-8 h-8 text-primary/40" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground line-clamp-2">{item.title}</h4>
              {item.author && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <User className="w-3 h-3" />
                  {item.author}
                </p>
              )}
              <Badge className="mt-2 bg-emerald-500 text-white">
                <IndianRupee className="w-3 h-3 mr-0.5" />
                {item.price}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Price Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Content Price</span>
              <span>₹{item.price}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Platform Fee ({commissionPercent}%)</span>
              <span>-₹{commissionAmount.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Creator Receives</span>
              <span className="text-emerald-600">₹{creatorPayout.toFixed(0)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span className="text-lg">₹{item.price}</span>
            </div>
          </div>

          {/* Benefits */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
            <p className="text-sm font-medium text-foreground">What you get:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Lifetime access to this content
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Read online or offline
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Highlights & notes sync
              </li>
            </ul>
          </div>

          {/* Purchase Button */}
          <Button 
            onClick={handlePurchase} 
            disabled={processing}
            className="w-full"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay ₹{item.price}
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            Secure payment via Razorpay
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};