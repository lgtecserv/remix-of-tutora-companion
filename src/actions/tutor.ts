import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import crypto from "crypto";

export const createTutorFeeSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
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

    // Update application with payment info (always manual)
    const { error: updateError } = await supabaseAdmin
      .from("tutor_applications")
      .update({ payment_method: "transferencia", reference })
      .eq("id", application.id);

    if (updateError) {
      throw new Error("Falha ao atualizar a candidatura.");
    }

    return {
      reference,
      amount,
      manualPayment: true,
    };
  });

export const submitTutorReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { receiptUrl: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: currentApp } = await supabase
      .from("tutor_applications")
      .select("submission_count, status")
      .eq("user_id", userId)
      .single();

    const newCount = currentApp?.status === "rejected" 
      ? (currentApp.submission_count || 1) + 1 
      : (currentApp?.submission_count || 1);

    const { error } = await supabase
      .from("tutor_applications")
      .update({ 
        receipt_url: data.receiptUrl, 
        payment_method: "manual",
        status: "pending",
        rejection_reason: null,
        submission_count: newCount
      })
      .eq("user_id", userId);

    if (error) throw new Error("Erro ao enviar comprovativo");
    return { success: true };
  });

export const adminApproveTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { appId: string }) => data)
  .handler(async ({ data }) => {
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      { auth: { persistSession: false } }
    );

    const { data: app, error: fetchErr } = await supabaseAdmin
      .from("tutor_applications")
      .select("user_id")
      .eq("id", data.appId)
      .single();
    if (fetchErr || !app) throw new Error("Candidatura não encontrada");

    const { error: appErr } = await supabaseAdmin
      .from("tutor_applications")
      .update({ status: "paid" })
      .eq("id", data.appId);
    if (appErr) throw new Error("Falha ao atualizar candidatura");

    const { error: profErr } = await supabaseAdmin
      .from("profiles")
      .update({ is_tutor: true })
      .eq("id", app.user_id);
    if (profErr) throw new Error("Falha ao atualizar perfil");

    const { error: walletErr } = await supabaseAdmin
      .from("tutor_wallet")
      .insert({ tutor_id: app.user_id })
      .select()
      .single();
    if (walletErr && walletErr.code !== '23505') throw new Error("Falha ao criar carteira");

    return { success: true };
  });

export const adminRejectTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { appId: string, reason: string }) => data)
  .handler(async ({ data }) => {
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      { auth: { persistSession: false } }
    );

    const { error } = await supabaseAdmin
      .from("tutor_applications")
      .update({ status: "rejected", rejection_reason: data.reason })
      .eq("id", data.appId);
    if (error) throw new Error("Falha ao rejeitar candidatura");

    return { success: true };
  });

export const adminResetTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { appId: string }) => data)
  .handler(async ({ data }) => {
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      { auth: { persistSession: false } }
    );

    const { error } = await supabaseAdmin
      .from("tutor_applications")
      .update({ status: "pending", rejection_reason: null })
      .eq("id", data.appId);
    if (error) throw new Error("Falha ao reverter candidatura");

    return { success: true };
  });
