import { readFileSync } from "fs";
import crypto from "crypto";

async function testUrl(key) {
  try {
    const reference = crypto.randomUUID().replace(/-/g, "");
    
    const res = await fetch("https://paysuite.tech/api/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        amount: 100,
        reference: reference,
        description: "Teste",
        return_url: "http://localhost:3000/success",
        callback_url: "http://localhost:3000/webhook"
      })
    });
    const status = res.status;
    const data = await res.json();
    console.log("HTTP Status:", status);
    console.log("API Response:", data);
  } catch(e) {
    console.log("FAILED", e.message);
  }
}

try {
  const envContent = readFileSync(".env", "utf-8");
  const lines = envContent.split("\n");
  for (const line of lines) {
    if (line.startsWith("PAYSUITE_API_KEY=")) {
      const key = line.replace("PAYSUITE_API_KEY=", "").trim();
      testUrl(key);
    }
  }
} catch(e) {
  console.log("Error reading .env", e);
}
