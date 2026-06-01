import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2, Plus, Edit2, Loader2, Image as ImageIcon, Link as LinkIcon, SwitchCamera } from "lucide-react";

export const Route = createFileRoute("/admin/banners")({
  component: AdminBanners,
});

function AdminBanners() {
  const qc = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [placement, setPlacement] = useState<"middle" | "end">("middle");
  const [targetCategory, setTargetCategory] = useState("");

  const { data: banners, isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_banners")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        image_url: imageUrl,
        target_url: targetUrl,
        placement,
        target_category: targetCategory || null,
        is_active: true,
      };

      if (editingId) {
        const { error } = await supabase.from("custom_banners").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("custom_banners").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Banner salvo com sucesso!");
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      resetForm();
    },
    onError: (err: any) => {
      toast.error(`Erro ao salvar: ${err.message}`);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("custom_banners").update({ is_active: !is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Banner apagado.");
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
    },
  });

  function resetForm() {
    setIsAdding(false);
    setEditingId(null);
    setName("");
    setImageUrl("");
    setTargetUrl("");
    setPlacement("middle");
    setTargetCategory("");
  }

  function handleEdit(b: any) {
    setIsAdding(true);
    setEditingId(b.id);
    setName(b.name);
    setImageUrl(b.image_url);
    setTargetUrl(b.target_url);
    setPlacement(b.placement);
    setTargetCategory(b.target_category || "");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Banners (Anúncios Próprios)</h1>
          <p className="text-sm text-muted-foreground mt-1">Coloque os seus próprios anúncios a meio ou no fim dos artigos do blog.</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Banner
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">{editingId ? "Editar Banner" : "Criar Novo Banner"}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Nome Interno</label>
              <Input placeholder="Ex: Banner Curso IA Black Friday" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Categoria Alvo (Deixe vazio para aparecer em todos)</label>
              <Input placeholder="Ex: Inteligência Artificial" value={targetCategory} onChange={(e) => setTargetCategory(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">URL da Imagem (Pode usar link do Imgur, Unsplash ou Supabase Storage)</label>
              <Input placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Link de Destino (Onde o utilizador vai parar se clicar)</label>
              <Input placeholder="https://www.imersaocompleta.info/app/curso/meu-curso" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Posição no Artigo</label>
              <select 
                value={placement} 
                onChange={(e) => setPlacement(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="middle">A meio do Artigo (Dividir Texto)</option>
                <option value="end">No Fim do Artigo</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={resetForm}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!name || !imageUrl || !targetUrl || saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Banner
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : banners?.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Nenhum banner configurado. Crie o seu primeiro anúncio próprio para monetizar o blog!
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {banners?.map((b) => (
            <div key={b.id} className={`flex flex-col rounded-xl border ${b.is_active ? 'border-primary/30 shadow-[0_0_15px_rgba(234,88,12,0.1)]' : 'border-border opacity-60'} bg-card overflow-hidden transition-all`}>
              <div className="h-32 bg-muted relative">
                <img src={b.image_url} alt={b.name} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className="bg-black/70 backdrop-blur text-white text-[10px] px-2 py-1 rounded-md uppercase font-bold tracking-wider">
                    {b.placement === 'middle' ? 'MEIO' : 'FIM'}
                  </span>
                  {b.target_category && (
                    <span className="bg-blue-600/90 text-white text-[10px] px-2 py-1 rounded-md font-bold truncate max-w-[100px]">
                      {b.target_category}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-foreground truncate">{b.name}</h3>
                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2 truncate">
                  <LinkIcon className="h-3 w-3 shrink-0" />
                  <span className="truncate">{b.target_url}</span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <button 
                    onClick={() => toggleMutation.mutate({ id: b.id, is_active: b.is_active })}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full ${b.is_active ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                  >
                    {b.is_active ? 'Ativo' : 'Pausado'}
                  </button>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(b)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { if(confirm('Apagar banner para sempre?')) deleteMutation.mutate(b.id) }} className="h-8 w-8 text-red-500/70 hover:text-red-500 hover:bg-red-500/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
