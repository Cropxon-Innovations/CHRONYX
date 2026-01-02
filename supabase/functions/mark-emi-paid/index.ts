import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MarkEmiPaidRequest {
  emi_id: string;
  paid_date: string;
  payment_method: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: MarkEmiPaidRequest = await req.json();
    const { emi_id, paid_date, payment_method } = body;

    console.log(`Marking EMI ${emi_id} as paid`);

    // Fetch EMI to validate
    const { data: emi, error: fetchError } = await supabase
      .from("emi_schedule")
      .select("*, loans(user_id)")
      .eq("id", emi_id)
      .single();

    if (fetchError || !emi) {
      throw new Error("EMI not found");
    }

    if (emi.payment_status === "Paid") {
      throw new Error("EMI is already marked as paid");
    }

    // Update EMI status
    const { error: updateError } = await supabase
      .from("emi_schedule")
      .update({
        payment_status: "Paid",
        paid_date,
        payment_method,
      })
      .eq("id", emi_id);

    if (updateError) {
      throw updateError;
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: emi.loans?.user_id,
      module: "loans",
      action: `EMI #${emi.emi_month} marked as paid. Amount: ₹${emi.emi_amount.toLocaleString()}, Method: ${payment_method}`,
    });

    console.log(`EMI ${emi_id} marked as paid successfully`);

    return new Response(
      JSON.stringify({
        status: "paid",
        emi_month: emi.emi_month,
        amount: emi.emi_amount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
