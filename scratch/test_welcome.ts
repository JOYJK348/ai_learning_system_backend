import { sendSchoolWelcomeEmail } from "../src/lib/email";
import * as fs from "fs";

if (fs.existsSync(".env")) {
  fs.readFileSync(".env", "utf8").split("\n").forEach(l => {
    const p = l.split("=");
    if (p.length >= 2) process.env[p[0].trim()] = p.slice(1).join("=").trim();
  });
}

console.log("Starting test email dispatch...");
sendSchoolWelcomeEmail({
  adminEmail: "bharathidev20@gmail.com",
  adminName: "Test Principal",
  adminUsername: "admin.testschool@zhi.app",
  adminPass: "Zhi@Test2026",
  schoolName: "Test Kids Academy",
  schoolCode: "ZHI-TEST-999"
}).then(r => {
  console.log("RESULT IS:", r);
}).catch(e => {
  console.error("ERROR OCCURRED:", e);
});
