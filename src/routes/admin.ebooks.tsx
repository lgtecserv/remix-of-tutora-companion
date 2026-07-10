import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Copy, Trash2, Eye, EyeOff, Pencil, ArrowLeft, Upload, FileText, CheckCircle2, Loader2, BookOpen, Percent } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/ebooks")({ component: AdminEbooks });

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function AdminEbooks() {
  const qc = useQueryClient();
  const { user } = useAuth();
  
  const { data: ebooks, isLoading } = useQuery({
    queryKey: ["admin-ebooks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ebooks")
        .select(`*, author:profiles!ebooks_author_id_fkey(full_name)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      const { data: purchases } = await supabase.from("ebook_purchases").select("ebook_id");
      const map = new Map<string, number>();
      (purchases ?? []).forEach(p => map.set(p.ebook_id, (map.get(p.ebook_id) || 0) + 1));
      
      return (data ?? []).map(e => ({ ...e, salesCount: map.get(e.id) || 0 }));
    },
  });

  const [openCreate, setOpenCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [editingEbook, setEditingEbook] = useState<any>(null);
  const [uploadingPDF, setUploadingPDF] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreate() {
    if (!newTitle.trim()) return toast.error("Título obrigatório");
    const { data: created, error } = await supabase.from("ebooks").insert({ 
      title: newTitle.trim(), 
      slug: slugify(newTitle),
      author_id: user?.id,
      file_path: "temp" // Needs to be updated later
    }).select().single();
    
    if (error) return toast.error(error.message);
    toast.success("E-book criado! Agora faz o upload do PDF.");
    setOpenCreate(false); setNewTitle("");
    qc.invalidateQueries({ queryKey: ["admin-ebooks"] });
    setEditingEbook(created);
  }

  async function togglePublish(e: any) {
    if (!e.file_path || e.file_path === "temp") {
      return toast.error("Precisas de fazer upload do PDF antes de publicar.");
    }
    const { error } = await supabase.from("ebooks").update({ is_published: !e.is_published }).eq("id", e.id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin-ebooks"] });
  }

  async function remove(e: any) {
    if (!confirm(`Excluir o e-book "${e.title}"? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("ebooks").delete().eq("id", e.id);
    if (error) toast.error(error.message); else { toast.success("E-book excluído"); qc.invalidateQueries({ queryKey: ["admin-ebooks"] }); }
  }

  async function saveEdits(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    const { 
      id, title, description, price_mzn, category, format, pages_count, 
      allow_affiliates, affiliate_percentage,
      guarantee_days, support_email, access_time,
      fb_pixel_id, ga_pixel_id,
      coproducer_percentage,
      order_bump_price
    } = editingEbook;
    
    const { error } = await supabase.from("ebooks").update({
      title, description, price_mzn, category, format, pages_count, 
      allow_affiliates, affiliate_percentage,
      guarantee_days, support_email, access_time,
      fb_pixel_id, ga_pixel_id,
      coproducer_percentage,
      order_bump_price
    }).eq("id", id);
    setIsSaving(false);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Alterações guardadas");
      qc.invalidateQueries({ queryKey: ["admin-ebooks"] });
    }
  }

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingEbook) return;
    
    setUploadingPDF(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${editingEbook.id}.${fileExt}`;
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "ebooks");
    formData.append("path", filePath);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro no upload");
      }

      await supabase.from("ebooks").update({ file_path: filePath }).eq("id", editingEbook.id);
      setEditingEbook({ ...editingEbook, file_path: filePath });
      toast.success("PDF guardado com sucesso!");
    } catch (error: any) {
      toast.error("Erro no upload do PDF: " + error.message);
    }
    setUploadingPDF(false);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingEbook) return;
    
    setUploadingCover(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `ebook-covers/${editingEbook.id}.${fileExt}`;
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "course-covers");
    formData.append("path", filePath);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro no upload");
      }

      const { publicUrl } = await res.json();
      await supabase.from("ebooks").update({ cover_url: publicUrl }).eq("id", editingEbook.id);
      setEditingEbook({ ...editingEbook, cover_url: publicUrl });
      toast.success("Capa atualizada!");
    } catch (error: any) {
      toast.error("Erro no upload da capa: " + error.message);
    }
    setUploadingCover(false);
  };

  if (editingEbook) {
    return (
      <div className="space-y-6 max-w-5xl pb-20">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setEditingEbook(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Configurar Máquina de Vendas</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={saveEdits} className="space-y-6 rounded-xl border border-border bg-card p-6">
              <Tabs defaultValue="basico" className="w-full">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 mb-6 bg-muted p-1 rounded-lg">
                  <TabsTrigger value="basico">Básico & Suporte</TabsTrigger>
                  <TabsTrigger value="vendas">Preço & Afiliados</TabsTrigger>
                  <TabsTrigger value="marketing">Marketing & Upsell</TabsTrigger>
                </TabsList>

                {/* Tab: Básico */}
                <TabsContent value="basico" className="space-y-4">
                  <div>
                    <Label>Título do E-book</Label>
                    <Input value={editingEbook.title} onChange={e => setEditingEbook({...editingEbook, title: e.target.value})} />
                  </div>
                  <div>
                    <Label>Descrição (HTML suportado)</Label>
                    <Textarea className="h-32" value={editingEbook.description || ""} onChange={e => setEditingEbook({...editingEbook, description: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Categoria</Label>
                      <Input value={editingEbook.category || ""} onChange={e => setEditingEbook({...editingEbook, category: e.target.value})} />
                    </div>
                    <div>
                      <Label>Email de Suporte</Label>
                      <Input type="email" placeholder="ex: suporte@teusite.com" value={editingEbook.support_email || ""} onChange={e => setEditingEbook({...editingEbook, support_email: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Garantia (Dias)</Label>
                      <Input type="number" value={editingEbook.guarantee_days || 7} onChange={e => setEditingEbook({...editingEbook, guarantee_days: Number(e.target.value)})} />
                    </div>
                    <div>
                      <Label>Tempo Acesso</Label>
                      <Input placeholder="ex: Vitalício" value={editingEbook.access_time || "Vitalício"} onChange={e => setEditingEbook({...editingEbook, access_time: e.target.value})} />
                    </div>
                    <div>
                      <Label>Páginas</Label>
                      <Input type="number" value={editingEbook.pages_count || ""} onChange={e => setEditingEbook({...editingEbook, pages_count: Number(e.target.value)})} />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab: Vendas e Afiliados */}
                <TabsContent value="vendas" className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Preço (MT)</Label>
                      <Input type="number" value={editingEbook.price_mzn} onChange={e => setEditingEbook({...editingEbook, price_mzn: Number(e.target.value)})} />
                    </div>
                    <div>
                      <Label>Formato do Ficheiro</Label>
                      <Input value={editingEbook.format || "PDF"} onChange={e => setEditingEbook({...editingEbook, format: e.target.value})} />
                    </div>
                  </div>
                  
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base flex items-center gap-2"><Percent className="h-4 w-4 text-primary" /> Programa de Afiliados</Label>
                        <p className="text-sm text-muted-foreground">Permitir que outros alunos promovam e vendam este e-book.</p>
                      </div>
                      <Switch checked={!!editingEbook.allow_affiliates} onCheckedChange={c => setEditingEbook({...editingEbook, allow_affiliates: c})} />
                    </div>
                    {editingEbook.allow_affiliates && (
                      <div className="pt-2">
                        <Label>Percentagem de Comissão (%)</Label>
                        <Input type="number" className="w-1/3 mt-1" value={editingEbook.affiliate_percentage || 0} onChange={e => setEditingEbook({...editingEbook, affiliate_percentage: Number(e.target.value)})} />
                        <p className="text-xs text-muted-foreground mt-2">
                          Se venderes por {editingEbook.price_mzn || 0} MT, o afiliado ganha {((editingEbook.price_mzn || 0) * ((editingEbook.affiliate_percentage || 0) / 100)).toFixed(2)} MT por venda.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-border p-4 space-y-4">
                    <Label className="text-base flex items-center gap-2">🤝 Coprodução</Label>
                    <p className="text-sm text-muted-foreground">Divide as tuas comissões automaticamente com um parceiro de negócio.</p>
                    <div>
                      <Label>Comissão do Coprodutor (%)</Label>
                      <Input type="number" className="w-1/3 mt-1" value={editingEbook.coproducer_percentage || 0} onChange={e => setEditingEbook({...editingEbook, coproducer_percentage: Number(e.target.value)})} />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab: Marketing */}
                <TabsContent value="marketing" className="space-y-6">
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-4">
                    <Label className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-500">🚀 Order Bump (Upsell no Checkout)</Label>
                    <p className="text-sm text-muted-foreground">Oferece um produto adicional com desconto diretamente na janela de pagamento.</p>
                    <div>
                      <Label>Preço do Order Bump (MT)</Label>
                      <Input type="number" className="w-1/3 mt-1" value={editingEbook.order_bump_price || 0} onChange={e => setEditingEbook({...editingEbook, order_bump_price: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div className="rounded-xl border border-border p-4 space-y-4">
                    <Label className="text-base flex items-center gap-2">📈 Pixels de Rastreamento (SEO)</Label>
                    <div className="space-y-4">
                      <div>
                        <Label>Facebook Pixel ID</Label>
                        <Input placeholder="ex: 100234567890" value={editingEbook.fb_pixel_id || ""} onChange={e => setEditingEbook({...editingEbook, fb_pixel_id: e.target.value})} />
                      </div>
                      <div>
                        <Label>Google Analytics ID (GA4)</Label>
                        <Input placeholder="ex: G-XXXXXXXXXX" value={editingEbook.ga_pixel_id || ""} onChange={e => setEditingEbook({...editingEbook, ga_pixel_id: e.target.value})} />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Button type="submit" disabled={isSaving} className="w-full mt-4 h-12 text-md">
                {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Guardar Todas as Configurações
              </Button>
            </form>

            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Ficheiro Seguro (E-book)</h3>
              <p className="text-sm text-muted-foreground">Este ficheiro será guardado num cofre privado. Os alunos só recebem um link temporário após a compra.</p>
              
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-secondary/30">
                {editingEbook.file_path && editingEbook.file_path !== "temp" ? (
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                ) : (
                  <FileText className="h-8 w-8 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <div className="font-medium">{editingEbook.file_path && editingEbook.file_path !== "temp" ? "PDF Carregado" : "Nenhum PDF"}</div>
                  <div className="text-xs text-muted-foreground">Formato aceite: .pdf, .epub, .zip</div>
                </div>
                <div>
                  <input type="file" id="pdf-upload" className="hidden" accept=".pdf,.epub,.zip" onChange={handlePdfUpload} />
                  <label htmlFor="pdf-upload">
                    <Button variant="outline" asChild disabled={uploadingPDF}>
                      <span className="cursor-pointer">
                        {uploadingPDF ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                        {editingEbook.file_path !== "temp" ? "Substituir" : "Carregar"}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h3 className="font-bold">Capa do E-book</h3>
              <div className="aspect-[3/4] rounded-lg bg-muted border border-border overflow-hidden relative">
                {editingEbook.cover_url ? (
                  <img src={editingEbook.cover_url} alt="Cover" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <BookOpen className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                  <input type="file" id="cover-upload" className="hidden" accept="image/*" onChange={handleCoverUpload} />
                  <label htmlFor="cover-upload">
                    <Button variant="secondary" asChild disabled={uploadingCover}>
                      <span className="cursor-pointer">
                        {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                        Alterar Capa
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-primary" /> E-books & PLR
        </h1>
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Adicionar E-book</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo E-book</DialogTitle>
              <DialogDescription>
                Introduza o título do seu novo E-book para começar.
              </DialogDescription>
            </DialogHeader>
            <div><Label>Título do Livro *</Label><Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ex.: Como Ganhar Dinheiro na Internet" /></div>
            <DialogFooter><Button onClick={handleCreate}>Criar e continuar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> A carregar loja...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">E-book</th>
                <th className="px-4 py-3">Autor</th>
                <th className="px-4 py-3">Vendas</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(ebooks ?? []).map((e: any) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground flex items-center gap-3">
                    <div className="h-10 w-8 bg-muted rounded overflow-hidden shrink-0">
                      {e.cover_url ? <img src={e.cover_url} className="h-full w-full object-cover" /> : null}
                    </div>
                    {e.title}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{e.author?.full_name || "Imersão Completa"}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{e.salesCount}</td>
                  <td className="px-4 py-3">{e.price_mzn > 0 ? `${e.price_mzn} MT` : "Grátis"}</td>
                  <td className="px-4 py-3">
                    {e.is_published ? 
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Publicado</span> : 
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">Rascunho</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditingEbook(e)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => togglePublish(e)} title={e.is_published ? "Despublicar" : "Publicar"}>
                        {e.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(e)} title="Excluir"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && (ebooks?.length ?? 0) === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Nenhum e-book disponível. Adicione o primeiro.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
