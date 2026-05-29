import { readFileSync } from "fs";

try {
  const envContent = readFileSync(".env", "utf-8");
  const lines = envContent.split("\n");
  for (const line of lines) {
    if (line.startsWith("PAYSUITE_API_KEY=")) {
      const key = line.replace("PAYSUITE_API_KEY=", "").trim();
      console.log("Found API Key length:", key.length);
      console.log("Starts with:", key.substring(0, 5));
      
      // Let's test the request directly
      fetch("https://paysuite.tech/api/v1/payments", {
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
      }).then(r => r.json()).then(data => {
        console.log("PaySuite API Response:", data);
      }).catch(e => console.error("Fetch Error:", e));
    }
  }
} catch(e) {
  console.log("Error reading .env", e);
}
