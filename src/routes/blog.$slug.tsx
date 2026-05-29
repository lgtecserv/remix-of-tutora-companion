import { createFileRoute, Link } from "@tanstack/react-router";
import { Header, Footer } from "@/components/public-layout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPublicArticle,
});

function BlogPublicArticle() {
  const { slug } = Route.useParams();
  
  const { data: post, isLoading } = useQuery({
    queryKey: ["public-blog-post", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] selection:bg-orange-500/30 selection:text-white flex flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] selection:bg-orange-500/30 selection:text-white flex flex-col">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center text-center px-4 py-20">
          <h1 className="text-4xl font-bold text-white mb-4">Artigo não encontrado</h1>
          <p className="text-white/60 mb-8">O artigo que procura não existe ou foi removido.</p>
          <Link to="/blog" className="rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-500">
            Voltar ao Blog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isHtml = (post.content ?? "").trim().startsWith("<");

  return (
    <div className="min-h-screen bg-[#0a0a0a] selection:bg-orange-500/30 selection:text-white flex flex-col">
      {post.llm_summary && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": post.title,
              "image": post.cover_url ? [post.cover_url] : [],
              "datePublished": post.published_at || post.created_at,
              "dateModified": post.updated_at || post.published_at || post.created_at,
              "abstract": post.llm_summary,
              "author": [{
                "@type": "Organization",
                "name": "Imersão Completa",
                "url": "https://lgtecserv.com"
              }]
            })
          }}
        />
      )}
      <Header />
      
      <main className="flex-1 pb-20">
        {/* Article Header & Cover */}
        <div className="relative w-full h-[50vh] min-h-[400px] max-h-[600px]">
          <div className="absolute inset-0 bg-black/60 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent z-10" />
          
          {post.cover_url ? (
            <img 
              src={post.cover_url} 
              alt={post.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <img 
              src={`https://image.pollinations.ai/prompt/${encodeURIComponent(post.title)}?width=1200&height=600&nologo=true`} 
              alt={post.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          <div className="absolute inset-0 z-20 flex flex-col justify-end container mx-auto px-4 pb-12">
            <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-white/50 hover:text-orange-500 transition-colors mb-6 w-max">
              <ArrowLeft className="w-4 h-4" /> Voltar ao blog
            </Link>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl"
            >
              {post.category && (
                <span className="inline-block rounded bg-orange-600 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white shadow-sm mb-4">
                  {post.category}
                </span>
              )}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                {post.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-white/60">
                <span suppressHydrationWarning>{new Date(post.published_at || post.created_at).toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" })}</span>
                {post.reading_minutes && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-white/30" />
                    <span>{post.reading_minutes} min leitura</span>
                  </>
                )}
                {(post.tags ?? []).length > 0 && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-white/30" />
                    <div className="flex gap-2">
                      {(post.tags as string[]).map((t) => (
                        <span key={t}>#{t}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Article Content */}
        <div className="container mx-auto px-4 mt-8">
          <div className="max-w-3xl mx-auto">
            {post.excerpt && (
              <p className="text-xl md:text-2xl text-white/80 leading-relaxed font-light mb-12 border-l-4 border-orange-500 pl-6">
                {post.excerpt}
              </p>
            )}

            {(post.key_takeaways ?? []).length > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6 mb-12">
                <h4 className="font-bold text-orange-500 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> Principais Conclusões
                </h4>
                <ul className="space-y-3">
                  {(post.key_takeaways as string[]).map((k, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/80">
                      <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" /> 
                      <span className="leading-relaxed">{k}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="prose prose-invert prose-orange prose-lg max-w-none text-white/70">
              {isHtml ? (
                <div dangerouslySetInnerHTML={{ __html: post.content ?? "" }} />
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {post.content ?? ""}
                </ReactMarkdown>
              )}
            </div>
            
            <div className="mt-16 pt-8 border-t border-white/10 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Quer aprender a criar plataformas como esta?</h3>
              <p className="text-white/60 mb-8">Junte-se à Imersão Completa e domine o desenvolvimento web, apps e IA.</p>
              <Link to="/registo" className="inline-block rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-8 py-4 text-sm font-bold text-white shadow-[0_0_30px_-5px_rgba(234,88,12,0.6)] transition-all hover:scale-105 hover:shadow-[0_0_40px_-5px_rgba(234,88,12,0.8)]">
                Começar a Imersão
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
