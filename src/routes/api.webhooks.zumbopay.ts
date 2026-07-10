import { createAPIFileRoute } from "@tanstack/react-start/api";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhookSignature } from "@/lib/zumbopay";

export const APIRoute = createAPIFileRoute("/api/webhooks/zumbopay")({
  POST: async ({ request }) => {
    try {
      // ── Verify HMAC-SHA256 signature ──────────────────────────────
      const signature = request.headers.get("x-zumbopay-signature");
      const secret = process.env.ZUMBOPAY_WEBHOOK_SECRET;

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
        // Find the pending payment by ZumboPay reference
        const { data: payment, error: paymentError } = await supabaseAdmin
          .from("payments")
          .select("id, user_id, course_id, ebook_id, status, amount_mzn, affiliate_id, order_bump_ebook_id")
          .eq("reference", reference)
          .single();

        if (paymentError || !payment) {
          console.error("Payment not found for reference:", reference);
          return new Response(
            JSON.stringify({ error: "Payment not found" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }

        if (payment.status !== "pending") {
          return new Response(
            JSON.stringify({ message: "Payment already processed" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        // Update payment status to approved
        await supabaseAdmin
          .from("payments")
          .update({ status: "approved" })
          .eq("id", payment.id);

        let tutorId: string | null = null;

        // ── Handle Course Purchase ──
        if (payment.course_id) {
          await supabaseAdmin
            .from("enrollments")
            .insert({
              user_id: payment.user_id,
              course_id: payment.course_id,
            });

          const { data: course } = await supabaseAdmin
            .from("courses")
            .select("tutor_id")
            .eq("id", payment.course_id)
            .single();
          tutorId = course?.tutor_id || null;
        } 
        // ── Handle E-book Purchase ──
        else if (payment.ebook_id) {
          const purchases = [{ user_id: payment.user_id, ebook_id: payment.ebook_id }];
          
          if (payment.order_bump_ebook_id) {
            purchases.push({ user_id: payment.user_id, ebook_id: payment.order_bump_ebook_id });
          }

          await supabaseAdmin.from("ebook_purchases").insert(purchases);

          const { data: ebook } = await supabaseAdmin
            .from("ebooks")
            .select("author_id, affiliate_percentage, coproducer_id, coproducer_percentage")
            .eq("id", payment.ebook_id)
            .single();
            
          tutorId = ebook?.author_id || null;
          
          // Store ebook details for revenue split
          (payment as any).ebookDetails = ebook;
        }

        // ── Handle Revenue Split ──
        if (tutorId) {
          const netAmount = payment.amount_mzn * 0.92; // After 8% ZumboPay fee
          
          let affiliateShare = 0;
          let coproducerShare = 0;
          let authorShare = 0;
          
          const ebookDetails = (payment as any).ebookDetails;

          // 1. Calculate Affiliate Share
          if (payment.affiliate_id && ebookDetails?.affiliate_percentage) {
            affiliateShare = netAmount * (ebookDetails.affiliate_percentage / 100);
          }
          
          const remainingForProducers = netAmount - affiliateShare;

          // 2. Calculate Coproducer Share
          if (ebookDetails?.coproducer_id && ebookDetails?.coproducer_percentage) {
            coproducerShare = remainingForProducers * (ebookDetails.coproducer_percentage / 100);
          }

          // 3. The rest goes to the primary Author
          authorShare = remainingForProducers - coproducerShare;

          // Helper function to add funds to a wallet
          const addFundsToWallet = async (userId: string, amount: number) => {
            const { data: wallet } = await supabaseAdmin
              .from("tutor_wallet")
              .select("balance, total_earned")
              .eq("tutor_id", userId)
              .maybeSingle();

            if (wallet) {
              await supabaseAdmin.from("tutor_wallet").update({
                balance: Number(wallet.balance) + amount,
                total_earned: Number(wallet.total_earned) + amount,
              }).eq("tutor_id", userId);
            } else {
              // If user is just an affiliate and has no wallet yet
              await supabaseAdmin.from("tutor_wallet").insert({
                tutor_id: userId,
                balance: amount,
                total_earned: amount,
              });
            }
          };

          // Execute splits
          if (authorShare > 0) await addFundsToWallet(tutorId, authorShare);
          if (coproducerShare > 0 && ebookDetails.coproducer_id) await addFundsToWallet(ebookDetails.coproducer_id, coproducerShare);
          if (affiliateShare > 0 && payment.affiliate_id) await addFundsToWallet(payment.affiliate_id, affiliateShare);
        }

      // ── Handle payment.failed ─────────────────────────────────────
      } else if (event === "payment.failed") {
        await supabaseAdmin
          .from("payments")
          .update({ status: "rejected" })
          .eq("reference", reference);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      console.error("ZumboPay Webhook Error:", err);
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
});
