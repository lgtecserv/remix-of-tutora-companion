import { createPaymentRequest } from "./src/lib/paysuite";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  try {
    console.log("Testing PaySuite...");
    const res = await createPaymentRequest({
      amount: "100.00",
      reference: "test-" + Date.now(),
      description: "Teste PaySuite",
      return_url: "http://localhost:3000",
      callback_url: "http://localhost:3000/api/webhooks/paysuite"
    });
    console.log("Success:", res);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

test();
