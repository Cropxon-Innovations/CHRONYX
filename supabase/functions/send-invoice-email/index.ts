import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceRequest {
  paymentId: string;
  orderId: string;
  plan: string;
  amount: number;
  billingAddress: {
    full_name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
    gstin?: string;
  };
  email: string;
}

const generateInvoiceHTML = (data: {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerAddress: string;
  customerGstin?: string;
  plan: string;
  amount: number;
  paymentId: string;
}) => {
  const planDetails = {
    pro: { name: "CHRONYX Pro", description: "Monthly Subscription", features: ["Unlimited Tasks", "Finance Tracking", "Cloud Sync", "Priority Support"] },
    premium: { name: "CHRONYX Premium", description: "Monthly Subscription", features: ["All Pro Features", "AI Assistant", "Advanced Analytics", "Family Sharing", "Vault Access", "White-glove Support"] },
  };

  const planInfo = planDetails[data.plan as keyof typeof planDetails] || planDetails.pro;
  const taxableAmount = Math.round(data.amount / 1.18);
  const gstAmount = data.amount - taxableAmount;
  const cgst = Math.round(gstAmount / 2);
  const sgst = gstAmount - cgst;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - CHRONYX</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px; text-align: center;">
              <div style="display: inline-block; width: 60px; height: 60px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); margin-bottom: 16px;">
                <span style="font-size: 24px; line-height: 56px; color: #fff;">⏱</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 300; letter-spacing: 8px;">CHRONYX</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.6); font-size: 12px; letter-spacing: 2px;">by ORIGINX LABS</p>
            </td>
          </tr>

          <!-- Invoice Title -->
          <tr>
            <td style="padding: 40px 40px 20px;">
              <table width="100%">
                <tr>
                  <td>
                    <h2 style="margin: 0; color: #1a1a2e; font-size: 24px; font-weight: 600;">Tax Invoice</h2>
                    <p style="margin: 4px 0 0; color: #666; font-size: 14px;">${data.invoiceNumber}</p>
                  </td>
                  <td align="right">
                    <p style="margin: 0; color: #666; font-size: 13px;">Date</p>
                    <p style="margin: 4px 0 0; color: #1a1a2e; font-size: 15px; font-weight: 500;">${data.date}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Billing Details -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" style="background-color: #f9f9fb; border-radius: 12px; padding: 24px;">
                <tr>
                  <td width="50%" style="vertical-align: top; padding: 20px;">
                    <p style="margin: 0 0 8px; color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Bill To</p>
                    <p style="margin: 0; color: #1a1a2e; font-size: 16px; font-weight: 600;">${data.customerName}</p>
                    <p style="margin: 8px 0 0; color: #666; font-size: 13px; line-height: 1.6;">${data.customerAddress}</p>
                    ${data.customerGstin ? `<p style="margin: 12px 0 0; color: #666; font-size: 12px;"><strong>GSTIN:</strong> ${data.customerGstin}</p>` : ''}
                  </td>
                  <td width="50%" style="vertical-align: top; padding: 20px;">
                    <p style="margin: 0 0 8px; color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">From</p>
                    <p style="margin: 0; color: #1a1a2e; font-size: 16px; font-weight: 600;">ORIGINX LABS</p>
                    <p style="margin: 8px 0 0; color: #666; font-size: 13px; line-height: 1.6;">
                      Digital Services Provider<br>
                      India
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Line Items -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <tr style="background-color: #1a1a2e;">
                  <td style="padding: 16px 20px; color: #fff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-radius: 8px 0 0 0;">Description</td>
                  <td style="padding: 16px 20px; color: #fff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; text-align: right; border-radius: 0 8px 0 0;">Amount</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 20px;">
                    <p style="margin: 0; color: #1a1a2e; font-size: 15px; font-weight: 600;">${planInfo.name}</p>
                    <p style="margin: 4px 0 0; color: #666; font-size: 13px;">${planInfo.description}</p>
                    <div style="margin-top: 12px;">
                      ${planInfo.features.map(f => `<span style="display: inline-block; margin: 4px 8px 4px 0; padding: 4px 10px; background: #f0f0f5; border-radius: 20px; font-size: 11px; color: #666;">✓ ${f}</span>`).join('')}
                    </div>
                  </td>
                  <td style="padding: 20px; text-align: right; vertical-align: top;">
                    <p style="margin: 0; color: #1a1a2e; font-size: 16px; font-weight: 600;">₹${taxableAmount.toLocaleString('en-IN')}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Tax Breakdown -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" style="margin-left: auto; width: 280px;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 13px;">Subtotal</td>
                  <td style="padding: 8px 0; color: #1a1a2e; font-size: 13px; text-align: right;">₹${taxableAmount.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 13px;">CGST (9%)</td>
                  <td style="padding: 8px 0; color: #1a1a2e; font-size: 13px; text-align: right;">₹${cgst.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 13px;">SGST (9%)</td>
                  <td style="padding: 8px 0; color: #1a1a2e; font-size: 13px; text-align: right;">₹${sgst.toLocaleString('en-IN')}</td>
                </tr>
                <tr style="border-top: 2px solid #1a1a2e;">
                  <td style="padding: 16px 0 8px; color: #1a1a2e; font-size: 16px; font-weight: 700;">Total</td>
                  <td style="padding: 16px 0 8px; color: #1a1a2e; font-size: 20px; font-weight: 700; text-align: right;">₹${data.amount.toLocaleString('en-IN')}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Payment Confirmation -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <table width="100%" style="background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%); border-radius: 12px; padding: 20px;">
                <tr>
                  <td style="text-align: center;">
                    <div style="display: inline-block; width: 40px; height: 40px; background: #4caf50; border-radius: 50%; line-height: 40px;">
                      <span style="color: #fff; font-size: 20px;">✓</span>
                    </div>
                    <p style="margin: 12px 0 0; color: #2e7d32; font-size: 15px; font-weight: 600;">Payment Successful</p>
                    <p style="margin: 8px 0 0; color: #666; font-size: 12px;">Transaction ID: ${data.paymentId}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9fb; padding: 30px 40px; text-align: center;">
              <p style="margin: 0; color: #999; font-size: 12px; line-height: 1.8;">
                Thank you for subscribing to CHRONYX!<br>
                For support, contact us at <a href="mailto:support@originx.in" style="color: #1a1a2e;">support@originx.in</a>
              </p>
              <p style="margin: 20px 0 0; color: #ccc; font-size: 11px;">
                This is a computer-generated invoice and does not require a signature.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { paymentId, orderId, plan, amount, billingAddress, email }: InvoiceRequest = await req.json();

    console.log("Generating invoice for payment:", paymentId);

    // Generate invoice number
    const { data: invoiceData, error: invoiceError } = await supabase.rpc('generate_invoice_number');
    
    if (invoiceError) {
      console.error("Error generating invoice number:", invoiceError);
      throw new Error("Failed to generate invoice number");
    }

    const invoiceNumber = invoiceData || `CHRX-${Date.now()}`;

    // Store payment record with billing info
    const { error: insertError } = await supabase.from("payment_records").insert({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      amount,
      plan,
      invoice_number: invoiceNumber,
      billing_name: billingAddress.full_name,
      billing_address: [billingAddress.address_line1, billingAddress.address_line2].filter(Boolean).join(", "),
      billing_city: billingAddress.city,
      billing_state: billingAddress.state,
      billing_pincode: billingAddress.pincode,
      billing_gstin: billingAddress.gstin || null,
      user_id: (await supabase.auth.getUser(req.headers.get("Authorization")?.replace("Bearer ", "") || "")).data.user?.id,
    });

    if (insertError) {
      console.error("Error storing payment record:", insertError);
    }

    // Generate invoice email
    const customerAddress = [
      billingAddress.address_line1,
      billingAddress.address_line2,
      `${billingAddress.city}, ${billingAddress.state} - ${billingAddress.pincode}`,
      "India"
    ].filter(Boolean).join("<br>");

    const invoiceHTML = generateInvoiceHTML({
      invoiceNumber,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
      customerName: billingAddress.full_name,
      customerAddress,
      customerGstin: billingAddress.gstin,
      plan,
      amount,
      paymentId,
    });

    // Send email
    const emailResponse = await resend.emails.send({
      from: "CHRONYX <invoices@resend.dev>",
      to: [email],
      subject: `Invoice ${invoiceNumber} - CHRONYX ${plan === 'premium' ? 'Premium' : 'Pro'} Subscription`,
      html: invoiceHTML,
    });

    console.log("Invoice email sent:", emailResponse);

    // Update invoice_sent_at
    await supabase
      .from("payment_records")
      .update({ invoice_sent_at: new Date().toISOString() })
      .eq("razorpay_payment_id", paymentId);

    return new Response(
      JSON.stringify({
        success: true,
        invoiceNumber,
        message: "Invoice sent successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending invoice:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
