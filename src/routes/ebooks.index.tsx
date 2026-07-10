import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Search, ArrowRight, BookText } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Header, Footer } from "@/components/public-layout";

export const Route = createFileRoute("/ebooks/")({
  head: () => ({
    meta: [
      { title: "Loja de E-books & PLR — Imersão Completa" },
      { name: "description", content: "Aprenda ao teu ritmo com a nossa coleção de E-books exclusivos. Descarrega em PDF e lê em qualquer dispositivo." },
      { property: "og:title", content: "Loja de E-books & PLR — Imersão Completa" },
      { property: "og:description", content: "Aprenda ao teu ritmo com a nossa coleção de E-books exclusivos. Descarrega em PDF e lê em qualquer dispositivo." },
    ],
  }),
  component: EbooksStorePage,
});

function EbooksStorePage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: ebooks, isLoading } = useQuery({
    queryKey: ["ebooks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ebooks")
        .select(`
          id, title, slug, description, price_mzn, cover_url, format, pages_count, category,
          author:profiles!ebooks_author_id_fkey(full_name)
        `)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] selection:bg-orange-500/30 selection:text-white flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-32">
        <div className="space-y-12 pb-10">
          <div className="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 shadow-[inset_0_0_20px_rgba(234,88,12,0.2)]">
              <BookText className="h-8 w-8" />
            </div>
            <div>
              <span className="text-sm font-bold uppercase tracking-widest text-orange-500 mb-4 block">Catálogo Exclusivo</span>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
                Loja de <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent drop-shadow-sm">E-books & PLR</span>
              </h1>
              <p className="text-lg text-white/60 mt-6 max-w-2xl mx-auto">
                Aprende ao teu ritmo com a nossa coleção de E-books exclusivos. Descarrega em PDF e lê em qualquer dispositivo, onde quer que estejas.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 animate-pulse">
                  <div className="aspect-[3/4] w-full rounded-2xl bg-white/5"></div>
                  <div className="h-5 w-3/4 bg-white/5 rounded"></div>
                  <div className="h-4 w-1/2 bg-white/5 rounded"></div>
                  <div className="mt-4 h-12 w-full bg-white/5 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : ebooks && ebooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {ebooks.map((ebook, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={ebook.id}
                  className="h-full"
                >
                  <Link 
                    to="/ebooks/$slug" 
                    params={{ slug: ebook.slug }}
                    className="group flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:-translate-y-2 hover:border-orange-500/50 hover:bg-white/[0.07] hover:shadow-[0_0_40px_-10px_rgba(234,88,12,0.2)] h-full relative overflow-hidden"
                  >
                    {/* Format Badge */}
                    <div className="absolute top-8 right-8 z-10 bg-black/80 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg border border-white/10">
                      {ebook.format || "PDF"}
                    </div>

                    <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl bg-black relative shadow-[0_0_30px_-5px_rgba(0,0,0,0.5)]">
                      {ebook.cover_url ? (
                        <img
                          src={ebook.cover_url}
                          alt={ebook.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-white/5 text-white/20">
                          <BookOpen className="h-16 w-16" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                    </div>

                    <div className="flex flex-1 flex-col">
                      {ebook.category && (
                        <p className="text-xs font-bold text-orange-500 mb-2 uppercase tracking-wider">{ebook.category}</p>
                      )}
                      <h3 className="text-xl font-bold leading-tight text-white group-hover:text-orange-400 transition-colors line-clamp-2">
                        {ebook.title}
                      </h3>
                      
                      <div className="mt-3 flex items-center gap-2 text-sm text-white/50">
                        <span className="truncate">Por {ebook.author?.full_name || "Imersão Completa"}</span>
                      </div>

                      <div className="mt-auto pt-6 flex items-center justify-between">
                        <div className="font-black text-2xl text-white">
                          {ebook.price_mzn > 0 ? `${ebook.price_mzn} MT` : "Grátis"}
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/20 text-orange-500 transition-all group-hover:bg-orange-500 group-hover:text-white group-hover:scale-110 shadow-[0_0_15px_rgba(234,88,12,0)] group-hover:shadow-[0_0_15px_rgba(234,88,12,0.4)]">
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 py-32 text-center px-4 bg-white/5">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                <BookText className="h-10 w-10 text-white/40" />
              </div>
              <h2 className="mb-4 text-3xl font-bold text-white">Nenhum e-book disponível</h2>
              <p className="text-lg text-white/60 max-w-md">
                Ainda não adicionámos e-books à loja. Volta mais tarde para descobrires os nossos materiais exclusivos.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
