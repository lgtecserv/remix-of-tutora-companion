import { createAPIFileRoute } from "@tanstack/react-start/api";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhookSignature } from "@/lib/zumbopay";

export const APIRoute = createAPIFileRoute("/api/webhooks/zumbopay-tutor")({
  POST: async ({ request }) => {
    try {
      // ── Verify HMAC-SHA256 signature (SECURITY FIX — was missing before!) ──
      const signature = request.headers.get("x-zumbopay-signature");
      const secret = process.env.ZUMBOPAY_TUTOR_WEBHOOK_SECRET || process.env.ZUMBOPAY_WEBHOOK_SECRET;

      if (!signature || !secret) {
        return new Response(
          JSON.stringify({ error: "Missing signature or secret" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const bodyText = await request.text();

      if (!verifyWebhookSignature(signature, bodyText, secret)) {
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      // ── Parse payload ─────────────────────────────────────────────
      const payload = JSON.parse(bodyText);
      const event = payload.event;
      const data = payload.data;
      const reference = data?.reference;

      if (!reference) {
        return new Response(
          JSON.stringify({ error: "Missing reference" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        { auth: { persistSession: false } }
      );

      // ── Handle payment.succeeded ──────────────────────────────────
      if (event === "payment.succeeded") {
        const { data: app, error: fetchError } = await supabaseAdmin
          .from("tutor_applications")
          .select("id, user_id")
          .eq("reference", reference)
          .eq("status", "pending")
          .maybeSingle();

        if (fetchError) {
          console.error("Error fetching tutor application:", fetchError);
        }

        if (app) {
          // Update application status to paid
          await supabaseAdmin
            .from("tutor_applications")
            .update({ status: "paid" })
            .eq("id", app.id);

          // Create the wallet for the tutor
          await supabaseAdmin
            .from("tutor_wallet")
            .insert({ tutor_id: app.user_id });
        }
      }

      return new Response(
        JSON.stringify({ received: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      console.error("ZumboPay Tutor Webhook Error:", err);
      return new Response(
        JSON.stringify({ error: "Webhook Error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
});
