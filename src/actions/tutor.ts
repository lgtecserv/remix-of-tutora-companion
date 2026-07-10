import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createPaymentLink } from "@/lib/zumbopay";
import crypto from "crypto";

export const createTutorFeeSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { method?: "mpesa" | "emola" | "transferencia" }) => data)
  .handler(async ({ data, context }) => {
    const { method } = data;
    const { supabase, userId } = context;

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      { auth: { persistSession: false } }
    );

    // Verify if user is pending tutor fee
    const { data: application, error: appError } = await supabaseAdmin
      .from("tutor_applications")
      .select("id, status")
      .eq("user_id", userId)
      .single();

    if (appError || !application) {
      throw new Error("Candidatura a tutor não encontrada.");
    }

    if (application.status === "paid") {
      throw new Error("Taxa de adesão já paga.");
    }

    // Generate a unique reference
    const paymentId = crypto.randomUUID();
    const reference = paymentId.replace(/-/g, "");
    const amount = 500; // Fixed 500 MT fee
    const chosenMethod = method || "transferencia";

    // Update application with payment info
    const { error: updateError } = await supabaseAdmin
      .from("tutor_applications")
      .update({ payment_method: chosenMethod, reference })
      .eq("id", application.id);

    if (updateError) {
      throw new Error("Falha ao atualizar a candidatura.");
    }

    // For manual methods
    if (chosenMethod === "transferencia") {
      return {
        checkoutUrl: null,
        reference,
        method: chosenMethod,
        amount,
        manualPayment: true,
      };
    }

    // Try ZumboPay gateway
    try {
      const zumboRes = await createPaymentLink({
        title: "Taxa de adesão - Tutor Marketplace",
        amount,
        currency: "MZN",
        channels: ["mpesa", "emola", "card"],
        wallet_id: process.env.ZUMBOPAY_WALLET_ID || "",
        description: "Taxa de adesão - Tutor Marketplace",
      });

      // Update application with ZumboPay reference
      if (zumboRes.data?.reference) {
        await supabaseAdmin
          .from("tutor_applications")
          .update({ reference: zumboRes.data.reference })
          .eq("id", application.id);
      }

      return {
        checkoutUrl: zumboRes.data?.checkout_url,
        reference: zumboRes.data?.reference || reference,
        manualPayment: false,
      };
    } catch (error: any) {
      console.error("ZumboPay payment request failed for Tutor Fee:", error);
      return {
        checkoutUrl: null,
        reference,
        method: chosenMethod,
        amount: amount.toFixed(2),
        manualPayment: true,
        fallbackReason: error?.message || "Unknown ZumboPay error",
      };
    }
  });

export const submitTutorReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { receiptUrl: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { error } = await supabase
      .from("tutor_applications")
      .update({ receipt_url: data.receiptUrl, payment_method: "manual" })
      .eq("user_id", userId);

    if (error) throw new Error("Erro ao enviar comprovativo");
    return { success: true };
  });
