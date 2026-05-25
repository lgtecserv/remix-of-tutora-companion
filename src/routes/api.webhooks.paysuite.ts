import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { verifyWebhookSignature } from "@/lib/paysuite";

export const Route = createFileRoute("/api/webhooks/paysuite")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const signature = request.headers.get("x-webhook-signature");
          const secret = process.env.PAYSUITE_WEBHOOK_SECRET;

          if (!signature || !secret) {
            return new Response(JSON.stringify({ error: "Missing signature or secret" }), { status: 400 });
          }

          const bodyText = await request.text();
          
          if (!verifyWebhookSignature(signature, bodyText, secret)) {
            return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
          }

          const payload = JSON.parse(bodyText);
          const event = payload.event;
          const data = payload.data;
          // Note: PaySuite uses reference as the unique identifier we sent
          const reference = data.reference;

          if (!reference) {
            return new Response(JSON.stringify({ error: "Missing reference" }), { status: 400 });
          }

          if (event === "payment.success") {
            // Find the pending payment
            const { data: payment, error: paymentError } = await supabaseAdmin
              .from("payments")
              .select("id, user_id, course_id, status")
              .eq("reference", reference)
              .single();

            if (paymentError || !payment) {
              return new Response(JSON.stringify({ error: "Payment not found" }), { status: 404 });
            }

            if (payment.status !== "pending") {
              return new Response(JSON.stringify({ message: "Payment already processed" }), { status: 200 });
            }

            // Update payment status
            await supabaseAdmin
              .from("payments")
              .update({ status: "approved" })
              .eq("id", payment.id);

            // Enroll user
            await supabaseAdmin
              .from("enrollments")
              .insert({
                user_id: payment.user_id,
                course_id: payment.course_id,
              });

          } else if (event === "payment.failed") {
            // Update payment status to rejected
            await supabaseAdmin
              .from("payments")
              .update({ status: "rejected" })
              .eq("reference", reference);
          }

          return new Response(JSON.stringify({ success: true }), { 
            status: 200, 
            headers: { "Content-Type": "application/json" } 
          });
        } catch (err: any) {
          console.error("Webhook processing error:", err);
          return new Response(JSON.stringify({ error: err.message }), { status: 500 });
        }
      },
    },
  },
});
