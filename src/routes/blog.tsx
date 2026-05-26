import { createFileRoute, Link } from "@tanstack/react-router";
import { Header, Footer } from "@/components/public-layout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

export const Route = createFileRoute("/blog")({
  component: BlogPublicPage,
});

function BlogPublicPage() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["public-blog-posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      return data || [];
    },
  });

  const featuredPosts = posts?.slice(0, 5) || [];
  const mainFeatured = featuredPosts.length > 0 ? featuredPosts[0] : null;
  const leftFeatured = featuredPosts.slice(1, 3);
  const rightFeatured = featuredPosts.slice(3, 5);
  
  const recentPosts = posts?.slice(5) || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] selection:bg-orange-500/30 selection:text-white">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Magazine Hero Section */}
        {isLoading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : featuredPosts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-4 md:grid-rows-2">
            {/* Left Column - 2 smaller posts */}
            <div className="col-span-1 row-span-2 flex flex-col gap-4">
              {leftFeatured.map((post, idx) => (
                <FeaturedPostCard key={post.id} post={post} idx={idx} />
              ))}
            </div>

            {/* Center Column - 1 large post */}
            {mainFeatured && (
              <div className="col-span-1 md:col-span-2 row-span-2">
                <FeaturedPostCard post={mainFeatured} isLarge idx={0} />
              </div>
            )}

            {/* Right Column - 2 smaller posts */}
            <div className="col-span-1 row-span-2 flex flex-col gap-4">
              {rightFeatured.map((post, idx) => (
                <FeaturedPostCard key={post.id} post={post} idx={idx + 2} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-white/50 py-20">Nenhum artigo publicado ainda.</div>
        )}

        {/* Two Column Layout (Content & Sidebar) */}
        <div className="mt-16 flex flex-col gap-12 lg:flex-row">
          
          {/* Main Content (70%) */}
          <div className="flex-1">
            <div className="mb-8 border-b border-white/10 pb-4">
              <h2 className="text-2xl font-bold text-white">Artigos Recentes</h2>
            </div>
            
            <div className="space-y-8">
              {recentPosts.map((post) => (
                <motion.article 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  key={post.id} 
                  className="group flex flex-col gap-6 md:flex-row"
                >
                  <Link to={`/blog/$slug`} params={{ slug: post.slug || post.id }} className="relative block h-56 w-full shrink-0 overflow-hidden rounded-2xl md:h-48 md:w-72">
                    <img 
                      src={post.cover_url || "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=2070"} 
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {post.category && (
                      <span className="absolute left-4 top-4 rounded bg-orange-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
                        {post.category}
                      </span>
                    )}
                  </Link>
                  <div className="flex flex-col justify-center">
                    <div suppressHydrationWarning className="mb-2 text-sm text-white/40">
                      {new Date(post.published_at || post.created_at).toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                    <Link to={`/blog/$slug`} params={{ slug: post.slug || post.id }}>
                      <h3 className="text-xl font-bold leading-snug text-white transition-colors group-hover:text-orange-500 md:text-2xl">
                        {post.title}
                      </h3>
                    </Link>
                    <p className="mt-3 line-clamp-2 text-white/60">
                      {post.excerpt || "Leia o artigo completo para descobrir todos os detalhes sobre este tema."}
                    </p>
                    <Link to={`/blog/$slug`} params={{ slug: post.slug || post.id }} className="mt-4 font-semibold text-orange-500 hover:text-orange-400">
                      Ler mais &rarr;
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>

          {/* Sidebar (30%) */}
          <aside className="w-full lg:w-80 shrink-0 space-y-12">
            {/* Widget: Sobre */}
            <div className="rounded-3xl border border-white/5 bg-white/5 p-8">
              <h3 className="mb-4 text-lg font-bold text-white">Sobre o Blog</h3>
              <p className="text-sm leading-relaxed text-white/60">
                O espaço onde partilhamos conhecimento avançado sobre Inteligência Artificial, desenvolvimento web e criação de negócios rentáveis.
              </p>
            </div>
            
            {/* Widget: Categorias */}
            <div>
              <h3 className="mb-6 border-b border-white/10 pb-2 text-lg font-bold text-white">Categorias</h3>
              <ul className="space-y-3">
                {["Inteligência Artificial", "Desenvolvimento Web", "Negócios Digitais", "Empreendedorismo", "Carreira"].map((cat) => (
                  <li key={cat}>
                    <a href="#" className="group flex items-center justify-between text-sm text-white/70 transition-colors hover:text-orange-500">
                      <span>{cat}</span>
                      <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-white/40 group-hover:bg-orange-500/10 group-hover:text-orange-500">
                        {cat.length * 2 + 1}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

function FeaturedPostCard({ post, isLarge = false, idx }: { post: any, isLarge?: boolean, idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: idx * 0.1 }}
      className={`group relative block w-full overflow-hidden rounded-2xl ${isLarge ? "h-full min-h-[400px] md:min-h-[500px]" : "h-48 md:h-full min-h-[240px]"}`}
    >
      <Link to={`/blog/$slug`} params={{ slug: post.slug || post.id }} className="absolute inset-0 z-20" aria-label={`Ler ${post.title}`} />
      
      <img 
        src={post.cover_url || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070"} 
        alt={post.title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      
      {/* Gradient Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-6">
        <div>
          {post.category && (
            <span className="inline-block rounded bg-orange-600 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white shadow-sm">
              {post.category}
            </span>
          )}
        </div>
        <div className="transform transition-transform duration-300 group-hover:-translate-y-2">
          <h3 className={`font-bold text-white leading-tight ${isLarge ? "text-3xl md:text-4xl" : "text-xl"}`}>
            {post.title}
          </h3>
          <div className="mt-3 flex items-center gap-3 text-xs font-medium text-white/70">
            <span suppressHydrationWarning>{new Date(post.published_at || post.created_at).toLocaleDateString("pt-PT")}</span>
            {post.reading_minutes && (
              <>
                <span className="h-1 w-1 rounded-full bg-white/30" />
                <span>{post.reading_minutes} min leitura</span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
