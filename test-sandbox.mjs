import { readFileSync } from "fs";

async function testUrl(url, key) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        amount: 100,
        reference: "TEST-123",
        description: "Teste",
      })
    });
    const data = await res.json();
    console.log(url, "=>", data);
  } catch(e) {
    console.log(url, "=> FAILED", e.message);
  }
}

try {
  const envContent = readFileSync(".env", "utf-8");
  const lines = envContent.split("\n");
  for (const line of lines) {
    if (line.startsWith("PAYSUITE_API_KEY=")) {
      const key = line.replace("PAYSUITE_API_KEY=", "").trim();
      
      const urls = [
        "https://sandbox.paysuite.co.mz/api/v1/payments",
        "https://sandbox.paysuite.tech/api/v1/payments",
        "https://api.paysuite.co.mz/sandbox/v1/payments",
        "https://api.paysuite.tech/sandbox/v1/payments",
        "https://api.sandbox.paysuite.tech/v1/payments"
      ];
      
      for (const u of urls) {
        await testUrl(u, key);
      }
    }
  }
} catch(e) {
  console.log("Error reading .env", e);
}
