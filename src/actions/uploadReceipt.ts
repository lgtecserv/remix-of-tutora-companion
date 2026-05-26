import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const uploadPaymentReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { paymentId: string; receiptUrl: string }) => data)
  .handler(async ({ data, context }) => {
    const { paymentId, receiptUrl } = data;
    const { supabase, userId } = context;

    // Verify payment belongs to user and is pending
    const { data: payment, error: fetchError } = await supabase
      .from("payments")
      .select("id, status")
      .eq("id", paymentId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !payment) {
      throw new Error("Pagamento não encontrado.");
    }

    if (payment.status !== "pending") {
      throw new Error("Este pagamento já não está pendente.");
    }

    // Update receipt URL
    const { error: updateError } = await supabase
      .from("payments")
      .update({ receipt_url: receiptUrl }) // NOTE: requires DB schema update
      .eq("id", paymentId);

    if (updateError) {
      throw new Error("Falha ao anexar comprovativo. Verifique se a coluna 'receipt_url' foi criada.");
    }

    return { success: true };
  });
