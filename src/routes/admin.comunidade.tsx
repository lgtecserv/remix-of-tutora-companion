import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Trash, ShieldCheck, Search, LayoutList, Settings, AlertTriangle, Pin, PinOff, Plus, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/image-upload";
import { useState } from "react";

export const Route = createFileRoute("/admin/comunidade")({
  component: AdminComunidade,
});

function AdminComunidade() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Ad state
  const [newAdTitle, setNewAdTitle] = useState("");
  const [newAdDesc, setNewAdDesc] = useState("");
  const [newAdImage, setNewAdImage] = useState("");
  const [newAdLink, setNewAdLink] = useState("");
  const [newAdPlacement, setNewAdPlacement] = useState<"global_top"|"sidebar"|"feed">("global_top");

  // QUERY: Reports
  const { data: reports, isLoading: isLoadingReports } = useQuery({
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

  // QUERY: All Posts
  const { data: allPosts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ['admin_community_all_posts', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('community_posts')
        .select(`
          id, content, image_url, category, created_at, user_id, is_pinned,
          author:profiles!community_posts_user_id_fkey (full_name, avatar_url)
        `)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('content', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // QUERY: Ads
  const { data: ads, isLoading: isLoadingAds } = useQuery({
    queryKey: ['admin_community_ads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_ads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // MUTATIONS
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
      const { error } = await supabase.from('community_posts').delete().eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Postagem excluída permanentemente.");
      queryClient.invalidateQueries({ queryKey: ['admin_community_reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin_community_all_posts'] });
    }
  });

  const togglePinMutation = useMutation({
    mutationFn: async ({ postId, isPinned }: { postId: string, isPinned: boolean }) => {
      const { error } = await supabase.from('community_posts').update({ is_pinned: isPinned }).eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status de fixação alterado.");
      queryClient.invalidateQueries({ queryKey: ['admin_community_all_posts'] });
    }
  });

  const createAdMutation = useMutation({
    mutationFn: async () => {
      if(!newAdTitle) throw new Error("Título é obrigatório");
      const { error } = await supabase.from('community_ads').insert({
        title: newAdTitle,
        description: newAdDesc,
        image_url: newAdImage,
        link_url: newAdLink,
        placement: newAdPlacement,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Anúncio criado com sucesso!");
      setNewAdTitle("");
      setNewAdDesc("");
      setNewAdImage("");
      setNewAdLink("");
      queryClient.invalidateQueries({ queryKey: ['admin_community_ads'] });
    },
    onError: (e: any) => {
      toast.error(e.message || "Erro ao criar anúncio");
    }
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (adId: string) => {
      const { error } = await supabase.from('community_ads').delete().eq('id', adId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Anúncio removido.");
      queryClient.invalidateQueries({ queryKey: ['admin_community_ads'] });
    }
  });

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Gestão da Comunidade</h1>
        <p className="text-muted-foreground mt-2">Central de moderação e administração do fórum dos alunos.</p>
      </div>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Denúncias Pendentes
            {reports && reports.length > 0 && (
              <span className="bg-destructive text-destructive-foreground text-[10px] px-2 py-0.5 rounded-full ml-1">
                {reports.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <LayoutList className="w-4 h-4" />
            Todas as Postagens
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações e Anúncios
          </TabsTrigger>
        </TabsList>

        {/* ABA: DENÚNCIAS */}
        <TabsContent value="reports" className="space-y-6">
          {isLoadingReports ? (
            <div className="p-8 text-center text-muted-foreground">Carregando denúncias...</div>
          ) : reports?.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-primary/50" />
              Nenhuma denúncia pendente. A comunidade está em paz!
            </div>
          ) : (
            reports?.map(report => (
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
            ))
          )}
        </TabsContent>

        {/* ABA: TODAS AS POSTAGENS */}
        <TabsContent value="posts" className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Lista de Postagens</h2>
              <div className="relative w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Buscar postagem..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {isLoadingPosts ? (
              <div className="p-8 text-center text-muted-foreground">Carregando postagens...</div>
            ) : allPosts?.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                Nenhuma postagem encontrada.
              </div>
            ) : (
              <div className="space-y-4">
                {allPosts?.map(post => (
                  <div key={post.id} className={`flex justify-between items-center p-4 border rounded-lg ${post.is_pinned ? 'bg-primary/5 border-primary/20' : 'bg-background border-border'}`}>
                    <div className="flex items-start gap-4">
                      <Avatar className="w-10 h-10 mt-1">
                        <AvatarImage src={post.author?.avatar_url || ""} />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{post.author?.full_name || "Usuário"}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                          {post.category && (
                            <span className="bg-muted text-muted-foreground text-[10px] px-2 py-0.5 rounded-full">
                              {post.category}
                            </span>
                          )}
                          {post.is_pinned && (
                            <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Pin className="w-3 h-3" /> Fixado
                            </span>
                          )}
                        </div>
                        <p className="text-sm mt-1 text-foreground/90 max-w-2xl line-clamp-2">
                          {post.content}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant={post.is_pinned ? "secondary" : "outline"}
                        size="icon"
                        title={post.is_pinned ? "Desfixar postagem" : "Fixar postagem no topo"}
                        onClick={() => togglePinMutation.mutate({ postId: post.id, isPinned: !post.is_pinned })}
                        disabled={togglePinMutation.isPending}
                      >
                        {post.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => { if(confirm("Excluir esta postagem permanentemente?")) deletePostMutation.mutate(post.id); }}
                        disabled={deletePostMutation.isPending}
                        title="Excluir Postagem"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ABA: CONFIGURAÇÕES E ANÚNCIOS */}
        <TabsContent value="settings" className="space-y-6">
          
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
              <Megaphone className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Criar Novo Anúncio ou Aviso</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Título (obrigatório)</label>
                <Input value={newAdTitle} onChange={e => setNewAdTitle(e.target.value)} placeholder="Ex: Masterclass Hoje!" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Posicionamento</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={newAdPlacement} 
                  onChange={e => setNewAdPlacement(e.target.value as any)}
                >
                  <option value="global_top">Barra de Topo Global (Todo o app)</option>
                  <option value="sidebar">Painel Lateral da Comunidade</option>
                  <option value="feed">Injetado no meio do Feed</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição (opcional)</label>
                <Input value={newAdDesc} onChange={e => setNewAdDesc(e.target.value)} placeholder="Descrição curta..." />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Link de Destino (opcional)</label>
                <Input value={newAdLink} onChange={e => setNewAdLink(e.target.value)} placeholder="https://..." />
              </div>
              <div className="md:col-span-2">
                <div className="mb-2 p-3 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Dicas de Tamanho da Imagem</h4>
                  <ul className="text-xs text-blue-700/80 dark:text-blue-300/80 space-y-1 list-disc list-inside">
                    <li><strong>Banner de Topo Global:</strong> 1200x120px (Panorâmica fina). Se for muito alta, será cortada para caber no menu.</li>
                    <li><strong>Sidebar e Feed:</strong> 800x600px ou 800x800px (Retangular/Quadrada). Imagens verticais extremas também são cortadas para manter a organização.</li>
                  </ul>
                </div>
                <ImageUpload 
                  bucket="blog-images"
                  value={newAdImage} 
                  onChange={setNewAdImage}
                  label="Imagem do Anúncio" 
                />
              </div>
            </div>
            <Button onClick={() => createAdMutation.mutate()} disabled={createAdMutation.isPending || !newAdTitle}>
              <Plus className="w-4 h-4 mr-2" /> Criar Anúncio
            </Button>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Anúncios Ativos</h2>
            {isLoadingAds ? (
              <div className="text-sm text-muted-foreground">Carregando...</div>
            ) : ads?.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nenhum anúncio ativo no momento.</div>
            ) : (
              <div className="space-y-3">
                {ads?.map(ad => (
                  <div key={ad.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{ad.title} <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded ml-2">{ad.placement}</span></div>
                      {ad.description && <div className="text-sm text-muted-foreground mt-1">{ad.description}</div>}
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if(confirm("Excluir este anúncio?")) deleteAdMutation.mutate(ad.id) }}>
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </TabsContent>

      </Tabs>
    </div>
  );
}
