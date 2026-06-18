import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageSquare, Flag, MoreVertical, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { CommentSection } from "./CommentSection";

export interface Post {
  id: string;
  content: string;
  image_url: string | null;
  category: string | null;
  course_id: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  };
  courses?: {
    title: string;
  };
  community_post_likes: { user_id: string }[];
  _count?: {
    community_post_comments: number;
  };
}

export function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);

  const isLiked = post.community_post_likes.some(like => like.user_id === user?.id);
  const likeCount = post.community_post_likes.length;
  // Fallback for comment count if standard join isn't doing the count, or we can just fetch it inside CommentSection. 
  // Let's rely on showComments to expand it.

  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      
      if (isLiked) {
        await supabase
          .from('community_post_likes')
          .delete()
          .match({ post_id: post.id, user_id: user.id });
      } else {
        await supabase
          .from('community_post_likes')
          .insert({ post_id: post.id, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_posts'] });
    }
  });

  const reportMutation = useMutation({
    mutationFn: async (reason: string) => {
      if (!user) throw new Error("Não autenticado");
      await supabase.from('community_post_reports').insert({
        post_id: post.id,
        user_id: user.id,
        reason
      });
    },
    onSuccess: () => toast.success("Postagem denunciada para revisão."),
    onError: () => toast.error("Erro ao denunciar postagem.")
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!user || user.id !== post.user_id) throw new Error("Não autorizado");
      await supabase.from('community_posts').delete().eq('id', post.id);
    },
    onSuccess: () => {
      toast.success("Postagem excluída.");
      queryClient.invalidateQueries({ queryKey: ['community_posts'] });
    }
  });

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm mb-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={post.profiles.avatar_url || ""} />
            <AvatarFallback>{post.profiles.full_name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold text-sm">{post.profiles.full_name || "Usuário Anônimo"}</div>
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {user?.id === post.user_id ? (
              <DropdownMenuItem onClick={() => { if(confirm("Tem certeza que deseja excluir?")) deleteMutation.mutate(); }} className="text-destructive">
                <Trash className="w-4 h-4 mr-2" /> Excluir
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => {
                const reason = prompt("Qual o motivo da denúncia?");
                if(reason) reportMutation.mutate(reason);
              }}>
                <Flag className="w-4 h-4 mr-2" /> Denunciar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {(post.category || post.courses?.title) && (
        <div className="flex items-center gap-2 mb-3">
          {post.category && (
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
              {post.category}
            </span>
          )}
          {post.courses?.title && (
            <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500 ring-1 ring-inset ring-blue-500/20">
              {post.courses.title}
            </span>
          )}
        </div>
      )}

      <div className="mb-4">
        <p className="text-sm text-foreground whitespace-pre-wrap break-words">{post.content}</p>
        {post.image_url && (
          <div className="mt-3 overflow-hidden rounded-lg border border-border">
            <img src={post.image_url} alt="Post content" className="w-full max-h-96 object-cover" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 pt-3 border-t border-border">
        <button 
          onClick={() => toggleLikeMutation.mutate()}
          className={`flex items-center gap-1.5 text-sm font-medium transition ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
          disabled={toggleLikeMutation.isPending}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition"
        >
          <MessageSquare className="w-5 h-5" />
          <span>Comentar</span>
        </button>
      </div>

      {showComments && <CommentSection postId={post.id} />}
    </div>
  );
}
