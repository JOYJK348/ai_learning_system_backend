export async function sendWelcomeEmail(params: {
  parentEmail: string;
  parentName: string;
  parentPass: string;
  childName: string;
  childEmail: string;
  childPass: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not defined. Skipping email sending.");
    return false;
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ZHI LearnAI - Account Activation</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #fafafa;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: #1e293b;
            -webkit-font-smoothing: antialiased;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border: 1px solid #eaeaea;
            border-radius: 4px;
            overflow: hidden;
          }
          .header {
            padding: 40px 40px 30px 40px;
            border-bottom: 1px solid #f1f5f9;
            text-align: left;
          }
          .logo {
            font-size: 18px;
            font-weight: 800;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #12312f;
            margin: 0;
          }
          .logo span {
            color: #16a085;
          }
          .body {
            padding: 40px;
          }
          .title {
            font-size: 22px;
            font-weight: 600;
            color: #0f172a;
            margin: 0 0 16px 0;
            letter-spacing: -0.02em;
          }
          .intro {
            font-size: 15px;
            line-height: 1.6;
            color: #475569;
            margin: 0 0 40px 0;
          }
          .credentials-grid {
            margin-bottom: 40px;
          }
          .credentials-column {
            width: 50%;
            vertical-align: top;
            padding-right: 20px;
          }
          .credentials-column:last-child {
            padding-right: 0;
            padding-left: 20px;
            border-left: 1px solid #f1f5f9;
          }
          .col-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #12312f;
            margin-bottom: 16px;
          }
          .field {
            margin-bottom: 12px;
          }
          .field-label {
            font-size: 11px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .field-value {
            font-size: 13.5px;
            font-weight: 600;
            color: #0f172a;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          }
          .divider {
            height: 1px;
            background-color: #f1f5f9;
            margin: 40px 0;
          }
          .section-subtitle {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
            margin-bottom: 24px;
          }
          .step-row {
            margin-bottom: 20px;
          }
          .step-num {
            font-size: 11px;
            font-weight: 700;
            color: #16a085;
            margin-bottom: 4px;
            letter-spacing: 0.5px;
          }
          .step-text {
            font-size: 13.5px;
            line-height: 1.5;
            color: #475569;
          }
          .step-text strong {
            color: #0f172a;
          }
          .cta-wrapper {
            text-align: left;
            margin-top: 40px;
          }
          .btn {
            display: inline-block;
            background-color: #12312f;
            color: #ffffff !important;
            text-decoration: none;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 14px 30px;
            border-radius: 4px;
          }
          .footer {
            background-color: #fafafa;
            border-top: 1px solid #f1f5f9;
            padding: 30px 40px;
            text-align: left;
          }
          .footer-text {
            font-size: 11px;
            color: #94a3b8;
            line-height: 1.6;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">ZHI <span>LearnAI</span></div>
          </div>
          
          <div class="body">
            <h1 class="title">Account Activation</h1>
            <p class="intro">
              We are pleased to inform you that your onboarding request has been approved. The access credentials for your household have been generated and configured.
            </p>
            
            <table class="credentials-grid">
              <tr>
                <td class="credentials-column">
                  <div class="col-title">Parent Control Panel</div>
                  <div class="field">
                    <div class="field-label">Username</div>
                    <div class="field-value">${params.parentEmail}</div>
                  </div>
                  <div class="field">
                    <div class="field-label">Temporary Password</div>
                    <div class="field-value">${params.parentPass}</div>
                  </div>
                </td>
                <td class="credentials-column">
                  <div class="col-title">Student Learning Space</div>
                  <div class="field">
                    <div class="field-label">Student ID</div>
                    <div class="field-value">${params.childEmail}</div>
                  </div>
                  <div class="field">
                    <div class="field-label">Temporary Password</div>
                    <div class="field-value">${params.childPass}</div>
                  </div>
                </td>
              </tr>
            </table>
            
            <div class="divider"></div>
            
            <div class="section-subtitle">Activation Steps</div>
            
            <div class="step-row">
              <div class="step-num">01 / PORTAL ACCESS</div>
              <div class="step-text">Navigate to the portal and log in using your <strong>Parent control panel</strong> credentials to verify registration information.</div>
            </div>
            
            <div class="step-row">
              <div class="step-num">02 / COURSE SETTINGS</div>
              <div class="step-text">Configure course preferences and view initial child assessments from the parent dashboard.</div>
            </div>
            
            <div class="step-row">
              <div class="step-num">03 / STUDENT PORTAL</div>
              <div class="step-text">Log in to the student space using the <strong>Student ID</strong> for the child (${params.childName}) to launch their learning journey.</div>
            </div>
            
            <div class="cta-wrapper">
              <a href="${process.env.FRONTEND_ORIGIN || 'http://localhost:3000'}/login" class="btn">Launch Portal</a>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">
              This is a system-generated notification. Please do not reply directly to this message.<br>
              ZHI LearnAI Singapore · &copy; 2026. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ZHI LearnAI <onboarding@resend.dev>",
        to: params.parentEmail,
        subject: "Welcome to ZHI LearnAI - Account Approved!",
        html: emailHtml,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Resend API error:", data);
      return false;
    }
    console.log("Welcome email sent successfully:", data.id);
    return true;
  } catch (err) {
    console.error("Failed to send welcome email:", err);
    return false;
  }
}

