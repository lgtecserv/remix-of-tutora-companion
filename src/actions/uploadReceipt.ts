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
      .eq("reference", paymentId) // paymentId here is actually the reference string
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
      .update({ receipt_url: receiptUrl } as any) // NOTE: requires DB schema update if missing from types
      .eq("id", payment.id);

    if (updateError) {
      throw new Error("Falha ao anexar comprovativo. Verifique se a coluna 'receipt_url' foi criada.");
    }

    return { success: true };
  });
