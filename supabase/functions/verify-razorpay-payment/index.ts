import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  plan: "pro" | "premium";
  userId: string;
  billingAddress?: {
    full_name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
    gstin?: string;
  };
  email?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      userId,
      billingAddress,
      email,
    } = (await req.json()) as PaymentVerification;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ error: "Missing payment verification parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keySecret) {
      return new Response(
        JSON.stringify({ error: "Payment service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("Signature verification failed");
      return new Response(
        JSON.stringify({ error: "Payment verification failed", verified: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Payment verified successfully - Create subscription
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const amountPaid = plan === 'pro' ? 199 : 499;
    const expiresAt = plan === 'premium' 
      ? null 
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    console.log(`Creating subscription for user ${userId}, plan: ${plan}`);

    // Create subscription record
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_type: plan,
        status: 'active',
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount_paid: amountPaid,
        currency: 'INR',
        started_at: new Date().toISOString(),
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (subError) {
      console.error("Error creating subscription:", subError);
      return new Response(
        JSON.stringify({ error: "Failed to create subscription", verified: true }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Subscription created: ${subscription.id}`);

    // Create payment history record
    const { error: historyError } = await supabase
      .from('payment_history')
      .insert({
        user_id: userId,
        subscription_id: subscription.id,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount: amountPaid,
        currency: 'INR',
        status: 'success',
        plan_type: plan,
      });

    if (historyError) {
      console.error("Error creating payment history:", historyError);
    }

    // Save billing address if provided
    if (billingAddress && userId) {
      const { error: addressError } = await supabase
        .from('billing_addresses')
        .upsert({
          user_id: userId,
          full_name: billingAddress.full_name,
          address_line1: billingAddress.address_line1,
          address_line2: billingAddress.address_line2 || null,
          city: billingAddress.city,
          state: billingAddress.state,
          pincode: billingAddress.pincode,
          gstin: billingAddress.gstin || null,
          is_default: true,
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false,
        });

      if (addressError) {
        console.error("Error saving billing address:", addressError);
      }
    }

    console.log(`Payment verified and subscription activated for user ${userId}, plan: ${plan}`);

    return new Response(
      JSON.stringify({
        verified: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        plan,
        subscriptionId: subscription.id,
        message: "Payment verified and subscription activated",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error verifying payment:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", verified: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});