import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Trash, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/admin/comunidade")({
  component: AdminComunidade,
});

function AdminComunidade() {
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin_community_reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_post_reports')
        .select(`
          id, reason, created_at, post_id, user_id,
          reporter:profiles!community_post_reports_user_id_fkey (full_name),
          post:community_posts (
            content, image_url, created_at,
            author:profiles!community_posts_user_id_fkey (full_name, avatar_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const dismissMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase.from('community_post_reports').delete().eq('id', reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Denúncia descartada.");
      queryClient.invalidateQueries({ queryKey: ['admin_community_reports'] });
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      // Because of ON DELETE CASCADE, deleting the post will delete the reports
      const { error } = await supabase.from('community_posts').delete().eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Postagem excluída permanentemente.");
      queryClient.invalidateQueries({ queryKey: ['admin_community_reports'] });
    }
  });

  if (isLoading) return <div className="p-8">Carregando denúncias...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Moderação da Comunidade</h1>
        <p className="text-muted-foreground mt-2">Avalie e tome ações sobre postagens denunciadas pelos alunos.</p>
      </div>

      {reports?.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-primary/50" />
          Nenhuma denúncia pendente. A comunidade está em paz!
        </div>
      ) : (
        <div className="space-y-6">
          {reports?.map(report => (
            <div key={report.id} className="bg-card border border-destructive/20 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4 border-b border-border pb-4">
                <div>
                  <div className="text-sm font-medium text-destructive">Motivo da Denúncia:</div>
                  <div className="text-base mt-1">{report.reason}</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Denunciado por: {report.reporter?.full_name || "Desconhecido"} • {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: ptBR })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => { if(confirm("Ignorar esta denúncia?")) dismissMutation.mutate(report.id); }}
                    disabled={dismissMutation.isPending || deletePostMutation.isPending}
                  >
                    Descartar Denúncia
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => { if(confirm("Excluir postagem permanentemente?")) deletePostMutation.mutate(report.post_id); }}
                    disabled={dismissMutation.isPending || deletePostMutation.isPending}
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    Excluir Postagem
                  </Button>
                </div>
              </div>

              {/* Post Preview */}
              {report.post && (
                <div className="bg-muted/30 p-4 rounded-lg opacity-80">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={report.post.author?.avatar_url || ""} />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="text-sm font-semibold">{report.post.author?.full_name || "Usuário"}</div>
                    <div className="text-xs text-muted-foreground">
                      Publicado em: {new Date(report.post.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{report.post.content}</p>
                  {report.post.image_url && (
                    <img src={report.post.image_url} alt="Post content" className="mt-3 max-h-48 rounded object-cover" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
