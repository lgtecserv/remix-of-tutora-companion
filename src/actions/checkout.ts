import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import crypto from "crypto";

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { courseId: string; method?: string }) => data)
  .handler(async ({ data, context }) => {
    const { courseId } = data;
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

    // Generate a unique payment ID for our database
    const paymentId = crypto.randomUUID();
    const reference = paymentId.replace(/-/g, "");
    const amount = Number(course.price_mzn || 0);
    
    // Save the pending payment to our database (always manual/transferencia)
    const { error: insertError } = await supabaseAdmin.from("payments").insert({
      id: paymentId,
      user_id: userId,
      course_id: courseId,
      amount_mzn: amount,
      method: "transferencia",
      status: "pending",
      reference: reference,
    });

    if (insertError) {
      console.error("Failed to create pending payment:", insertError);
      throw new Error("Falha ao inicializar o pagamento.");
    }

    return {
      checkoutUrl: null,
      reference,
      method: "transferencia",
      amount,
      courseTitle: course.title,
      courseSlug: course.slug,
      manualPayment: true,
    };
  });

