import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: {
        id: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        method: string;
        description?: string;
        bank?: string;
        wallet?: string;
        vpa?: string;
        card_id?: string;
        card?: {
          last4?: string;
          network?: string;
          type?: string;
          issuer?: string;
        };
        notes?: Record<string, string>;
        error_code?: string;
        error_description?: string;
        error_reason?: string;
        created_at: number;
      };
    };
    refund?: {
      entity: {
        id: string;
        amount: number;
        currency: string;
        payment_id: string;
        notes?: Record<string, string>;
        status: string;
        created_at: number;
      };
    };
    order?: {
      entity: {
        id: string;
        amount: number;
        status: string;
        notes?: Record<string, string>;
      };
    };
  };
  created_at: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    
    console.log("Received Razorpay webhook event");
    
    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      const expectedSignature = createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");
      
      if (expectedSignature !== signature) {
        console.error("Webhook signature verification failed");
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Webhook signature verified successfully");
    } else {
      console.log("Webhook secret not configured, skipping signature verification");
    }
    
    const payload: RazorpayWebhookPayload = JSON.parse(body);
    const eventType = payload.event;
    const eventId = `${payload.event}_${payload.created_at}`;
    
    console.log(`Processing event: ${eventType}`);
    
    // Check if event already processed (idempotency)
    const { data: existingEvent } = await supabase
      .from("payment_events")
      .select("id")
      .eq("razorpay_event_id", eventId)
      .single();
    
    if (existingEvent) {
      console.log(`Event ${eventId} already processed, skipping`);
      return new Response(
        JSON.stringify({ status: "already_processed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Handle different event types
    switch (eventType) {
      case "payment.captured":
      case "payment.authorized": {
        const payment = payload.payload.payment?.entity;
        if (!payment) break;
        
        console.log(`Payment ${eventType}: ${payment.id}, amount: ${payment.amount}, order: ${payment.order_id}`);
        
        // Find existing payment history record by order_id
        const { data: paymentHistory, error: findError } = await supabase
          .from("payment_history")
          .select("id, subscription_id")
          .eq("razorpay_order_id", payment.order_id)
          .single();
        
        if (paymentHistory) {
          // Build payment method details
          const paymentMethodDetails: Record<string, unknown> = {};
          if (payment.card) {
            paymentMethodDetails.card_last4 = payment.card.last4;
            paymentMethodDetails.card_network = payment.card.network;
            paymentMethodDetails.card_type = payment.card.type;
            paymentMethodDetails.card_issuer = payment.card.issuer;
          }
          if (payment.bank) paymentMethodDetails.bank = payment.bank;
          if (payment.wallet) paymentMethodDetails.wallet = payment.wallet;
          if (payment.vpa) paymentMethodDetails.vpa = payment.vpa;
          
          // Update payment history
          const { error: updateError } = await supabase
            .from("payment_history")
            .update({
              status: eventType === "payment.captured" ? "captured" : "authorized",
              razorpay_payment_id: payment.id,
              payment_method: payment.method,
              payment_method_details: paymentMethodDetails,
              updated_at: new Date().toISOString(),
            })
            .eq("id", paymentHistory.id);
          
          if (updateError) {
            console.error("Error updating payment history:", updateError);
          } else {
            console.log(`Updated payment history ${paymentHistory.id}`);
          }
          
          // Update subscription status if linked
          if (paymentHistory.subscription_id && eventType === "payment.captured") {
            const { error: subError } = await supabase
              .from("subscriptions")
              .update({
                status: "active",
                updated_at: new Date().toISOString(),
              })
              .eq("id", paymentHistory.subscription_id);
            
            if (subError) {
              console.error("Error updating subscription:", subError);
            } else {
              console.log(`Activated subscription ${paymentHistory.subscription_id}`);
            }
          }
        } else {
          console.log(`No payment history found for order ${payment.order_id}`);
        }
        break;
      }
      
      case "payment.failed": {
        const payment = payload.payload.payment?.entity;
        if (!payment) break;
        
        console.log(`Payment failed: ${payment.id}, reason: ${payment.error_description}`);
        
        const { error: updateError } = await supabase
          .from("payment_history")
          .update({
            status: "failed",
            razorpay_payment_id: payment.id,
            failure_reason: payment.error_description || payment.error_reason || "Unknown error",
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_order_id", payment.order_id);
        
        if (updateError) {
          console.error("Error updating failed payment:", updateError);
        }
        break;
      }
      
      case "refund.created":
      case "refund.processed": {
        const refund = payload.payload.refund?.entity;
        if (!refund) break;
        
        console.log(`Refund ${eventType}: ${refund.id}, amount: ${refund.amount}, payment: ${refund.payment_id}`);
        
        const { error: updateError } = await supabase
          .from("payment_history")
          .update({
            refund_id: refund.id,
            refund_amount: refund.amount / 100, // Convert paise to rupees
            refunded_at: new Date().toISOString(),
            status: eventType === "refund.processed" ? "refunded" : "refund_pending",
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_payment_id", refund.payment_id);
        
        if (updateError) {
          console.error("Error updating refund:", updateError);
        }
        
        // Update subscription if refunded
        if (eventType === "refund.processed") {
          const { data: paymentRecord } = await supabase
            .from("payment_history")
            .select("subscription_id")
            .eq("razorpay_payment_id", refund.payment_id)
            .single();
          
          if (paymentRecord?.subscription_id) {
            await supabase
              .from("subscriptions")
              .update({
                status: "cancelled",
                cancelled_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", paymentRecord.subscription_id);
          }
        }
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }
    
    // Record the event for audit trail
    const { error: eventError } = await supabase
      .from("payment_events")
      .insert({
        razorpay_event_id: eventId,
        event_type: eventType,
        payload: payload,
        payment_history_id: null, // Can be linked if needed
        processed_at: new Date().toISOString(),
      });
    
    if (eventError) {
      console.error("Error recording payment event:", eventError);
    } else {
      console.log(`Recorded event ${eventId}`);
    }
    
    return new Response(
      JSON.stringify({ status: "processed", event: eventType }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
