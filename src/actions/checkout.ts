import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createPaymentRequest } from "@/lib/paysuite";
import crypto from "crypto";

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { courseId: string; method?: "mpesa" | "emola" | "credit_card" | "transferencia" }) => data)
  .handler(async ({ data, context }) => {
    const { courseId, method } = data;
    const { supabase, userId } = context;

    // Fetch the course to get its price
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, price_mzn, slug, is_free")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      throw new Error("Curso não encontrado.");
    }

    if (course.is_free || course.price_mzn <= 0) {
      throw new Error("Este curso é gratuito. Faça a inscrição direta.");
    }

    // Check if user is already enrolled
    const { data: existingEnrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single();

    if (existingEnrollment) {
      throw new Error("Já estás matriculado neste curso.");
    }

    // Generate a unique reference for the payment
    const reference = crypto.randomUUID();
    const amount = Number(course.price_mzn).toFixed(2);
    
    // Save the pending payment to our database
    const { error: insertError } = await supabase.from("payments").insert({
      id: reference,
      user_id: userId,
      course_id: courseId,
      amount_mzn: Number(course.price_mzn),
      method: method || "transferencia", // default if none provided
      status: "pending",
      reference: reference, // we can use the ID as reference too
    });

    if (insertError) {
      console.error("Failed to create pending payment:", insertError);
      throw new Error("Falha ao inicializar o pagamento.");
    }

    // Base URL for callbacks/redirects
    // Assume process.env.APP_URL is set, or fallback to localhost for local testing
    const baseUrl = process.env.APP_URL || "http://localhost:3000";

    // Call PaySuite to create payment request
    try {
      const paysuiteRes = await createPaymentRequest({
        amount,
        reference,
        description: `Pagamento do curso: ${course.title}`,
        return_url: `${baseUrl}/app/curso/${course.slug}?payment=success`,
        callback_url: `${baseUrl}/api/webhooks/paysuite`,
        method: method !== "transferencia" ? method : undefined,
      });

      return {
        checkoutUrl: paysuiteRes.data?.checkout_url,
        reference,
      };
    } catch (err: any) {
      console.error("PaySuite error:", err.message);
      // Update payment status to failed in case of external API error
      await supabase
        .from("payments")
        .update({ status: "rejected" })
        .eq("id", reference);
        
      throw new Error(`Erro no gateway de pagamento: ${err.message}`);
    }
  });
