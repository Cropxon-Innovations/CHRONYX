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
  billingCycle: "monthly" | "annual";
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

const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const generateInvoiceHTML = (data: {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  customerGstin?: string;
  plan: string;
  amount: number;
  billingCycle: "monthly" | "annual";
  paymentId: string;
  planStartDate: string;
  planEndDate: string;
}) => {
  const planDetails = {
    pro: { 
      name: "CHRONYX Pro", 
      description: data.billingCycle === "annual" ? "Annual Subscription" : "Monthly Subscription",
      features: [
        "10GB Memory Storage",
        "Advanced Financial Analytics", 
        "Unlimited Tax Calculations",
        "Unlimited TAXYN AI Assistant",
        "FinanceFlow Gmail Import",
        "Priority Support"
      ] 
    },
    premium: { 
      name: "CHRONYX Premium", 
      description: data.billingCycle === "annual" ? "Annual Subscription" : "Monthly Subscription",
      features: [
        "100GB Memory Storage",
        "All Pro Features",
        "Advanced AI Insights", 
        "Family Profiles",
        "CA Consultation Credits",
        "Direct Founder Support"
      ] 
    },
  };

  const planInfo = planDetails[data.plan as keyof typeof planDetails] || planDetails.pro;
  
  // Calculate tax breakdown (18% GST inclusive)
  const taxableAmount = Math.round(data.amount / 1.18);
  const gstAmount = data.amount - taxableAmount;
  const cgst = Math.round(gstAmount / 2);
  const sgst = gstAmount - cgst;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Invoice ${data.invoiceNumber} - CHRONYX</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f7;">
    <tr>
      <td align="center" style="padding: 48px 24px;">
        
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); padding: 48px 48px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size: 32px; font-weight: 200; letter-spacing: 12px; color: #ffffff; margin-bottom: 6px;">CHRONYX</div>
                    <div style="font-size: 11px; color: rgba(255,255,255,0.5); letter-spacing: 3px; text-transform: uppercase;">by ORIGINX LABS PVT. LTD.</div>
                  </td>
                  <td align="right">
                    <div style="background: rgba(255,255,255,0.1); padding: 16px 24px; border-radius: 12px; backdrop-filter: blur(10px);">
                      <div style="font-size: 10px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Invoice</div>
                      <div style="font-size: 15px; color: #ffffff; font-weight: 600;">${data.invoiceNumber}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Invoice Meta -->
          <tr>
            <td style="padding: 40px 48px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" valign="top">
                    <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">Billed To</div>
                    <div style="font-size: 17px; color: #0f172a; font-weight: 600; margin-bottom: 6px;">${data.customerName}</div>
                    <div style="font-size: 13px; color: #64748b; line-height: 1.7;">${data.customerAddress}</div>
                    <div style="font-size: 13px; color: #64748b; margin-top: 8px;">${data.customerEmail}</div>
                    ${data.customerGstin ? `<div style="font-size: 12px; color: #64748b; margin-top: 8px; font-family: monospace;">GSTIN: ${data.customerGstin}</div>` : ''}
                  </td>
                  <td width="50%" valign="top" align="right">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">Invoice Date</div>
                          <div style="font-size: 14px; color: #0f172a; font-weight: 500;">${data.date}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">Plan Period</div>
                          <div style="font-size: 14px; color: #0f172a; font-weight: 500;">${data.planStartDate} — ${data.planEndDate}</div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">Billing Cycle</div>
                          <div style="font-size: 14px; color: #0f172a; font-weight: 500;">${data.billingCycle === "annual" ? "Annual (Yearly)" : "Monthly"}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 32px 48px;">
              <div style="height: 1px; background: linear-gradient(90deg, transparent, #e2e8f0, transparent);"></div>
            </td>
          </tr>

          <!-- Line Items -->
          <tr>
            <td style="padding: 0 48px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #f1f5f9; border-radius: 16px; overflow: hidden;">
                <tr style="background: #f8fafc;">
                  <td style="padding: 16px 24px; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Description</td>
                  <td style="padding: 16px 24px; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; text-align: right;">Amount</td>
                </tr>
                <tr>
                  <td style="padding: 28px 24px; border-top: 1px solid #f1f5f9;">
                    <div style="font-size: 17px; color: #0f172a; font-weight: 600; margin-bottom: 6px;">${planInfo.name}</div>
                    <div style="font-size: 13px; color: #64748b; margin-bottom: 16px;">${planInfo.description}</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                      ${planInfo.features.map(f => `
                        <span style="display: inline-block; padding: 6px 12px; background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border-radius: 100px; font-size: 11px; color: #0369a1; font-weight: 500;">✓ ${f}</span>
                      `).join('')}
                    </div>
                  </td>
                  <td style="padding: 28px 24px; border-top: 1px solid #f1f5f9; text-align: right; vertical-align: top;">
                    <div style="font-size: 18px; color: #0f172a; font-weight: 700;">${formatINR(taxableAmount)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Tax Breakdown -->
          <tr>
            <td style="padding: 32px 48px 0;">
              <table width="300" cellpadding="0" cellspacing="0" align="right">
                <tr>
                  <td style="padding: 10px 0; font-size: 14px; color: #64748b;">Subtotal</td>
                  <td style="padding: 10px 0; font-size: 14px; color: #0f172a; text-align: right; font-weight: 500;">${formatINR(taxableAmount)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 14px; color: #64748b;">CGST @ 9%</td>
                  <td style="padding: 10px 0; font-size: 14px; color: #0f172a; text-align: right; font-weight: 500;">${formatINR(cgst)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 14px; color: #64748b;">SGST @ 9%</td>
                  <td style="padding: 10px 0; font-size: 14px; color: #0f172a; text-align: right; font-weight: 500;">${formatINR(sgst)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 16px 0 0;">
                    <div style="height: 2px; background: #0f172a;"></div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 0; font-size: 16px; color: #0f172a; font-weight: 700;">Total Amount</td>
                  <td style="padding: 20px 0; font-size: 22px; color: #0f172a; text-align: right; font-weight: 700;">${formatINR(data.amount)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Payment Success -->
          <tr>
            <td style="padding: 40px 48px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #dcfce7, #d1fae5); border-radius: 16px; padding: 28px;">
                <tr>
                  <td align="center">
                    <div style="width: 56px; height: 56px; background: #10b981; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                      <span style="color: #ffffff; font-size: 28px;">✓</span>
                    </div>
                    <div style="font-size: 18px; color: #047857; font-weight: 600; margin-bottom: 8px;">Payment Successful</div>
                    <div style="font-size: 13px; color: #059669;">Transaction ID: ${data.paymentId}</div>
                    <div style="font-size: 12px; color: #10b981; margin-top: 12px;">Your ${planInfo.name} subscription is now active!</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8fafc; padding: 40px 48px; border-top: 1px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="font-size: 14px; color: #0f172a; font-weight: 500; margin-bottom: 8px;">Thank you for choosing CHRONYX!</div>
                    <div style="font-size: 13px; color: #64748b; margin-bottom: 20px;">Your subscription is valid from ${data.planStartDate} to ${data.planEndDate}</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">
                      For support, contact us at <a href="mailto:support@getchronyx.com" style="color: #0f172a; text-decoration: none; font-weight: 500;">support@getchronyx.com</a>
                    </div>
                    <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                      <div style="font-size: 11px; color: #94a3b8; letter-spacing: 2px;">ORIGINX LABS PVT. LTD.</div>
                      <div style="font-size: 10px; color: #cbd5e1; margin-top: 4px;">
                        <a href="https://www.originxlabs.com" style="color: #94a3b8; text-decoration: none;">www.originxlabs.com</a>
                      </div>
                    </div>
                    <div style="font-size: 10px; color: #cbd5e1; margin-top: 20px;">
                      This is a computer-generated invoice and does not require a physical signature.
                    </div>
                  </td>
                </tr>
              </table>
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

    const { paymentId, orderId, plan, amount, billingCycle = "monthly", billingAddress, email }: InvoiceRequest = await req.json();

    console.log("Generating invoice for payment:", paymentId, "Plan:", plan, "Cycle:", billingCycle);

    // Generate invoice number
    const { data: invoiceData, error: invoiceError } = await supabase.rpc('generate_invoice_number');
    
    if (invoiceError) {
      console.error("Error generating invoice number:", invoiceError);
    }

    const invoiceNumber = invoiceData || `CHRX-${Date.now()}`;

    // Calculate plan dates
    const now = new Date();
    const planStartDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    
    const endDate = new Date(now);
    if (billingCycle === "annual") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    const planEndDate = endDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    // Store payment record with billing info
    const authHeader = req.headers.get("Authorization");
    let userId = null;
    
    if (authHeader) {
      const { data: userData } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = userData.user?.id;
    }

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
      user_id: userId,
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
      date: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
      customerName: billingAddress.full_name,
      customerEmail: email,
      customerAddress,
      customerGstin: billingAddress.gstin,
      plan,
      amount,
      billingCycle,
      paymentId,
      planStartDate,
      planEndDate,
    });

    // Determine sender - use verified domain if available, otherwise use Resend's test domain
    const sender = "CHRONYX <invoices@getchronyx.com>";

    // Send email
    const emailResponse = await resend.emails.send({
      from: sender,
      to: [email],
      subject: `Invoice ${invoiceNumber} - CHRONYX ${plan === 'premium' ? 'Premium' : 'Pro'} ${billingCycle === "annual" ? "Annual" : "Monthly"} Subscription`,
      html: invoiceHTML,
    });

    console.log("Invoice email sent:", emailResponse);

    // Update invoice_sent_at
    if (!insertError) {
      await supabase
        .from("payment_records")
        .update({ invoice_sent_at: new Date().toISOString() })
        .eq("razorpay_payment_id", paymentId);
    }

    return new Response(
      JSON.stringify({
        success: !emailResponse.error,
        invoiceNumber,
        message: emailResponse.error ? `Email failed: ${emailResponse.error.message}` : "Invoice sent successfully",
        planStartDate,
        planEndDate,
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
