import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, FileText, CheckCircle2, ChevronLeft, Download, ShoppingCart, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PaymentDialog } from "@/components/PaymentDialog";
import { createEbookCheckoutSession, getEbookSignedUrl } from "@/actions/ebooks";
import { toast } from "sonner";
import { useState } from "react";
import { Header, Footer } from "@/components/public-layout";
import { motion } from "framer-motion";

export const Route = createFileRoute("/ebooks/$slug")({
  loader: async ({ params }) => {
    const { data: ebook } = await supabase
      .from("ebooks")
      .select(`*, author:profiles!ebooks_author_id_fkey(full_name)`)
      .eq("slug", params.slug)
      .eq("is_published", true)
      .maybeSingle();
    return { ebook };
  },
  head: ({ loaderData }) => {
    if (!loaderData?.ebook) {
      return { meta: [{ title: "E-book não encontrado | Imersão Completa" }] };
    }
    const { ebook } = loaderData;
    const fallbackImage = "https://www.imersaocompleta.info/favicon.ico";
    const coverImage = ebook.cover_url || fallbackImage;
    const finalTitle = `${ebook.title} | E-book Imersão Completa`;
    // We remove HTML tags if there are any for the description
    const rawDesc = ebook.description || `Adquira o e-book ${ebook.title} na Imersão Completa.`;
    const finalDesc = rawDesc.replace(/<[^>]*>?/gm, '').substring(0, 160);
    
    return {
      meta: [
        { title: finalTitle },
        { name: "description", content: finalDesc },
        { property: "og:title", content: finalTitle },
        { property: "og:description", content: finalDesc },
        { key: "og-image", property: "og:image", content: coverImage },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: finalTitle },
        { name: "twitter:description", content: finalDesc },
        { key: "tw-image", name: "twitter:image", content: coverImage },
      ]
    };
  },
  component: EbookDetailsPage,
});

function EbookDetailsPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // Fetch ebook details
  const { data: ebook, isLoading } = useQuery({
    queryKey: ["public-ebook", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ebooks")
        .select(`*, author:profiles!ebooks_author_id_fkey(full_name)`)
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (error) throw error;
      return data;
    },
    initialData: Route.useLoaderData()?.ebook,
  });

  // Check if user has purchased this ebook
  const { data: hasPurchased } = useQuery({
    queryKey: ["ebook-purchase", user?.id, ebook?.id],
    enabled: !!user?.id && !!ebook?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("ebook_purchases")
        .select("id")
        .eq("user_id", user!.id)
        .eq("ebook_id", ebook!.id)
        .maybeSingle();
      
      if (data) return true;

      // Also check if admin or author
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .maybeSingle();
        
      if (role?.role === "admin" || ebook?.author_id === user!.id) return true;

      return false;
    },
  });

  const handleBuyClick = () => {
    if (!user) {
      toast.error("Precisas de fazer login para comprar.");
      router.navigate({ to: "/login", search: { redirect: `/ebooks/${slug}` } });
      return;
    }
    
    if (!ebook) return;

    setPaymentDialogOpen(true);
  };

  const handleDownload = async () => {
    if (!ebook) return;
    setIsDownloading(true);
    try {
      const res = await getEbookSignedUrl({ data: { ebookId: ebook.id } });
      if (res.signedUrl) {
        const a = document.createElement("a");
        a.href = res.signedUrl;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Download iniciado!");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao gerar link de download.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!ebook) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center text-center px-4 py-20">
          <h2 className="text-3xl font-bold text-white mb-4">E-book não encontrado</h2>
          <p className="text-white/60 mb-8">Este material pode não existir ou foi removido.</p>
          <Button asChild className="rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-500 hover:text-white border-none">
            <Link to="/ebooks">Voltar à loja</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] selection:bg-orange-500/30 selection:text-white flex flex-col">
      <Header />
      
      <main className="flex-1 py-32 container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <Link to="/ebooks" className="inline-flex items-center text-sm font-medium text-white/50 hover:text-orange-500 transition-colors">
            <ChevronLeft className="mr-1 h-4 w-4" /> Voltar à Loja
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left Column: Cover */}
          <div className="lg:col-span-5">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky top-32"
            >
              <div className="aspect-[3/4] w-full overflow-hidden rounded-3xl shadow-[0_0_50px_-10px_rgba(234,88,12,0.3)] border border-white/10 bg-black relative">
                {ebook.cover_url ? (
                  <img src={ebook.cover_url} alt={ebook.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <BookOpen className="h-24 w-24 text-white/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
              </div>
            </motion.div>
          </div>

          {/* Right Column: Details */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-7 flex flex-col"
          >
            {ebook.category && (
              <span className="text-sm font-bold tracking-widest text-orange-500 uppercase mb-4">
                {ebook.category}
              </span>
            )}
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-6 leading-[1.1]">
              {ebook.title}
            </h1>
            
            <div className="flex items-center text-white/50 mb-10 text-lg">
              Por <span className="font-bold text-white ml-2">{ebook.author?.full_name || "Imersão Completa"}</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-10 flex flex-wrap items-center justify-between gap-6 shadow-2xl backdrop-blur-md">
              <div>
                <div className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-2">Preço</div>
                <div className="text-5xl font-black text-white">
                  {ebook.price_mzn > 0 ? `${ebook.price_mzn} MT` : "Grátis"}
                </div>
              </div>
              
              <div className="flex-1 min-w-[200px] flex justify-end">
                {hasPurchased ? (
                  <button 
                    onClick={handleDownload} 
                    disabled={isDownloading} 
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-emerald-600 px-10 py-5 text-lg font-bold text-white shadow-[0_0_30px_-5px_rgba(5,150,105,0.6)] transition-all hover:scale-105 hover:bg-emerald-500 disabled:opacity-70 disabled:pointer-events-none gap-3"
                  >
                    {isDownloading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Download className="h-6 w-6" />}
                    Descarregar {ebook.format || "PDF"}
                  </button>
                ) : (
                  <button 
                    onClick={handleBuyClick} 
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-10 py-5 text-lg font-bold text-white shadow-[0_0_30px_-5px_rgba(234,88,12,0.6)] transition-all hover:scale-105 hover:shadow-[0_0_50px_-5px_rgba(234,88,12,0.8)] gap-3"
                  >
                    <ShoppingCart className="h-6 w-6" />
                    Comprar Agora
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <FileText className="h-6 w-6 text-orange-500 mb-3" />
                <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1">Formato</div>
                <div className="font-bold text-white">{ebook.format || "PDF"}</div>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <BookOpen className="h-6 w-6 text-orange-500 mb-3" />
                <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1">Páginas</div>
                <div className="font-bold text-white">{ebook.pages_count || "--"}</div>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <Download className="h-6 w-6 text-orange-500 mb-3" />
                <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1">Acesso</div>
                <div className="font-bold text-white">Imediato</div>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="h-6 w-6 text-orange-500 mb-3" />
                <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1">Updates</div>
                <div className="font-bold text-white">Inclusos</div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                Sobre este material
              </h2>
              <div className="prose prose-invert prose-orange max-w-none text-white/70 leading-relaxed text-lg">
                {ebook.description ? (
                  <div dangerouslySetInnerHTML={{ __html: ebook.description }} />
                ) : (
                  <p className="italic">Nenhuma descrição detalhada disponível para este material.</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Payment Dialog */}
        {!hasPurchased && ebook.price_mzn > 0 && user && (
          <PaymentDialog
            open={paymentDialogOpen}
            onOpenChange={setPaymentDialogOpen}
            type="ebook"
            itemId={ebook.id}
            courseTitle={ebook.title}
            price={Number(ebook.price_mzn)}
            userId={user.id}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
