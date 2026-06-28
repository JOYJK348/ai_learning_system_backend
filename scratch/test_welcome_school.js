const fs = require("fs");
const path = require("path");

if (fs.existsSync(".env")) {
  fs.readFileSync(".env", "utf8").split("\n").forEach(l => {
    const p = l.split("=");
    if (p.length >= 2) process.env[p[0].trim()] = p.slice(1).join("=").trim();
  });
}

// Inline the welcome email HTML generation code directly using the exact structure as email.ts
const PORTAL_URL = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
const FROM_ONBOARDING = "ZHI LearnAI <onboarding@joyautomations.in>";
const FOOTER_LINE = "ZHI LearnAI Singapore · © 2026. All rights reserved.";
const DISCLAIMER = "This is a system-generated notification. Please do not reply directly to this message.";

function buildEmail(title, bodyContent) {
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
      .creds-table { width:100%; border:1px solid #e2e8f0; border-radius:3px; overflow:hidden; margin:24px 0; }
      .creds-table td { padding:14px 18px; border-bottom:1px solid #f1f5f9; vertical-align:top; }
      .creds-table td:last-child { border-bottom:none; }
      .creds-table .td-lbl { width:38%; }
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

async function sendSchoolWelcome(params) {
  const apiKey = process.env.RESEND_API_KEY;
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

  const htmlContent = buildEmail("ZHI LearnAI — School Portal Activation", body);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ONBOARDING,
      to: params.adminEmail,
      subject: "ZHI LearnAI — School Portal Activation Confirmed",
      html: htmlContent,
    }),
  });
  const data = await res.json();
  console.log("Resend Direct Status:", res.status);
  console.log("Resend Direct Data:", data);
}

sendSchoolWelcome({
  adminEmail: "bharathidev20@gmail.com",
  adminName: "Test Principal",
  adminUsername: "admin.testschool@zhi.app",
  adminPass: "Zhi@Test2026",
  schoolName: "Test Kids Academy",
  schoolCode: "ZHI-TEST-999"
});
