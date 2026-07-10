import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PostCard, Post } from "./PostCard";
import { CreatePostForm } from "./CreatePostForm";
import { Filter, Search, ArrowDownWideNarrow, Megaphone } from "lucide-react";
import { Input } from "@/components/ui/input";

function AdCard({ ad, isSidebar = false }: { ad: any, isSidebar?: boolean }) {
  return (
    <a 
      href={ad.link_url || "#"} 
      target={ad.link_url ? "_blank" : undefined} 
      rel={ad.link_url ? "noopener noreferrer" : undefined}
      className={`block bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition group ${isSidebar ? '' : 'mb-4'}`}
    >
      {ad.image_url && (
        <img src={ad.image_url} alt={ad.title} loading="lazy" className="w-full h-auto max-h-64 object-cover object-center group-hover:scale-[1.02] transition duration-500" />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2">
          <Megaphone className="w-3 h-3" /> Patrocinado
        </div>
        <h4 className="font-semibold text-sm md:text-base group-hover:text-primary transition">{ad.title}</h4>
        {ad.description && <p className="text-xs md:text-sm text-muted-foreground mt-1">{ad.description}</p>}
      </div>
    </a>
  );
}

export function PostFeed() {
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [selectedCourse, setSelectedCourse] = useState<string>("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recentes" | "curtidas">("recentes");

  const CATEGORIES = ["Todos", "Geral", "Dúvidas", "Projetos", "Dicas", "Off-Topic"];

  const { data: courses } = useQuery({
    queryKey: ['courses_list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('id, title').eq('is_published', true);
      if (error) throw error;
      return data;
    }
  });

  const { data: ads } = useQuery({
    queryKey: ['community_feed_sidebar_ads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_ads')
        .select('*')
        .in('placement', ['sidebar', 'feed'])
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const sidebarAds = ads?.filter(a => a.placement === 'sidebar') || [];
  const feedAds = ads?.filter(a => a.placement === 'feed') || [];

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['community_posts', selectedCategory, selectedCourse, searchTerm, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('community_posts')
        .select(`
          id, content, image_url, category, course_id, created_at, user_id, is_pinned,
          profiles (full_name, avatar_url),
          courses (title),
          community_post_likes (user_id)
        `)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
        
      if (selectedCategory !== "Todos") {
        query = query.eq('category', selectedCategory);
      }
      if (selectedCourse !== "Todos") {
        query = query.eq('course_id', selectedCourse);
      }
      if (searchTerm) {
        query = query.ilike('content', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      let fetchedPosts = data as unknown as Post[];

      // Ordenação no cliente para "Mais Curtidas" (mantendo fixados no topo)
      if (sortBy === "curtidas") {
        fetchedPosts.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          const likesA = a.community_post_likes?.length || 0;
          const likesB = b.community_post_likes?.length || 0;
          return likesB - likesA;
        });
      }

      return fetchedPosts;
    }
  });

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl max-w-2xl mx-auto w-full">
        Erro ao carregar a comunidade. Tente novamente mais tarde.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 max-w-6xl mx-auto w-full">
      <div className="xl:col-span-3">
        <CreatePostForm />
        
        <div className="mb-6 space-y-3">
          {/* Top bar with Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Pesquisar postagens..." 
                className="pl-9 bg-card border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 bg-card border border-border rounded-md px-3 h-10">
              <ArrowDownWideNarrow className="w-4 h-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "recentes" | "curtidas")}
                className="text-sm bg-transparent text-foreground border-none outline-none"
              >
                <option value="recentes">Mais Recentes</option>
                <option value="curtidas">Mais Curtidas</option>
              </select>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-card border border-border rounded-xl p-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-muted-foreground mr-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                    selectedCategory === cat 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="ml-auto text-sm bg-muted text-foreground border-none rounded-lg px-2 py-1 outline-none"
            >
              <option value="Todos">Todos os Cursos</option>
              {courses?.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 h-40 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="space-y-2">
                    <div className="w-32 h-3 bg-muted rounded"></div>
                    <div className="w-20 h-2 bg-muted rounded"></div>
                  </div>
                </div>
                <div className="w-full h-4 bg-muted rounded mb-2"></div>
                <div className="w-3/4 h-4 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : posts?.length === 0 ? (
          <div className="text-center py-10 bg-card border border-border rounded-xl">
            <h3 className="text-lg font-medium mb-1">Nenhuma postagem encontrada</h3>
            <p className="text-sm text-muted-foreground">Tente alterar os filtros ou os termos de pesquisa.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts?.map((post, index) => (
              <React.Fragment key={post.id}>
                <PostCard post={post} />
                {index > 0 && index % 5 === 0 && feedAds.length > 0 && (
                  <AdCard ad={feedAds[(index / 5 - 1) % feedAds.length]} />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      <div className="hidden xl:block xl:col-span-1">
        <div className="sticky top-24 space-y-4">
          {sidebarAds.length > 0 && (
            <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-3">Destaques</h3>
          )}
          {sidebarAds.map(ad => (
            <AdCard key={ad.id} ad={ad} isSidebar />
          ))}
          {/* Espaço para futuras regras da comunidade, Top Alunos, etc */}
          {sidebarAds.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-sm mb-2">Avisos</h3>
              <p className="text-xs text-muted-foreground">Nenhum aviso no momento.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
