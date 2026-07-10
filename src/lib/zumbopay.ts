import crypto from "crypto";

const ZUMBOPAY_API_URL = "https://zumbopay.com/api/public/v1";

// ── Types ────────────────────────────────────────────────────────────

/** Payload for POST /payments (hosted checkout — supports all methods) */
export interface PaymentLinkPayload {
  title: string;
  amount: number;
  currency?: string;
  channels?: ("mpesa" | "emola" | "card" | "mkesh")[];
  wallet_id: string;
  description?: string;
  max_uses?: number;
  expires_at?: string;
}

/** Payload for POST /charges (STK push — M-Pesa / e-Mola only, no redirect) */
export interface ChargePayload {
  wallet_id: string;
  amount: number;
  msisdn: string;
  customer_name?: string;
  source_id?: string;
}

export interface ZumboPayResponse {
  data?: {
    id: string;
    reference: string;
    slug?: string;
    title?: string;
    amount: number;
    currency: string;
    status: string;
    checkout_url?: string;
    channel?: string;
    code?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ── Helpers ──────────────────────────────────────────────────────────

function getHeaders(): Record<string, string> {
  const apiKey = process.env.ZUMBOPAY_API_KEY?.trim();
  const merchantId = process.env.ZUMBOPAY_MERCHANT_ID?.trim();

  if (!apiKey) {
    throw new Error("ZUMBOPAY_API_KEY is not defined in environment variables.");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (merchantId) {
    headers["X-Merchant-Id"] = merchantId;
  }

  return headers;
}

// ── Payment Link (Hosted Checkout) ───────────────────────────────────

/**
 * Creates a hosted checkout link via POST /payments.
 * Supports M-Pesa, e-Mola, mKesh and Visa/Mastercard (3DS).
 * Returns a `checkout_url` to redirect the customer to.
 */
export async function createPaymentLink(
  payload: PaymentLinkPayload
): Promise<ZumboPayResponse> {
  const walletId = payload.wallet_id || process.env.ZUMBOPAY_WALLET_ID?.trim();

  if (!walletId) {
    throw new Error(
      "wallet_id is required. Set ZUMBOPAY_WALLET_ID in env or pass it in the payload."
    );
  }

  const body = {
    ...payload,
    wallet_id: walletId,
    currency: payload.currency || "MZN",
    channels: payload.channels || ["mpesa", "emola", "card"],
  };

  const response = await fetch(`${ZUMBOPAY_API_URL}/payments`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg =
      data?.error?.message || data?.message || "Failed to create payment link on ZumboPay.";
    throw new Error(errorMsg);
  }

  return data;
}

// ── STK Push (Direct Charge) ─────────────────────────────────────────

/**
 * Sends an STK push directly to the customer's phone via POST /charges.
 * Only M-Pesa (84/85) and e-Mola (86/87) — channel is inferred by number prefix.
 * Does NOT support card payments.
 */
export async function createCharge(
  payload: ChargePayload
): Promise<ZumboPayResponse> {
  const walletId = payload.wallet_id || process.env.ZUMBOPAY_WALLET_ID?.trim();

  if (!walletId) {
    throw new Error("wallet_id is required for charges.");
  }

  const body = {
    ...payload,
    wallet_id: walletId,
  };

  const response = await fetch(`${ZUMBOPAY_API_URL}/charges`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg =
      data?.error?.message || data?.message || "Failed to create charge on ZumboPay.";
    throw new Error(errorMsg);
  }

  return data;
}

// ── Webhook Signature Verification ───────────────────────────────────

/**
 * Verifies the HMAC-SHA256 signature from ZumboPay webhooks.
 * Header: `x-zumbopay-signature`
 */
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
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    );
  } catch {
    return false;
  }
}
