const fs = require("fs");
const path = require("path");

if (fs.existsSync(".env")) {
  fs.readFileSync(".env", "utf8").split("\n").forEach(l => {
    const p = l.split("=");
    if (p.length >= 2) process.env[p[0].trim()] = p.slice(1).join("=").trim();
  });
}

// Read email.ts content manually and execute the function using dynamic evaluation or direct module load
const emailModulePath = path.join(__dirname, "../dist/lib/email.js");
// Or we can just import the compiled version if it exists
// Let's check if dist exists, or let's create a pure JS direct sender using fetch and the exact HTML templates.
console.log("Checking if backend dist compiled file exists...");
const distExists = fs.existsSync(emailModulePath);
console.log("dist/lib/email.js exists:", distExists);

// Let's write a small script that fetches to Resend directly using the exact same code
async function directSendWelcome() {
  const apiKey = process.env.RESEND_API_KEY;
  console.log("API KEY:", apiKey ? apiKey.substring(0, 10) + "..." : "undefined");
  
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "ZHI LearnAI <onboarding@joyautomations.in>",
      to: "bharathidev20@gmail.com",
      subject: "Test Welcome Email",
      html: "<h1>ZHI LearnAI</h1><p>Test</p>"
    })
  });
  const data = await response.json();
  console.log("Response status:", response.status);
  console.log("Response data:", data);
}

directSendWelcome();
