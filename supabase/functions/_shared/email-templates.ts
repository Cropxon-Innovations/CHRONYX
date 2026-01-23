// CHRONYX Email Configuration
// Email Addresses by Purpose:
// - no-reply@getchronyx.com → Auth, OTP, System notifications
// - support@getchronyx.com  → User support, Help inquiries
// - contact@getchronyx.com  → Website forms, General contact
// - office@getchronyx.com   → Legal, Billing, Official communications

export const EMAIL_CONFIG = {
  // Sender addresses
  AUTH: "CHRONYX <no-reply@getchronyx.com>",
  SUPPORT: "CHRONYX Support <support@getchronyx.com>",
  CONTACT: "CHRONYX <contact@getchronyx.com>",
  BILLING: "CHRONYX Billing <office@getchronyx.com>",
  NOTIFICATIONS: "CHRONYX <no-reply@getchronyx.com>",
  
  // Fallback for development (Resend's default domain)
  DEV_SENDER: "CHRONYX <onboarding@resend.dev>",
  
  // URLs
  APP_URL: "https://chronyx.lovable.app",
  WEBSITE_URL: "https://getchronyx.com",
  ORIGINX_URL: "https://www.originxlabs.com",
  SUPPORT_EMAIL: "support@getchronyx.com",
};

// Standard email footer HTML
export const getEmailFooter = () => `
  <div style="padding: 24px 40px; background-color: #faf9f7; border-top: 1px solid #e8e6e3; text-align: center;">
    <p style="margin: 0 0 8px; font-size: 12px; color: #64748b;">
      This email was sent by <a href="${EMAIL_CONFIG.WEBSITE_URL}" style="color: #64748b; text-decoration: underline;">Chronyx</a> (getchronyx.com)
    </p>
    <p style="margin: 0 0 12px; font-size: 11px; color: #94a3b8;">
      For support, contact <a href="mailto:${EMAIL_CONFIG.SUPPORT_EMAIL}" style="color: #64748b; text-decoration: underline;">support@getchronyx.com</a>
    </p>
    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e8e6e3;">
      <p style="margin: 0 0 4px; font-size: 11px; color: #94a3b8; font-weight: 500;">
        CHRONYX by ORIGINX LABS PVT. LTD.
      </p>
      <p style="margin: 0; font-size: 10px; color: #94a3b8;">
        <a href="${EMAIL_CONFIG.ORIGINX_URL}" style="color: #94a3b8; text-decoration: underline;">www.originxlabs.com</a>
      </p>
    </div>
  </div>
`;

// Dark theme footer for weekly summaries
export const getDarkEmailFooter = () => `
  <div style="padding: 24px; text-align: center; border-top: 1px solid #2d2d44; background-color: #0f172a;">
    <p style="margin: 0 0 8px; font-size: 11px; color: #6b7280;">
      This email was sent by <a href="${EMAIL_CONFIG.WEBSITE_URL}" style="color: #9ca3af; text-decoration: underline;">Chronyx</a> (getchronyx.com)
    </p>
    <p style="margin: 0 0 12px; font-size: 10px; color: #4b5563;">
      For support, contact <a href="mailto:${EMAIL_CONFIG.SUPPORT_EMAIL}" style="color: #6b7280; text-decoration: underline;">support@getchronyx.com</a>
    </p>
    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #2d2d44;">
      <p style="margin: 0 0 4px; font-size: 10px; color: #4b5563; font-weight: 500;">
        CHRONYX by ORIGINX LABS PVT. LTD.
      </p>
      <p style="margin: 0; font-size: 9px; color: #374151;">
        <a href="${EMAIL_CONFIG.ORIGINX_URL}" style="color: #4b5563; text-decoration: underline;">www.originxlabs.com</a>
      </p>
    </div>
  </div>
`;

// Standard email header HTML
export const getEmailHeader = (title: string = "CHRONYX") => `
  <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px 40px; text-align: center;">
    <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 0.25em; color: #ffffff;">${title}</h1>
    <p style="margin: 8px 0 0; font-size: 10px; color: #94a3b8; letter-spacing: 0.15em;">A QUIET SPACE FOR YOUR LIFE</p>
  </div>
`;

// Compact email header
export const getCompactEmailHeader = () => `
  <div style="background: #0f172a; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px; letter-spacing: 4px; font-weight: 300;">CHRONYX</h1>
    <p style="color: #94a3b8; font-size: 10px; letter-spacing: 2px; margin-top: 4px;">BY ORIGINX LABS</p>
  </div>
`;

// Email button component
export const getEmailButton = (text: string, url: string, variant: "primary" | "secondary" = "primary") => {
  const styles = variant === "primary" 
    ? "background: linear-gradient(135deg, #1e293b, #0f172a); color: #ffffff; border: none;"
    : "background: transparent; color: #1e293b; border: 1px solid #e2e8f0;";
  
  return `
    <a href="${url}" style="display: inline-block; padding: 14px 32px; ${styles} text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500; letter-spacing: 0.05em;">
      ${text}
    </a>
  `;
};

// Info box component
export const getInfoBox = (content: string) => `
  <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0; border-left: 4px solid #64748b;">
    ${content}
  </div>
`;

// Get the appropriate sender based on email type and environment
export const getSender = (type: "auth" | "support" | "billing" | "notifications" | "contact", isDev: boolean = true) => {
  // In development, use Resend's default domain
  if (isDev) {
    return EMAIL_CONFIG.DEV_SENDER;
  }
  
  // In production, use proper email addresses
  switch (type) {
    case "auth":
      return EMAIL_CONFIG.AUTH;
    case "support":
      return EMAIL_CONFIG.SUPPORT;
    case "billing":
      return EMAIL_CONFIG.BILLING;
    case "contact":
      return EMAIL_CONFIG.CONTACT;
    case "notifications":
    default:
      return EMAIL_CONFIG.NOTIFICATIONS;
  }
};