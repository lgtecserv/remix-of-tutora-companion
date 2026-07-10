import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createPaymentLink } from "@/lib/zumbopay";
import crypto from "crypto";

export const createEbookCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { ebookId: string; method?: "mpesa" | "emola" | "credit_card" | "transferencia", orderBumpId?: string, couponCode?: string, affiliateId?: string }) => data)
  .handler(async ({ data, context }) => {
    const { ebookId, method, orderBumpId, couponCode, affiliateId } = data;
    const { supabase, userId } = context;

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      { auth: { persistSession: false } }
    );

    // Fetch the ebook to get its price and bump data
    const { data: ebook, error: ebookError } = await supabase
      .from("ebooks")
      .select("id, title, price_mzn, slug, order_bump_ebook_id, order_bump_price")
      .eq("id", ebookId)
      .single();

    if (ebookError || !ebook) {
      throw new Error("E-book não encontrado.");
    }

    if (Number(ebook.price_mzn || 0) <= 0) {
      throw new Error("Este E-book é gratuito. Faça o download direto.");
    }

    // Check if user has already purchased it
    const { data: existingPurchase } = await supabase
      .from("ebook_purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("ebook_id", ebookId)
      .maybeSingle();

    if (existingPurchase) {
      throw new Error("Já compraste este e-book.");
    }

    // Generate a unique payment ID for our database
    const paymentId = crypto.randomUUID();
    const reference = paymentId.replace(/-/g, "");
    let amount = Number(ebook.price_mzn || 0);
    const chosenMethod = method || "transferencia";

    // Add Order Bump Price if selected
    if (orderBumpId && orderBumpId === ebook.order_bump_ebook_id) {
      amount += Number(ebook.order_bump_price || 0);
    }

    // Apply Coupon Discount
    let appliedCoupon = null;
    if (couponCode) {
      const { data: coupon } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .maybeSingle();

      if (coupon) {
        const now = new Date();
        const isExpired = coupon.expires_at && new Date(coupon.expires_at) < now;
        const isMaxedOut = coupon.max_uses && coupon.current_uses >= coupon.max_uses;
        const isCorrectEbook = !coupon.ebook_id || coupon.ebook_id === ebookId;

        if (!isExpired && !isMaxedOut && isCorrectEbook) {
          const discountAmount = amount * (Number(coupon.discount_percentage) / 100);
          amount -= discountAmount;
          amount = Math.max(0, amount); // Prevent negative prices
          appliedCoupon = couponCode.toUpperCase();
          
          await supabaseAdmin.from("coupons").update({ current_uses: coupon.current_uses + 1 }).eq("id", coupon.id);
        }
      }
    }

    // Save the pending payment to our database
    const { error: insertError } = await supabaseAdmin.from("payments").insert({
      id: paymentId,
      user_id: userId,
      ebook_id: ebookId,
      amount_mzn: amount,
      // Map credit_card to transferencia for DB to satisfy the Postgres Enum payment_method
      method: chosenMethod === "credit_card" ? "transferencia" : chosenMethod,
      status: "pending",
      reference: reference,
      affiliate_id: affiliateId,
      order_bump_ebook_id: orderBumpId && orderBumpId === ebook.order_bump_ebook_id ? orderBumpId : null,
      coupon_code: appliedCoupon,
    });

    if (insertError) {
      console.error("Failed to create pending payment for ebook:", insertError);
      throw new Error("Falha ao inicializar o pagamento.");
    }

    // For manual methods (transferencia), skip ZumboPay
    if (chosenMethod === "transferencia") {
      return {
        checkoutUrl: null,
        reference,
        method: chosenMethod,
        amount,
        ebookTitle: ebook.title,
        ebookSlug: ebook.slug,
        manualPayment: true,
      };
    }

    // Try ZumboPay gateway for digital methods
    try {
      const zumboRes = await createPaymentLink({
        title: ebook.title,
        amount,
        currency: "MZN",
        channels: ["mpesa", "emola", "card"],
        wallet_id: process.env.ZUMBOPAY_WALLET_ID || "",
        description: `Pagamento do E-book: ${ebook.title}`,
      });

      // Update the payment record with ZumboPay's reference
      if (zumboRes.data?.reference) {
        await supabaseAdmin.from("payments").update({
          reference: zumboRes.data.reference,
        }).eq("id", paymentId);
      }

      return {
        checkoutUrl: zumboRes.data?.checkout_url,
        reference: zumboRes.data?.reference || reference,
        manualPayment: false,
      };
    } catch (error: any) {
      console.error("ZumboPay payment request failed:", error);
      // Fallback to manual checkout if ZumboPay fails
      return {
        checkoutUrl: null,
        reference,
        method: chosenMethod,
        amount: amount.toFixed(2),
        ebookTitle: ebook.title,
        ebookSlug: ebook.slug,
        manualPayment: true,
        fallbackReason: error?.message || "Unknown ZumboPay error",
      };
    }
  });

export const getEbookSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { ebookId: string }) => data)
  .handler(async ({ data, context }) => {
    const { ebookId } = data;
    const { supabase, userId } = context;

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      { auth: { persistSession: false } }
    );

    // Check if the user bought it (or is admin/author)
    const { data: purchase } = await supabase
      .from("ebook_purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("ebook_id", ebookId)
      .maybeSingle();

    const { data: ebook } = await supabase
      .from("ebooks")
      .select("file_path, author_id")
      .eq("id", ebookId)
      .single();
      
    if (!ebook) {
      throw new Error("E-book não encontrado");
    }

    // Check for admin role
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    const isAdmin = userRole?.role === "admin";
    const isAuthor = ebook.author_id === userId;

    if (!purchase && !isAdmin && !isAuthor) {
      throw new Error("Não tens acesso a este ficheiro. Compra o e-book primeiro.");
    }

    // Generate signed URL (expires in 1 hour)
    const { data: signedData, error } = await supabaseAdmin.storage
      .from("ebooks")
      .createSignedUrl(ebook.file_path, 3600);

    if (error || !signedData?.signedUrl) {
      throw new Error("Falha ao gerar o link de download.");
    }

    return { signedUrl: signedData.signedUrl };
  });
