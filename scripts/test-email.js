const fs = require('fs');
const path = require('path');

// Parse .env manually
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
      process.env[key] = val;
    }
  });
}

async function test() {
  const apiKey = process.env.RESEND_API_KEY;
  console.log('API Key:', apiKey ? 'Present (starts with ' + apiKey.slice(0, 5) + ')' : 'Missing');

  const emailHtml = `<p>Test welcome email</p>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ZHI LearnAI <onboarding@resend.dev>",
        to: "jayakumarfirstjune@gmail.com",
        subject: "Welcome to ZHI LearnAI - Account Approved!",
        html: emailHtml,
      }),
    });

    const data = await res.json().catch(() => ({}));
    console.log('Response Status:', res.status);
    console.log('Response Data:', data);
  } catch (err) {
    console.error("Failed to send welcome email:", err);
  }
}

test();
