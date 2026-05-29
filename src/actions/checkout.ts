import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createPaymentRequest } from "@/lib/paysuite";
import crypto from "crypto";

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { courseId: string; method?: "mpesa" | "emola" | "credit_card" | "transferencia" }) => data)
  .handler(async ({ data, context }) => {
    const { courseId, method } = data;
    const { supabase, userId } = context;

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      { auth: { persistSession: false } }
    );

    // Fetch the course to get its price
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, price_mzn, slug, is_free")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      throw new Error("Curso não encontrado.");
    }

    if (course.is_free || Number(course.price_mzn || 0) <= 0) {
      throw new Error("Este curso é gratuito. Faça a inscrição direta.");
    }

    // Check if user is already enrolled
    const { data: existingEnrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existingEnrollment) {
      throw new Error("Já estás matriculado neste curso.");
    }

    // Generate a unique reference for the payment
    const paymentId = crypto.randomUUID();
    // PaySuite requires only letters and numbers for their reference
    const reference = paymentId.replace(/-/g, "");
    const amount = Number(course.price_mzn || 0).toFixed(2);
    const chosenMethod = method || "transferencia";
    
    // Save the pending payment to our database
    const { error: insertError } = await supabaseAdmin.from("payments").insert({
      id: paymentId,
      user_id: userId,
      course_id: courseId,
      amount_mzn: Number(course.price_mzn || 0),
      // Map credit_card to transferencia for DB to satisfy the Postgres Enum payment_method
      method: chosenMethod === "credit_card" ? "transferencia" : chosenMethod,
      status: "pending",
      reference: reference,
    });

    if (insertError) {
      console.error("Failed to create pending payment:", insertError);
      throw new Error("Falha ao inicializar o pagamento.");
    }

    // For manual methods (transferencia), skip PaySuite
    // and return the reference so the user can upload a receipt
    if (chosenMethod === "transferencia") {
      return {
        checkoutUrl: null,
        reference,
        method: chosenMethod,
        amount,
        courseTitle: course.title,
        courseSlug: course.slug,
        manualPayment: true,
      };
    }

    // Try PaySuite gateway for digital methods
    const baseUrl = process.env.APP_URL || "http://localhost:3000";

    try {
      const paysuiteRes = await createPaymentRequest({
        amount,
        reference,
        description: `Pagamento do curso: ${course.title}`,
        return_url: `${baseUrl}/app/curso/${course.slug}?payment=success`,
        callback_url: `${baseUrl}/api/webhooks/paysuite`,
      });

      return {
        checkoutUrl: paysuiteRes.data?.checkout_url,
        reference,
        manualPayment: false,
      };
    } catch (error: any) {
      console.error("PaySuite payment request failed:", error);
      // Fallback to manual checkout if PaySuite fails
      return {
        checkoutUrl: null,
        reference,
        method: chosenMethod,
        amount,
        courseTitle: course.title,
        courseSlug: course.slug,
        manualPayment: true,
        fallbackReason: error?.message || "Unknown PaySuite error",
      };
    }
  });