export async function sendSchoolWelcomeEmail(params: {
  adminEmail: string;
  adminName: string;
  adminUsername: string;
  adminPass: string;
  schoolName: string;
  schoolCode: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not defined. Skipping email sending.");
    return false;
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ZHI LearnAI - School Portal Activation</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #fafafa;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: #1e293b;
            -webkit-font-smoothing: antialiased;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border: 1px solid #eaeaea;
            border-radius: 4px;
            overflow: hidden;
          }
          .header {
            padding: 40px 40px 30px 40px;
            border-bottom: 1px solid #f1f5f9;
            text-align: left;
          }
          .logo {
            font-size: 18px;
            font-weight: 800;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #12312f;
            margin: 0;
          }
          .logo span {
            color: #16a085;
          }
          .body {
            padding: 40px;
          }
          .title {
            font-size: 22px;
            font-weight: 600;
            color: #0f172a;
            margin: 0 0 16px 0;
            letter-spacing: -0.02em;
          }
          .intro {
            font-size: 15px;
            line-height: 1.6;
            color: #475569;
            margin: 0 0 40px 0;
          }
          .credentials-grid {
            margin-bottom: 40px;
          }
          .credentials-column {
            width: 100%;
            vertical-align: top;
          }
          .col-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #12312f;
            margin-bottom: 16px;
          }
          .field {
            margin-bottom: 12px;
          }
          .field-label {
            font-size: 11px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .field-value {
            font-size: 13.5px;
            font-weight: 600;
            color: #0f172a;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          }
          .divider {
            height: 1px;
            background-color: #f1f5f9;
            margin: 40px 0;
          }
          .section-subtitle {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
            margin-bottom: 24px;
          }
          .step-row {
            margin-bottom: 20px;
          }
          .step-num {
            font-size: 11px;
            font-weight: 700;
            color: #16a085;
            margin-bottom: 4px;
            letter-spacing: 0.5px;
          }
          .step-text {
            font-size: 13.5px;
            line-height: 1.5;
            color: #475569;
          }
          .step-text strong {
            color: #0f172a;
          }
          .cta-wrapper {
            text-align: left;
            margin-top: 40px;
          }
          .btn {
            display: inline-block;
            background-color: #12312f;
            color: #ffffff !important;
            text-decoration: none;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 14px 30px;
            border-radius: 4px;
          }
          .footer {
            background-color: #fafafa;
            border-top: 1px solid #f1f5f9;
            padding: 30px 40px;
            text-align: left;
          }
          .footer-text {
            font-size: 11px;
            color: #94a3b8;
            line-height: 1.6;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">ZHI <span>LearnAI</span></div>
          </div>
          
          <div class="body">
            <h1 class="title">School Portal Activation</h1>
            <p class="intro">
              We are pleased to inform you that your school onboarding request has been approved. The access credentials for <strong>${params.schoolName}</strong> have been successfully configured.
            </p>
            
            <table class="credentials-grid">
              <tr>
                <td class="credentials-column">
                  <div class="col-title">School Administrator Credentials</div>
                  <div class="field">
                    <div class="field-label">School Code</div>
                    <div class="field-value">${params.schoolCode}</div>
                  </div>
                  <div class="field">
                    <div class="field-label">Username (System ID)</div>
                    <div class="field-value">${params.adminUsername}</div>
                  </div>
                  <div class="field">
                    <div class="field-label">Temporary Password</div>
                    <div class="field-value">${params.adminPass}</div>
                  </div>
                </td>
              </tr>
            </table>
            
            <div class="divider"></div>
            
            <div class="section-subtitle">Onboarding Steps</div>
            
            <div class="step-row">
              <div class="step-num">01 / SCHOOL PORTAL ACCESS</div>
              <div class="step-text">Navigate to the portal and log in using your <strong>Username</strong> and <strong>Password</strong> shown above.</div>
            </div>
            
            <div class="step-row">
              <div class="step-num">02 / SET UP CLASSES & TEACHERS</div>
              <div class="step-text">From your school admin dashboard, configure classrooms, student capacities, and assign teachers.</div>
            </div>
            
            <div class="step-row">
              <div class="step-num">03 / DISTRIBUTE STUDENT IDS</div>
              <div class="step-text">Use the bulk export feature to generate student ID credentials and distribute them to classrooms to start learning.</div>
            </div>
            
            <div class="cta-wrapper">
              <a href="${process.env.FRONTEND_ORIGIN || 'http://localhost:3000'}/login" class="btn">Launch School Dashboard</a>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">
              This is a system-generated notification. Please do not reply directly to this message.<br>
              ZHI LearnAI Singapore · &copy; 2026. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ZHI LearnAI <onboarding@resend.dev>",
        to: params.adminEmail,
        subject: "ZHI LearnAI - School Portal Approved!",
        html: emailHtml,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Resend API error:", data);
      return false;
    }
    console.log("School welcome email sent successfully:", data.id);
    return true;
  } catch (err) {
    console.error("Failed to send school welcome email:", err);
    return false;
  }
}

