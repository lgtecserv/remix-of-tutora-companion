import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Eye } from "lucide-react";
import { toast } from "sonner";
import { RichEditor } from "@/components/rich-editor";
import { ImageUpload } from "@/components/image-upload";
import { TagInput } from "@/components/tag-input";

export const Route = createFileRoute("/admin/blog/$id")({ component: EditPost });

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function EditPost() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-post", id],
    queryFn: async () => (await supabase.from("blog_posts").select("*").eq("id", id).maybeSingle()).data,
  });
  const [f, setF] = useState<any>(null);
  const [preview, setPreview] = useState(false);

  useEffect(() => { if (data) setF(data); }, [data]);

  async function save() {
    if (!f.title?.trim()) return toast.error("Título obrigatório");
    const slug = f.slug?.trim() || slugify(f.title);
    const words = (f.content ?? "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    const reading_minutes = Math.max(1, Math.round(words / 200));
    const payload = {
      title: f.title.trim(),
      slug,
      excerpt: f.excerpt ?? "",
      content: f.content ?? "",
      cover_url: f.cover_url ?? "",
      category: f.category ?? "",
      tags: f.tags ?? [],
      seo_title: f.seo_title ?? "",
      seo_description: f.seo_description ?? "",
      is_published: !!f.is_published,
      published_at: f.is_published ? (f.published_at ?? new Date().toISOString()) : null,
      scheduled_at: f.scheduled_at || null,
      reading_minutes,
    };
    const { error } = await supabase.from("blog_posts").update(payload).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Salvo"); qc.invalidateQueries({ queryKey: ["admin-post", id] }); qc.invalidateQueries({ queryKey: ["admin-blog"] });
  }

  if (!f) return <div className="text-muted-foreground">A carregar...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/admin/blog" className="text-sm text-muted-foreground hover:text-primary">← Voltar para blog</Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPreview(true)}><Eye className="h-4 w-4" />Pré-visualizar</Button>
          <div className="flex items-center gap-2 text-sm">
            <Switch id="is-published-blog-switch" checked={!!f.is_published} onCheckedChange={(v) => setF({ ...f, is_published: v })} />
            <Label htmlFor="is-published-blog-switch" className="cursor-pointer font-medium">Publicar</Label>
          </div>
          <Button onClick={save}><Save className="h-4 w-4" />Salvar</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Input value={f.title ?? ""} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Título do artigo" className="h-auto text-3xl font-bold border-0 px-0 shadow-none focus-visible:ring-0" />
          <Input value={f.excerpt ?? ""} onChange={(e) => setF({ ...f, excerpt: e.target.value })} placeholder="Resumo curto..." className="border-0 px-0 text-base text-muted-foreground shadow-none focus-visible:ring-0" />
          <RichEditor value={f.content ?? ""} onChange={(html) => setF({ ...f, content: html })} placeholder="Escreva o seu artigo..." />
        </div>

        <aside className="space-y-4">
          <Tabs defaultValue="general">
            <TabsList className="w-full"><TabsTrigger value="general" className="flex-1">Geral</TabsTrigger><TabsTrigger value="seo" className="flex-1">SEO</TabsTrigger></TabsList>
            <TabsContent value="general" className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <ImageUpload bucket="blog-covers" label="Capa" value={f.cover_url ?? ""} onChange={(url) => setF({ ...f, cover_url: url })} />
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <div><Label>Slug (URL)</Label><Input value={f.slug ?? ""} onChange={(e) => setF({ ...f, slug: e.target.value })} /></div>
                <div><Label>Categoria</Label><Input value={f.category ?? ""} onChange={(e) => setF({ ...f, category: e.target.value })} /></div>
                <div><Label>Tags</Label><TagInput value={f.tags ?? []} onChange={(tags) => setF({ ...f, tags })} /></div>
                <div>
                  <Label>Agendar publicação</Label>
                  <Input type="datetime-local" value={f.scheduled_at ? new Date(f.scheduled_at).toISOString().slice(0, 16) : ""} onChange={(e) => setF({ ...f, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="seo" className="space-y-3">
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <div><Label>SEO Título</Label><Input maxLength={60} value={f.seo_title ?? ""} onChange={(e) => setF({ ...f, seo_title: e.target.value })} /><div className="text-xs text-muted-foreground">{(f.seo_title ?? "").length}/60</div></div>
                <div><Label>SEO Descrição</Label><Textarea maxLength={160} rows={3} value={f.seo_description ?? ""} onChange={(e) => setF({ ...f, seo_description: e.target.value })} /><div className="text-xs text-muted-foreground">{(f.seo_description ?? "").length}/160</div></div>
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/70 p-4" onClick={() => setPreview(false)}>
          <article className="mx-auto max-w-3xl rounded-2xl bg-background p-8" onClick={(e) => e.stopPropagation()}>
            {f.cover_url && <img src={f.cover_url} alt="" className="mb-6 max-h-80 w-full rounded-xl object-cover" />}
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{f.category ?? "Artigo"}</div>
            <h1 className="mt-2 text-3xl font-bold text-secondary">{f.title}</h1>
            {f.excerpt && <p className="mt-2 text-lg text-muted-foreground">{f.excerpt}</p>}
            <div className="prose prose-sm mt-6 max-w-none" dangerouslySetInnerHTML={{ __html: f.content ?? "" }} />
            <Button variant="outline" className="mt-6" onClick={() => setPreview(false)}>Fechar</Button>
          </article>
        </div>
      )}
    </div>
  );
}