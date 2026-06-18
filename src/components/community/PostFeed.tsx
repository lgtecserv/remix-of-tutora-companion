import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PostCard, Post } from "./PostCard";
import { CreatePostForm } from "./CreatePostForm";
import { Filter } from "lucide-react";

export function PostFeed() {
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [selectedCourse, setSelectedCourse] = useState<string>("Todos");

  const CATEGORIES = ["Todos", "Geral", "Dúvidas", "Projetos", "Dicas", "Off-Topic"];

  const { data: courses } = useQuery({
    queryKey: ['courses_list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('id, title').eq('is_published', true);
      if (error) throw error;
      return data;
    }
  });

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['community_posts', selectedCategory, selectedCourse],
    queryFn: async () => {
      let query = supabase
        .from('community_posts')
        .select(`
          id, content, image_url, category, course_id, created_at, user_id,
          profiles (full_name, avatar_url),
          courses (title),
          community_post_likes (user_id)
        `)
        .order('created_at', { ascending: false });
        
      if (selectedCategory !== "Todos") {
        query = query.eq('category', selectedCategory);
      }
      if (selectedCourse !== "Todos") {
        query = query.eq('course_id', selectedCourse);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Post[];
    }
  });

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl">
        Erro ao carregar a comunidade. Tente novamente mais tarde.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      <CreatePostForm />
      
      <div className="mb-6 bg-card border border-border rounded-xl p-3 flex flex-wrap items-center gap-3">
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
          <h3 className="text-lg font-medium mb-1">Nenhuma postagem ainda</h3>
          <p className="text-sm text-muted-foreground">Seja o primeiro a compartilhar algo com a comunidade!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts?.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
