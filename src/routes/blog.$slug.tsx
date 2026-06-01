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
                <div className="flex items-center gap-2 text-white/90">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-[10px] font-bold text-white">IC</div>
                  <span>Por Equipa Imersão Completa</span>
                </div>
                <span className="h-1 w-1 rounded-full bg-white/30" />
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
            
            <div className="mt-12 pt-8 border-t border-white/10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h4 className="text-lg font-bold text-white mb-2">Gostou deste artigo?</h4>
                  <p className="text-sm text-white/60">Partilhe com a sua rede e ajude outras pessoas a dominar a tecnologia.</p>
                </div>
                <div className="flex items-center gap-3">
                  <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + " - https://www.imersaocompleta.info/blog/" + post.slug)}`} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white transition hover:scale-110" aria-label="Partilhar no WhatsApp">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                  </a>
                  <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent("https://www.imersaocompleta.info/blog/" + post.slug)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-black border border-white/20 text-white transition hover:scale-110" aria-label="Partilhar no X (Twitter)">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                  <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent("https://www.imersaocompleta.info/blog/" + post.slug)}&title=${encodeURIComponent(post.title)}`} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0a66c2] text-white transition hover:scale-110" aria-label="Partilhar no LinkedIn">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                </div>
              </div>
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
