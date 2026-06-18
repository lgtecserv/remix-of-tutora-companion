import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageSquare, Send } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  user_id: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function CommentSection({ postId }: { postId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const { data: comments, isLoading } = useQuery({
    queryKey: ['community_comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_post_comments')
        .select(`
          id, content, created_at, parent_id, user_id,
          profiles (full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      return data as Comment[];
    }
  });

  const commentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string, parentId: string | null }) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from('community_post_comments').insert({
        post_id: postId,
        user_id: user.id,
        content,
        parent_id: parentId
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewComment("");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['community_comments', postId] });
    },
    onError: () => toast.error("Erro ao enviar comentário")
  });

  const handleSubmit = (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    const content = parentId ? newComment : newComment; // Can use separate state if needed, but we reset reply on submit
    if (!content.trim()) return;
    commentMutation.mutate({ content, parentId });
  };

  if (isLoading) return <div className="text-sm text-muted-foreground p-4">Carregando comentários...</div>;

  const topLevelComments = comments?.filter(c => !c.parent_id) || [];
  
  const getReplies = (parentId: string) => comments?.filter(c => c.parent_id === parentId) || [];

  const CommentItem = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => (
    <div className={`flex gap-3 mt-4 ${isReply ? 'ml-8 md:ml-12 border-l-2 border-border pl-4' : ''}`}>
      <Avatar className="w-8 h-8">
        <AvatarImage src={comment.profiles.avatar_url || ""} />
        <AvatarFallback>{comment.profiles.full_name?.charAt(0) || "U"}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="bg-muted/50 p-3 rounded-2xl rounded-tl-none">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{comment.profiles.full_name || "Usuário"}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
          <p className="text-sm text-foreground/90 mt-1">{comment.content}</p>
        </div>
        
        {!isReply && (
          <button 
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            className="text-xs text-muted-foreground hover:text-primary font-medium ml-2 transition"
          >
            Responder
          </button>
        )}

        {replyingTo === comment.id && !isReply && (
          <form onSubmit={(e) => handleSubmit(e, comment.id)} className="flex items-center gap-2 mt-2">
            <input
              type="text"
              placeholder="Escreva uma resposta..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 text-sm bg-transparent border-b border-border focus:border-primary outline-none px-2 py-1"
              autoFocus
            />
            <Button size="sm" variant="ghost" disabled={!newComment.trim() || commentMutation.isPending}>
              <Send className="w-4 h-4 text-primary" />
            </Button>
          </form>
        )}

        {/* Render Replies */}
        {!isReply && getReplies(comment.id).map(reply => (
          <CommentItem key={reply.id} comment={reply} isReply />
        ))}
      </div>
    </div>
  );

  return (
    <div className="pt-4 mt-4 border-t border-border">
      <form onSubmit={(e) => handleSubmit(e, null)} className="flex items-start gap-3">
        <Avatar className="w-8 h-8">
          <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex items-center bg-muted/50 rounded-full pr-1 overflow-hidden focus-within:ring-1 focus-within:ring-primary border border-border">
          <input
            type="text"
            placeholder="Escreva um comentário..."
            value={replyingTo === null ? newComment : ""}
            onChange={(e) => {
              if(replyingTo !== null) setReplyingTo(null);
              setNewComment(e.target.value);
            }}
            className="flex-1 bg-transparent text-sm px-4 py-2 outline-none"
          />
          <Button 
            type="submit" 
            size="sm" 
            variant="ghost" 
            className="rounded-full h-8 w-8 p-0"
            disabled={!newComment.trim() || commentMutation.isPending || replyingTo !== null}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>

      <div className="space-y-2 mt-4">
        {topLevelComments.map(comment => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}
