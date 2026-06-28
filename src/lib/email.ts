// ─────────────────────────────────────────────────────────────────────────────
// ZHI LearnAI — Email Utility Library
// All emails share the same professional corporate design system.
// From: joyautomations.in  |  API: Resend
// ─────────────────────────────────────────────────────────────────────────────

const PORTAL_URL = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
const FROM_ONBOARDING = "ZHI LearnAI <onboarding@joyautomations.in>";
const FROM_SECURITY = "ZHI LearnAI <security@joyautomations.in>";
const FROM_BILLING = "ZHI LearnAI <billing@joyautomations.in>";
const FROM_ALERTS = "ZHI LearnAI <alerts@joyautomations.in>";
const FOOTER_LINE = "ZHI LearnAI Singapore · © 2026. All rights reserved.";
const DISCLAIMER = "This is a system-generated notification. Please do not reply directly to this message.";

// ─── Shared HTML Shell ────────────────────────────────────────────────────────
function buildEmail(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
      body { margin:0; padding:0; background:#f5f5f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; color:#1e293b; -webkit-font-smoothing:antialiased; }
      table { border-collapse:collapse; }
      .wrap { max-width:600px; margin:40px auto; }
      .card { background:#ffffff; border:1px solid #e2e8f0; border-radius:3px; overflow:hidden; }
      .header { padding:36px 44px 28px; border-bottom:1px solid #f1f5f9; }
      .logo { font-size:17px; font-weight:800; letter-spacing:2.5px; text-transform:uppercase; color:#12312f; margin:0; }
      .logo span { color:#16a085; }
      .body { padding:44px; }
      h1.title { font-size:21px; font-weight:600; color:#0f172a; margin:0 0 14px; letter-spacing:-0.02em; }
      p.intro { font-size:14.5px; line-height:1.7; color:#475569; margin:0 0 36px; }
      .divider { height:1px; background:#f1f5f9; margin:36px 0; }
      .label-block { margin-bottom:18px; }
      .lbl { font-size:10.5px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:3px; }
      .val { font-size:13.5px; font-weight:600; color:#0f172a; font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace; }
      .section-head { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#64748b; margin:0 0 20px; }
      .step { margin-bottom:18px; }
      .step-num { font-size:10.5px; font-weight:700; color:#16a085; margin-bottom:3px; letter-spacing:0.5px; }
      .step-text { font-size:13.5px; line-height:1.55; color:#475569; }
      .step-text strong { color:#0f172a; }
      .btn { display:inline-block; background:#12312f; color:#ffffff !important; text-decoration:none; font-weight:700; font-size:11.5px; text-transform:uppercase; letter-spacing:1px; padding:13px 28px; border-radius:3px; margin-top:36px; }
      .alert-box { border-left:3px solid #dc2626; background:#fef2f2; padding:16px 20px; border-radius:0 3px 3px 0; margin:24px 0; }
      .alert-box p { margin:0; font-size:13.5px; line-height:1.6; color:#7f1d1d; }
      .info-box { border-left:3px solid #16a085; background:#f0fdf4; padding:16px 20px; border-radius:0 3px 3px 0; margin:24px 0; }
      .info-box p { margin:0; font-size:13.5px; line-height:1.6; color:#14532d; }
      .creds-table { width:100%; border:1px solid #e2e8f0; border-radius:3px; overflow:hidden; margin:24px 0; }
      .creds-table td { padding:14px 18px; border-bottom:1px solid #f1f5f9; vertical-align:top; }
      .creds-table td:last-child { border-bottom:none; }
      .creds-table .td-lbl { width:38%; }
      .metric-row { display:flex; gap:0; margin:20px 0; }
      .metric { flex:1; text-align:center; padding:16px 10px; border-right:1px solid #f1f5f9; }
      .metric:last-child { border-right:none; }
      .metric-num { font-size:22px; font-weight:700; color:#12312f; display:block; }
      .metric-lbl { font-size:10.5px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; margin-top:4px; display:block; }
      .footer { background:#fafafa; border-top:1px solid #f1f5f9; padding:24px 44px; }
      .footer p { font-size:11px; color:#94a3b8; line-height:1.6; margin:0; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="header">
          <div class="logo">ZHI <span>LearnAI</span></div>
        </div>
        <div class="body">
          ${bodyContent}
        </div>
        <div class="footer">
          <p>${DISCLAIMER}<br>${FOOTER_LINE}</p>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

// ─── Resend Dispatch Helper ───────────────────────────────────────────────────
async function dispatch(params: {
  from: string;
  to: string;
  subject: string;
  html: string;
  label: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(`RESEND_API_KEY missing — skipping [${params.label}]`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: params.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error(`Resend error [${params.label}]:`, data);
      return false;
    }
    console.log(`Email sent [${params.label}]:`, data.id);
    return true;
  } catch (err) {
    console.error(`Email dispatch failed [${params.label}]:`, err);
    return false;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. PARENT ONBOARDING APPROVED — Welcome & Credentials
// ═════════════════════════════════════════════════════════════════════════════
export async function sendWelcomeEmail(params: {
  parentEmail: string;
  parentName: string;
  parentPass: string;
  childName: string;
  childEmail: string;
  childPass: string;
}) {
  const body = `
    <h1 class="title">Account Activation</h1>
    <p class="intro">
      Dear ${params.parentName},<br><br>
      We are pleased to inform you that your onboarding request has been reviewed and approved.
      The access credentials for your household have been generated and are listed below.
    </p>

    <div class="section-head">Parent Control Panel</div>
    <table class="creds-table">
      <tr><td class="td-lbl"><div class="lbl">Username</div></td><td><div class="val">${params.parentEmail}</div></td></tr>
      <tr><td class="td-lbl"><div class="lbl">Temporary Password</div></td><td><div class="val">${params.parentPass}</div></td></tr>
    </table>

    <div class="section-head" style="margin-top:28px;">Student Learning Space — ${params.childName}</div>
    <table class="creds-table">
      <tr><td class="td-lbl"><div class="lbl">Student ID</div></td><td><div class="val">${params.childEmail}</div></td></tr>
      <tr><td class="td-lbl"><div class="lbl">Temporary Password</div></td><td><div class="val">${params.childPass}</div></td></tr>
    </table>

    <div class="divider"></div>
    <div class="section-head">Activation Steps</div>

    <div class="step"><div class="step-num">01 / PORTAL ACCESS</div>
      <div class="step-text">Navigate to the portal and sign in using your <strong>Parent Control Panel</strong> credentials to review your account settings.</div>
    </div>
    <div class="step"><div class="step-num">02 / COURSE SETTINGS</div>
      <div class="step-text">Configure course preferences and review initial assessments from the parent dashboard.</div>
    </div>
    <div class="step"><div class="step-num">03 / STUDENT LOGIN</div>
      <div class="step-text">Have your child sign in using the <strong>Student ID</strong> to begin their personalised learning journey.</div>
    </div>

    <a href="${PORTAL_URL}/login" class="btn">Launch Parent Portal</a>
  `;
  return dispatch({
    from: FROM_ONBOARDING,
    to: params.parentEmail,
    subject: "ZHI LearnAI — Account Activation Confirmed",
    html: buildEmail("ZHI LearnAI — Account Activation", body),
    label: "parent-welcome",
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. SCHOOL ONBOARDING APPROVED — Welcome & Portal Credentials
// ═════════════════════════════════════════════════════════════════════════════
export async function sendSchoolWelcomeEmail(params: {
  adminEmail: string;
  adminName: string;
  adminUsername: string;
  adminPass: string;
  schoolName: string;
  schoolCode: string;
}) {
  const body = `
    <h1 class="title">School Portal Activation</h1>
    <p class="intro">
      Dear ${params.adminName},<br><br>
      We are pleased to inform you that the onboarding request for <strong>${params.schoolName}</strong> has been reviewed and approved.
      Your institution's portal has been configured and your administrator credentials are provided below.
    </p>

    <div class="section-head">School Administrator Credentials</div>
    <table class="creds-table">
      <tr><td class="td-lbl"><div class="lbl">School Code</div></td><td><div class="val">${params.schoolCode}</div></td></tr>
      <tr><td class="td-lbl"><div class="lbl">System Username</div></td><td><div class="val">${params.adminUsername}</div></td></tr>
      <tr><td class="td-lbl"><div class="lbl">Temporary Password</div></td><td><div class="val">${params.adminPass}</div></td></tr>
    </table>

    <div class="divider"></div>
    <div class="section-head">Onboarding Steps</div>

    <div class="step"><div class="step-num">01 / PORTAL LOGIN</div>
      <div class="step-text">Navigate to the administrator portal and sign in using your <strong>System Username</strong> and <strong>Temporary Password</strong> above.</div>
    </div>
    <div class="step"><div class="step-num">02 / CONFIGURE CLASSROOMS</div>
      <div class="step-text">From your school admin dashboard, configure classroom sections, grades, and assign teachers to each class.</div>
    </div>
    <div class="step"><div class="step-num">03 / DISTRIBUTE STUDENT IDs</div>
      <div class="step-text">Use the bulk upload or manual enrol feature to register students. Use the export function to share individual student login credentials.</div>
    </div>

    <a href="${PORTAL_URL}/login" class="btn">Launch School Dashboard</a>
  `;
  return dispatch({
    from: FROM_ONBOARDING,
    to: params.adminEmail,
    subject: "ZHI LearnAI — School Portal Activation Confirmed",
    html: buildEmail("ZHI LearnAI — School Portal Activation", body),
    label: "school-welcome",
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. REGISTRATION RECEIVED — School (pending review confirmation)
// ═════════════════════════════════════════════════════════════════════════════
export async function sendSchoolRegistrationReceivedEmail(params: {
  adminEmail: string;
  adminName: string;
  schoolName: string;
}) {
  const body = `
    <h1 class="title">Registration Under Review</h1>
    <p class="intro">
      Dear ${params.adminName},<br><br>
      Thank you for submitting the onboarding request for <strong>${params.schoolName}</strong>.
      We have received your application and our verification team is currently reviewing the details.
    </p>

    <div class="info-box">
      <p>Your institution will receive full portal access once the verification process is complete. This typically takes <strong>1–2 business days</strong>.</p>
    </div>

    <div class="divider"></div>
    <div class="section-head">What Happens Next</div>

    <div class="step"><div class="step-num">01 / DOCUMENT REVIEW</div>
      <div class="step-text">Our team will verify the institution's registration details and contact information on file.</div>
    </div>
    <div class="step"><div class="step-num">02 / APPROVAL NOTIFICATION</div>
      <div class="step-text">You will receive an email at this address with your portal access credentials once approved.</div>
    </div>
    <div class="step"><div class="step-num">03 / PORTAL ONBOARDING</div>
      <div class="step-text">Following approval, you may log in and begin configuring classrooms and enrolling students immediately.</div>
    </div>

    <p style="font-size:13.5px;color:#475569;margin-top:36px;line-height:1.6;">
      If you have not received a response within 2 business days, please contact our support team at
      <a href="mailto:support@joyautomations.in" style="color:#16a085;">support@joyautomations.in</a>.
    </p>
  `;
  return dispatch({
    from: FROM_ONBOARDING,
    to: params.adminEmail,
    subject: "ZHI LearnAI — School Registration Received",
    html: buildEmail("ZHI LearnAI — Registration Received", body),
    label: "school-registration-received",
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. REGISTRATION RECEIVED — Parent (pending review confirmation)
// ═════════════════════════════════════════════════════════════════════════════
export async function sendParentRegistrationReceivedEmail(params: {
  parentEmail: string;
  parentName: string;
  childName: string;
}) {
  const body = `
    <h1 class="title">Registration Under Review</h1>
    <p class="intro">
      Dear ${params.parentName},<br><br>
      Thank you for registering with ZHI LearnAI. We have received your enrolment request for
      <strong>${params.childName}</strong> and our team is currently reviewing the details.
    </p>

    <div class="info-box">
      <p>Once the review is complete, you will receive a follow-up email with your account credentials and activation instructions. This typically takes <strong>1–2 business days</strong>.</p>
    </div>

    <div class="divider"></div>
    <div class="section-head">What Happens Next</div>

    <div class="step"><div class="step-num">01 / REVIEW</div>
      <div class="step-text">Our team reviews the enrolment request and verifies the submitted details.</div>
    </div>
    <div class="step"><div class="step-num">02 / ACCOUNT CREATION</div>
      <div class="step-text">Upon approval, your parent account and your child's student learning profile will be created.</div>
    </div>
    <div class="step"><div class="step-num">03 / CREDENTIALS EMAIL</div>
      <div class="step-text">You will receive login credentials at this email address to activate your accounts and begin learning.</div>
    </div>

    <p style="font-size:13.5px;color:#475569;margin-top:36px;line-height:1.6;">
      For queries, please write to us at
      <a href="mailto:support@joyautomations.in" style="color:#16a085;">support@joyautomations.in</a>.
    </p>
  `;
  return dispatch({
    from: FROM_ONBOARDING,
    to: params.parentEmail,
    subject: "ZHI LearnAI — Registration Received",
    html: buildEmail("ZHI LearnAI — Registration Received", body),
    label: "parent-registration-received",
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. REGISTRATION REJECTED — School
// ═════════════════════════════════════════════════════════════════════════════
export async function sendSchoolRejectionEmail(params: {
  adminEmail: string;
  adminName: string;
  schoolName: string;
  reason?: string;
}) {
  const body = `
    <h1 class="title">Registration Not Approved</h1>
    <p class="intro">
      Dear ${params.adminName},<br><br>
      We regret to inform you that the onboarding request submitted for <strong>${params.schoolName}</strong>
      could not be approved at this time following our review.
    </p>

    ${params.reason ? `
    <div class="alert-box">
      <p><strong>Reason for rejection:</strong><br>${params.reason}</p>
    </div>` : `
    <div class="alert-box">
      <p>We were unable to verify the submitted institution details. Please ensure all information is accurate before reapplying.</p>
    </div>`}

    <div class="divider"></div>
    <div class="section-head">Next Steps</div>

    <div class="step"><div class="step-num">01 / REVIEW DETAILS</div>
      <div class="step-text">Review the reason cited above and ensure that your institution's registration details and documents are accurate and current.</div>
    </div>
    <div class="step"><div class="step-num">02 / RESUBMIT APPLICATION</div>
      <div class="step-text">Once the information has been corrected, please submit a new onboarding request through the registration portal.</div>
    </div>
    <div class="step"><div class="step-num">03 / CONTACT SUPPORT</div>
      <div class="step-text">If you believe this decision was made in error, please contact our support team with your institution details for further assistance.</div>
    </div>

    <p style="font-size:13.5px;color:#475569;margin-top:36px;line-height:1.6;">
      For assistance, please write to
      <a href="mailto:support@joyautomations.in" style="color:#16a085;">support@joyautomations.in</a>.
    </p>
  `;
  return dispatch({
    from: FROM_ONBOARDING,
    to: params.adminEmail,
    subject: "ZHI LearnAI — School Registration Update",
    html: buildEmail("ZHI LearnAI — Registration Update", body),
    label: "school-rejected",
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. REGISTRATION REJECTED — Parent
// ═════════════════════════════════════════════════════════════════════════════
export async function sendParentRejectionEmail(params: {
  parentEmail: string;
  parentName: string;
  childName: string;
  reason?: string;
}) {
  const body = `
    <h1 class="title">Registration Not Approved</h1>
    <p class="intro">
      Dear ${params.parentName},<br><br>
      We regret to inform you that the enrolment request submitted for <strong>${params.childName}</strong>
      could not be approved at this time following our review.
    </p>

    ${params.reason ? `
    <div class="alert-box">
      <p><strong>Reason for rejection:</strong><br>${params.reason}</p>
    </div>` : `
    <div class="alert-box">
      <p>We were unable to verify the submitted details. Please ensure all information is accurate before reapplying.</p>
    </div>`}

    <div class="divider"></div>
    <div class="section-head">Next Steps</div>

    <div class="step"><div class="step-num">01 / REVIEW YOUR DETAILS</div>
      <div class="step-text">Please review the reason cited above and verify that the information submitted in your registration is correct.</div>
    </div>
    <div class="step"><div class="step-num">02 / RESUBMIT</div>
      <div class="step-text">You are welcome to submit a new registration request once the details have been corrected.</div>
    </div>
    <div class="step"><div class="step-num">03 / CONTACT SUPPORT</div>
      <div class="step-text">If you require assistance or have questions regarding this decision, please reach out to our support team.</div>
    </div>

    <p style="font-size:13.5px;color:#475569;margin-top:36px;line-height:1.6;">
      Write to us at
      <a href="mailto:support@joyautomations.in" style="color:#16a085;">support@joyautomations.in</a>.
    </p>
  `;
  return dispatch({
    from: FROM_ONBOARDING,
    to: params.parentEmail,
    subject: "ZHI LearnAI — Registration Update",
    html: buildEmail("ZHI LearnAI — Registration Update", body),
    label: "parent-rejected",
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 7. PASSWORD RESET OTP
// ═════════════════════════════════════════════════════════════════════════════
export async function sendPasswordResetOtpEmail(params: {
  email: string;
  name: string;
  otp: string;
}) {
  const body = `
    <h1 class="title">Password Reset Request</h1>
    <p class="intro">
      Dear ${params.name},<br><br>
      We received a request to reset the password associated with this email address.
      Use the One-Time Password below to proceed. This code expires in <strong>10 minutes</strong>.
    </p>

    <table width="100%"><tr><td align="left">
      <div style="display:inline-block;font-size:30px;font-weight:800;letter-spacing:8px;color:#12312f;background:#f8fafc;border:1px solid #e2e8f0;padding:14px 28px;border-radius:3px;font-family:'SFMono-Regular',Consolas,monospace;">
        ${params.otp}
      </div>
    </td></tr></table>

    <p style="font-size:13px;line-height:1.6;color:#64748b;margin-top:28px;">
      If you did not initiate a password reset, please disregard this email. Your account remains secure.
      If you have concerns, contact <a href="mailto:security@joyautomations.in" style="color:#16a085;">security@joyautomations.in</a> immediately.
    </p>
  `;
  return dispatch({
    from: FROM_SECURITY,
    to: params.email,
    subject: "ZHI LearnAI — Password Reset OTP",
    html: buildEmail("ZHI LearnAI — Password Reset", body),
    label: "otp",
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 8. CHILD ACCOUNT LINKED (to existing parent)
// ═════════════════════════════════════════════════════════════════════════════
export async function sendChildLinkedEmail(params: {
  parentEmail: string;
  parentName: string;
  childName: string;
  childEmail: string;
  childPass: string;
}) {
  const body = `
    <h1 class="title">New Student Added</h1>
    <p class="intro">
      Dear ${params.parentName},<br><br>
      A new student profile for <strong>${params.childName}</strong> has been linked to your ZHI LearnAI parent account.
      You may manage their learning progress directly from your parent dashboard using your existing login credentials.
    </p>

    <div class="section-head">Student Login Credentials — ${params.childName}</div>
    <table class="creds-table">
      <tr><td class="td-lbl"><div class="lbl">Student ID</div></td><td><div class="val">${params.childEmail}</div></td></tr>
      <tr><td class="td-lbl"><div class="lbl">Temporary Password</div></td><td><div class="val">${params.childPass}</div></td></tr>
    </table>

    <p style="font-size:13px;color:#64748b;margin-top:24px;line-height:1.6;">
      Please ensure your child changes the temporary password upon first login.
    </p>

    <a href="${PORTAL_URL}/login" class="btn">Access Parent Dashboard</a>
  `;
  return dispatch({
    from: FROM_ONBOARDING,
    to: params.parentEmail,
    subject: "ZHI LearnAI — New Student Linked to Your Account",
    html: buildEmail("ZHI LearnAI — New Student Added", body),
    label: "child-linked",
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 9. PAYMENT SUCCESS — School Admin
// ═════════════════════════════════════════════════════════════════════════════
export async function sendSchoolPaymentSuccessEmail(params: {
  adminEmail: string;
  adminName: string;
  schoolName: string;
  planName: string;
  amount: string;
  currency: string;
  transactionId: string;
  billingDate: string;
  renewalDate: string;
}) {
  const body = `
    <h1 class="title">Payment Confirmed</h1>
    <p class="intro">
      Dear ${params.adminName},<br><br>
      Your payment has been successfully processed. The subscription for <strong>${params.schoolName}</strong>
      has been renewed and all student accounts remain fully active.
    </p>

    <div class="section-head">Transaction Details</div>
    <table class="creds-table">
      <tr><td class="td-lbl"><div class="lbl">Plan</div></td><td><div class="val">${params.planName}</div></td></tr>
      <tr><td class="td-lbl"><div class="lbl">Amount</div></td><td><div class="val">${params.currency} ${params.amount}</div></td></tr>
      <tr><td class="td-lbl"><div class="lbl">Transaction ID</div></td><td><div class="val">${params.transactionId}</div></td></tr>
      <tr><td class="td-lbl"><div class="lbl">Billing Date</div></td><td><div class="val">${params.billingDate}</div></td></tr>
      <tr><td class="td-lbl"><div class="lbl">Next Renewal</div></td><td><div class="val">${params.renewalDate}</div></td></tr>
    </table>

    <div class="info-box">
      <p>This serves as your official payment confirmation. Please retain this email for your institutional records.</p>
    </div>

    <a href="${PORTAL_URL}/login" class="btn">Access School Dashboard</a>
  `;
  return dispatch({
    from: FROM_BILLING,
    to: params.adminEmail,
    subject: `ZHI LearnAI — Payment Confirmed · ${params.currency} ${params.amount}`,
    html: buildEmail("ZHI LearnAI — Payment Confirmed", body),
    label: "school-payment-success",
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 10. PAYMENT SUCCESS — Individual Parent
// ═════════════════════════════════════════════════════════════════════════════
export async function sendParentPaymentSuccessEmail(params: {
  parentEmail: string;
  parentName: string;
  planName: string;
  amount: string;
  currency: string;
  transactionId: string;
  billingDate: string;
  renewalDate: string;
}) {
  const body = `
    <h1 class="title">Payment Confirmed</h1>
    <p class="intro">
      Dear ${params.parentName},<br><br>
      Your payment has been successfully processed. Your <strong>${params.planName}</strong> subscription
      is now active and your child's full learning access has been confirmed.
    </p>

    <div class="section-head">Transaction Details</div>
    <table class="creds-table">
      <tr><td class="td-lbl"><div class="lbl">Plan</div></td><td><div class="val">${params.planName}</div></td></tr>
      <tr><td class="td-lbl"><div class="lbl">Amount</div></td><td><div class="val">${params.currency} ${params.amount}</div></td></tr>
      <tr><td class="td-lbl"><div class="lbl">Transaction ID</div></td><td><div class="val">${params.transactionId}</div></td></tr>
      <tr><td class="td-lbl"><div class="lbl">Billing Date</div></td><td><div class="val">${params.billingDate}</div></td></tr>
      <tr><td class="td-lbl"><div class="lbl">Next Renewal</div></td><td><div class="val">${params.renewalDate}</div></td></tr>
    </table>

    <div class="info-box">
      <p>This serves as your official payment receipt. Please retain this email for your records.</p>
    </div>

    <a href="${PORTAL_URL}/login" class="btn">Access Parent Dashboard</a>
  `;
  return dispatch({
    from: FROM_BILLING,
    to: params.parentEmail,
    subject: `ZHI LearnAI — Payment Confirmed · ${params.currency} ${params.amount}`,
    html: buildEmail("ZHI LearnAI — Payment Confirmed", body),
    label: "parent-payment-success",
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 11. PAYMENT FAILED — School Admin
// ═════════════════════════════════════════════════════════════════════════════
export async function sendSchoolPaymentFailedEmail(params: {
  adminEmail: string;
  adminName: string;
  schoolName: string;
  planName: string;
  amount: string;
  currency: string;
  attemptDate: string;
}) {
  const body = `
    <h1 class="title">Payment Unsuccessful</h1>
    <p class="intro">
      Dear ${params.adminName},<br><br>
      We were unable to process the subscription renewal payment for <strong>${params.schoolName}</strong>.
      Please update your payment details to prevent disruption to student access.
    </p>

    <div class="alert-box">
      <p>
        <strong>Plan:</strong> ${params.planName}<br>
        <strong>Amount Due:</strong> ${params.currency} ${params.amount}<br>
        <strong>Failed On:</strong> ${params.attemptDate}
      </p>
    </div>

    <div class="divider"></div>
    <div class="section-head">Recommended Actions</div>

    <div class="step"><div class="step-num">01 / CHECK PAYMENT METHOD</div>
      <div class="step-text">Verify that your registered payment method has sufficient funds and has not expired.</div>
    </div>
    <div class="step"><div class="step-num">02 / RETRY PAYMENT</div>
      <div class="step-text">Log in to your school dashboard and navigate to Billing to retry the transaction with the same or a different method.</div>
    </div>
    <div class="step"><div class="step-num">03 / CONTACT SUPPORT</div>
      <div class="step-text">If the issue persists, please contact our billing support team immediately to avoid student account suspension.</div>
    </div>

    <a href="${PORTAL_URL}/login" class="btn">Retry Payment Now</a>

    <p style="font-size:13px;color:#64748b;margin-top:28px;line-height:1.6;">
      Billing support: <a href="mailto:billing@joyautomations.in" style="color:#16a085;">billing@joyautomations.in</a>
    </p>
  `;
  return dispatch({
    from: FROM_BILLING,
    to: params.adminEmail,
    subject: "ZHI LearnAI — Action Required: Payment Unsuccessful",
    html: buildEmail("ZHI LearnAI — Payment Unsuccessful", body),
    label: "school-payment-failed",
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 12. PAYMENT FAILED — Individual Parent
// ═════════════════════════════════════════════════════════════════════════════
export async function sendParentPaymentFailedEmail(params: {
  parentEmail: string;
  parentName: string;
  planName: string;
  amount: string;
  currency: string;
  attemptDate: string;
}) {
  const body = `
    <h1 class="title">Payment Unsuccessful</h1>
    <p class="intro">
      Dear ${params.parentName},<br><br>
      We were unable to process your subscription renewal for the <strong>${params.planName}</strong> plan.
      To maintain uninterrupted access to your child's learning programmes, please update your payment details.
    </p>

    <div class="alert-box">
      <p>
        <strong>Plan:</strong> ${params.planName}<br>
        <strong>Amount Due:</strong> ${params.currency} ${params.amount}<br>
        <strong>Failed On:</strong> ${params.attemptDate}
      </p>
    </div>

    <div class="divider"></div>
    <div class="section-head">What To Do</div>

    <div class="step"><div class="step-num">01 / CHECK PAYMENT METHOD</div>
      <div class="step-text">Ensure that your registered card or payment method is valid, not expired, and has sufficient balance.</div>
    </div>
    <div class="step"><div class="step-num">02 / RETRY PAYMENT</div>
      <div class="step-text">Log in to your parent dashboard and navigate to Upgrades &amp; Billing to retry or update your payment method.</div>
    </div>

    <a href="${PORTAL_URL}/login" class="btn">Retry Payment Now</a>

    <p style="font-size:13px;color:#64748b;margin-top:28px;line-height:1.6;">
      For billing assistance: <a href="mailto:billing@joyautomations.in" style="color:#16a085;">billing@joyautomations.in</a>
    </p>
  `;
  return dispatch({
    from: FROM_BILLING,
    to: params.parentEmail,
    subject: "ZHI LearnAI — Action Required: Payment Unsuccessful",
    html: buildEmail("ZHI LearnAI — Payment Unsuccessful", body),
    label: "parent-payment-failed",
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 13. PLAN EXPIRY REMINDER — School (3 days before)
// ═════════════════════════════════════════════════════════════════════════════
export async function sendSchoolExpiryReminderEmail(params: {
  adminEmail: string;
  adminName: string;
  schoolName: string;
  planName: string;
  expiryDate: string;
  studentCount: number;
  daysLeft: number;
}) {
  const body = `
    <h1 class="title">Subscription Expiring Soon</h1>
    <p class="intro">
      Dear ${params.adminName},<br><br>
      This is a reminder that the <strong>${params.planName}</strong> subscription for
      <strong>${params.schoolName}</strong> is scheduled to expire in <strong>${params.daysLeft} day${params.daysLeft !== 1 ? "s" : ""}</strong>,
      on <strong>${params.expiryDate}</strong>.
    </p>

    <div class="alert-box">
      <p>
        Upon expiry, access for all <strong>${params.studentCount} enrolled student${params.studentCount !== 1 ? "s" : ""}</strong> will be suspended
        until the subscription is renewed. We strongly recommend renewing before the expiry date to avoid disruption.
      </p>
    </div>

    <div class="divider"></div>
    <div class="section-head">Renewal Details</div>

    <table class="creds-table">
      <tr><td class="td-lbl"><div class="lbl">Current Plan</div></td><td><div class="val">${params.planName}</div></td></tr>
      <tr><td class="td-lbl"><div class="lbl">Expiry Date</div></td><td><div class="val">${params.expiryDate}</div></td></tr>
      <tr><td class="td-lbl"><div class="lbl">Students Enrolled</div></td><td><div class="val">${params.studentCount}</div></td></tr>
      <tr><td class="td-lbl"><div class="lbl">Days Remaining</div></td><td><div class="val">${params.daysLeft}</div></td></tr>
    </table>

    <a href="${PORTAL_URL}/login" class="btn">Renew Subscription Now</a>

    <p style="font-size:13px;color:#64748b;margin-top:28px;line-height:1.6;">
      For assistance with renewal, contact <a href="mailto:billing@joyautomations.in" style="color:#16a085;">billing@joyautomations.in</a>.
    </p>
  `;
  return dispatch({
    from: FROM_ALERTS,
    to: params.adminEmail,
    subject: `ZHI LearnAI — Subscription Expiring in ${params.daysLeft} Day${params.daysLeft !== 1 ? "s" : ""}`,
    html: buildEmail("ZHI LearnAI — Subscription Expiry Notice", body),
    label: "school-expiry-reminder",
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 14. PLAN EXPIRY REMINDER — Individual Parent (3 days before)
// ═════════════════════════════════════════════════════════════════════════════
export async function sendParentExpiryReminderEmail(params: {
  parentEmail: string;
  parentName: string;
  planName: string;
  expiryDate: string;
  daysLeft: number;
}) {
  const body = `
    <h1 class="title">Your Plan Is Expiring Soon</h1>
    <p class="intro">
      Dear ${params.parentName},<br><br>
      Your <strong>${params.planName}</strong> subscription will expire in <strong>${params.daysLeft} day${params.daysLeft !== 1 ? "s" : ""}</strong>,
      on <strong>${params.expiryDate}</strong>.
    </p>

    <div class="alert-box">
      <p>
        After expiry, your child's access to premium lessons, quizzes, and performance reports will be restricted.
        Please renew before the expiry date to avoid any interruption.
      </p>
    </div>

    <div class="divider"></div>
    <div class="section-head">Subscription Summary</div>

    <table class="creds-table">
      <tr><td class="td-lbl"><div class="lbl">Current Plan</div></td><td><div class="val">${params.planName}</div></td></tr>
      <tr><td class="td-lbl"><div class="lbl">Expiry Date</div></td><td><div class="val">${params.expiryDate}</div></td></tr>
      <tr><td class="td-lbl"><div class="lbl">Days Remaining</div></td><td><div class="val">${params.daysLeft}</div></td></tr>
    </table>

    <a href="${PORTAL_URL}/login" class="btn">Renew Now</a>
  `;
  return dispatch({
    from: FROM_ALERTS,
    to: params.parentEmail,
    subject: `ZHI LearnAI — Your Plan Expires in ${params.daysLeft} Day${params.daysLeft !== 1 ? "s" : ""}`,
    html: buildEmail("ZHI LearnAI — Plan Expiry Notice", body),
    label: "parent-expiry-reminder",
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 15. WEEKLY PROGRESS DIGEST — Parent (sent every Sunday)
//     For BOTH school-linked parents and individual parents.
// ═════════════════════════════════════════════════════════════════════════════
export async function sendWeeklyProgressDigestEmail(params: {
  parentEmail: string;
  parentName: string;
  childName: string;
  weekRange: string; // e.g. "23 Jun – 29 Jun 2026"
  lessonsCompleted: number;
  quizAvgScore: number;   // 0–100
  starsEarned: number;
  topSubject?: string;
  suggestedLesson?: string;
}) {
  const scoreLabel = params.quizAvgScore >= 80
    ? "Excellent performance this week."
    : params.quizAvgScore >= 60
    ? "Good progress — there is room to improve further."
    : "Further practice is recommended to strengthen understanding.";

  const body = `
    <h1 class="title">Weekly Progress Report</h1>
    <p class="intro">
      Dear ${params.parentName},<br><br>
      Here is a summary of <strong>${params.childName}'s</strong> learning activity for the week of <strong>${params.weekRange}</strong>.
    </p>

    <div class="section-head">Performance Summary</div>
    <table width="100%" style="border:1px solid #e2e8f0;border-radius:3px;overflow:hidden;margin:0 0 28px;">
      <tr>
        <td style="padding:20px 18px;border-right:1px solid #f1f5f9;text-align:center;width:33%;">
          <div style="font-size:26px;font-weight:700;color:#12312f;">${params.lessonsCompleted}</div>
          <div style="font-size:10.5px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">Lessons Completed</div>
        </td>
        <td style="padding:20px 18px;border-right:1px solid #f1f5f9;text-align:center;width:33%;">
          <div style="font-size:26px;font-weight:700;color:#12312f;">${params.quizAvgScore}%</div>
          <div style="font-size:10.5px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">Quiz Average</div>
        </td>
        <td style="padding:20px 18px;text-align:center;width:33%;">
          <div style="font-size:26px;font-weight:700;color:#12312f;">${params.starsEarned}</div>
          <div style="font-size:10.5px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">Stars Earned</div>
        </td>
      </tr>
    </table>

    <div class="info-box">
      <p>${scoreLabel}${params.topSubject ? ` <strong>${params.childName}</strong> performed best in <strong>${params.topSubject}</strong> this week.` : ""}</p>
    </div>

    ${params.suggestedLesson ? `
    <div class="divider"></div>
    <div class="section-head">Recommended For Next Week</div>
    <div class="step"><div class="step-num">SUGGESTED LESSON</div>
      <div class="step-text">${params.suggestedLesson}</div>
    </div>
    ` : ""}

    <a href="${PORTAL_URL}/login" class="btn">View Full Progress Report</a>

    <p style="font-size:12px;color:#94a3b8;margin-top:28px;line-height:1.6;">
      You are receiving this weekly digest because you have an active ZHI LearnAI parent account.
      To manage notification preferences, visit your dashboard settings.
    </p>
  `;
  return dispatch({
    from: FROM_ALERTS,
    to: params.parentEmail,
    subject: `ZHI LearnAI — ${params.childName}'s Weekly Progress Report`,
    html: buildEmail("ZHI LearnAI — Weekly Progress Report", body),
    label: "weekly-digest",
  });
}
