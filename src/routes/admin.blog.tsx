import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/blog")({ component: AdminBlog });

function slugify(s: string) { return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

function AdminBlog() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-blog"], queryFn: async () => (await supabase.from("blog_posts").select("*").order("created_at", { ascending: false })).data ?? [] });
  const [editing, setEditing] = useState<any>(null);

  function newPost() { setEditing({ title: "", excerpt: "", content: "", cover_url: "", category: "", seo_title: "", seo_description: "", is_published: false }); }

  async function save() {
    const payload = { ...editing, slug: editing.slug || slugify(editing.title), published_at: editing.is_published ? (editing.published_at ?? new Date().toISOString()) : null };
    if (editing.id) {
      const { id, created_at, updated_at, ...rest } = payload;
      const { error } = await supabase.from("blog_posts").update(rest).eq("id", id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("blog_posts").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Salvo"); setEditing(null); qc.invalidateQueries({ queryKey: ["admin-blog"] });
  }

  async function togglePub(p: any) { await supabase.from("blog_posts").update({ is_published: !p.is_published, published_at: !p.is_published ? new Date().toISOString() : null }).eq("id", p.id); qc.invalidateQueries({ queryKey: ["admin-blog"] }); }
  async function remove(p: any) { if (!confirm("Excluir?")) return; await supabase.from("blog_posts").delete().eq("id", p.id); qc.invalidateQueries({ queryKey: ["admin-blog"] }); }

  if (editing) {
    return (
      <div className="max-w-3xl space-y-4">
        <button onClick={() => setEditing(null)} className="text-sm text-muted-foreground hover:text-primary">← Voltar</button>
        <h1 className="text-2xl font-bold text-secondary">{editing.id ? "Editar artigo" : "Novo artigo"}</h1>
        <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <div><Label>Título</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
          <div><Label>Categoria</Label><Input value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></div>
          <div><Label>URL da capa</Label><Input value={editing.cover_url ?? ""} onChange={(e) => setEditing({ ...editing, cover_url: e.target.value })} /></div>
          <div><Label>Resumo</Label><Textarea value={editing.excerpt ?? ""} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} rows={2} /></div>
          <div><Label>Conteúdo</Label><Textarea value={editing.content ?? ""} onChange={(e) => setEditing({ ...editing, content: e.target.value })} rows={12} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>SEO Título</Label><Input value={editing.seo_title ?? ""} onChange={(e) => setEditing({ ...editing, seo_title: e.target.value })} /></div>
            <div><Label>SEO Descrição</Label><Input value={editing.seo_description ?? ""} onChange={(e) => setEditing({ ...editing, seo_description: e.target.value })} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editing.is_published} onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })} />Publicado</label>
          <Button onClick={save}>Salvar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-secondary">Blog</h1>
        <Button onClick={newPost}><Plus className="h-4 w-4" />Novo artigo</Button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-3">Título</th><th className="px-4 py-3">Categoria</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Ações</th></tr></thead>
          <tbody>
            {(data ?? []).map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-secondary">{p.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.category ?? "—"}</td>
                <td className="px-4 py-3">{p.is_published ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Publicado</span> : <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Rascunho</span>}</td>
                <td className="px-4 py-3"><div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(p)}>Editar</Button>
                  <Button variant="ghost" size="icon" onClick={() => togglePub(p)}>{p.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(p)}><Trash2 className="h-4 w-4" /></Button>
                </div></td>
              </tr>
            ))}
            {(data?.length ?? 0) === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Nenhum artigo.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}