export async function sendPasswordResetOtpEmail(params: {
  email: string;
  name: string;
  otp: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not defined. Skipping OTP email sending.");
    return false;
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ZHI LearnAI - Reset Password OTP</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #fafafa;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: #1e293b;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border: 1px solid #eaeaea;
            border-radius: 4px;
            overflow: hidden;
          }
          .header {
            padding: 40px 40px 30px 40px;
            border-bottom: 1px solid #f1f5f9;
          }
          .logo {
            font-size: 18px;
            font-weight: 800;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #12312f;
            margin: 0;
          }
          .logo span {
            color: #16a085;
          }
          .body {
            padding: 40px;
          }
          .title {
            font-size: 22px;
            font-weight: 600;
            color: #0f172a;
            margin: 0 0 16px 0;
            letter-spacing: -0.02em;
          }
          .intro {
            font-size: 15px;
            line-height: 1.6;
            color: #475569;
            margin: 0 0 24px 0;
          }
          .otp-code {
            display: inline-block;
            font-size: 32px;
            font-weight: 800;
            letter-spacing: 6px;
            color: #16a085;
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            padding: 12px 24px;
            border-radius: 6px;
            margin: 16px 0 24px 0;
          }
          .warning {
            font-size: 13px;
            line-height: 1.5;
            color: #64748b;
            margin-top: 24px;
          }
          .footer {
            background-color: #fafafa;
            padding: 24px 40px;
            border-top: 1px solid #f1f5f9;
            text-align: center;
          }
          .footer-text {
            font-size: 12px;
            line-height: 1.5;
            color: #94a3b8;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">ZHI <span>LearnAI</span></h1>
          </div>
          <div class="body">
            <h2 class="title">Password Reset OTP</h2>
            <p class="intro">
              Hello ${params.name},<br><br>
              We received a request to reset your password. Use the following 6-digit One-Time Password (OTP) to proceed. This code is valid for 10 minutes.
            </p>
            <div class="otp-code">${params.otp}</div>
            <p class="warning">
              If you did not request a password reset, please ignore this email or contact support if you have security concerns.
            </p>
          </div>
          <div class="footer">
            <p class="footer-text">
              This is an automated security notification. Please do not reply directly.<br>
              ZHI LearnAI Singapore · &copy; 2026. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ZHI LearnAI <security@resend.dev>",
        to: params.email,
        subject: "ZHI LearnAI - Password Reset OTP",
        html: emailHtml,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Resend OTP error:", data);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    return false;
  }
}
