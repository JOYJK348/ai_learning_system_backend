const apiKey = 're_V5p2A8ut_GbJhRskkQSLksEV72NAvVbD8';

async function run() {
  console.log('Sending test email via Resend...');
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ZHI LearnAI <onboarding@joyautomations.in>",
        to: "joyjk348@gmail.com",
        subject: "ZHI LearnAI - Test Approval Email",
        html: "<p>If you see this, email sending works!</p>",
      }),
    });

    const data = await res.json().catch(() => ({}));
    console.log('Response Status:', res.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

run();
