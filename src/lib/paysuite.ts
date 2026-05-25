import crypto from "crypto";

const PAYSUITE_API_URL = "https://paysuite.tech/api/v1";

interface PaymentRequestPayload {
  amount: string;
  reference: string;
  description?: string;
  return_url?: string;
  callback_url?: string;
  method?: "credit_card" | "mpesa" | "emola";
}

interface PaymentRequestResponse {
  status: string;
  message?: string;
  data?: {
    id: string;
    amount: number;
    reference: string;
    status: string;
    checkout_url: string;
  };
}

export async function createPaymentRequest(
  payload: PaymentRequestPayload
): Promise<PaymentRequestResponse> {
  const apiKey = process.env.PAYSUITE_API_KEY;

  if (!apiKey) {
    throw new Error("PAYSUITE_API_KEY is not defined in environment variables.");
  }

  const response = await fetch(`${PAYSUITE_API_URL}/payments`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create payment request on PaySuite.");
  }

  return data;
}

export function verifyWebhookSignature(
  signature: string,
  payload: string,
  secret: string
): boolean {
  const calculatedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  try {
    // Use timingSafeEqual to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    );
  } catch (e) {
    return false;
  }
}
