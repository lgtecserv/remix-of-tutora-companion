import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Eye, Sparkles, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { if (data) setF(data); }, [data]);

  const { seoScore, checks, wordCount, readingTime } = useMemo(() => {
    if (!f) return { seoScore: 0, checks: [], wordCount: 0, readingTime: 1 };
    
    let score = 0;
    const checks = [];
    
    const contentStr = f.content?.toLowerCase() ?? "";
    const titleStr = f.title?.toLowerCase() ?? "";
    const keyword = f.primary_keyword?.toLowerCase() ?? "";
    const words = contentStr.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;

    if (keyword) {
      if (titleStr.includes(keyword)) {
        score += 20; checks.push({ passed: true, label: "Palavra-chave no título" });
      } else {
        checks.push({ passed: false, label: "Palavra-chave ausente no título" });
      }

      if (contentStr.includes(keyword)) {
        score += 20; checks.push({ passed: true, label: "Palavra-chave no conteúdo" });
      } else {
        checks.push({ passed: false, label: "Palavra-chave ausente no conteúdo" });
      }
      
      const regex = new RegExp(keyword, "g");
      const count = (contentStr.match(regex) || []).length;
      const density = words > 0 ? (count / words) * 100 : 0;
      if (density >= 0.5 && density <= 2.5) {
        score += 10; checks.push({ passed: true, label: "Densidade de Keyword ótima (0.5% a 2.5%)" });
      } else if (density > 2.5) {
        checks.push({ passed: false, label: "Aviso: Keyword stuffing detectado (>2.5%)" });
      } else {
        checks.push({ passed: false, label: "Densidade de Keyword baixa (<0.5%)" });
      }
    } else {
      checks.push({ passed: false, label: "Palavra-chave principal não definida" });
    }

    if (words > 300) {
      score += 15; checks.push({ passed: true, label: "Conteúdo com mais de 300 palavras" });
    } else {
      checks.push({ passed: false, label: "O conteúdo devia ter mais de 300 palavras" });
    }

    if (f.seo_title && f.seo_title.length >= 40 && f.seo_title.length <= 60) {
      score += 15; checks.push({ passed: true, label: "Tamanho do Título SEO ideal (40-60)" });
    } else {
      checks.push({ passed: false, label: "Título SEO devia ter entre 40 e 60 caracteres" });
    }

    if (f.seo_description && f.seo_description.length >= 120 && f.seo_description.length <= 160) {
      score += 10; checks.push({ passed: true, label: "Tamanho da Meta Description ideal (120-160)" });
    } else {
      checks.push({ passed: false, label: "Meta Description devia ter entre 120 e 160 caracteres" });
    }

    if (f.cover_url && f.cover_alt) {
      score += 10; checks.push({ passed: true, label: "Imagem de capa possui atributo ALT" });
    } else {
      checks.push({ passed: false, label: "Falta atributo ALT na imagem de capa" });
    }

    return { 
      seoScore: Math.min(100, Math.round(score)), 
      checks, 
      wordCount: words,
      readingTime: Math.max(1, Math.round(words / 200))
    };
  }, [f]);

  async function save() {
    if (!f.title?.trim()) return toast.error("Título obrigatório");
    
    setIsSaving(true);
    const slug = f.slug?.trim() || slugify(f.title);
    
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
      reading_minutes: readingTime,
      // Advanced SEO fields
      primary_keyword: f.primary_keyword ?? null,
      secondary_keywords: f.secondary_keywords ?? [],
      llm_summary: f.llm_summary ?? null,
      seo_score: seoScore,
      key_takeaways: f.key_takeaways ?? [],
      cover_alt: f.cover_alt ?? null,
    };
    
    try {
      const { error } = await supabase.from("blog_posts").update(payload).eq("id", id);
      if (error) {
        if (error.message.includes("does not exist")) {
          toast.error("Colunas SEO em falta na Base de Dados. Peça para correr o script SQL no painel Supabase.");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Artigo guardado com sucesso!"); 
        qc.invalidateQueries({ queryKey: ["admin-post", id] }); 
        qc.invalidateQueries({ queryKey: ["admin-blog"] });
        
        // Se estiver a publicar, avisa motores de busca
        if (payload.is_published && (!data?.is_published || true)) {
          import('@/actions/seo').then(({ pingSearchEngines }) => {
            pingSearchEngines({ data: `/blog/${payload.slug}` }).then((res: any) => {
              if (res.success) toast.success("Google & Bing notificados!");
            });
          });
        }
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  }

  function getScoreColor(score: number) {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  }

  if (!f) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-4 border-b border-border">
        <Link to="/admin/blog" className="text-sm font-medium text-muted-foreground hover:text-primary">← Voltar ao Gestor de Conteúdos</Link>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-4 px-4 py-1.5 rounded-full bg-muted/50 border border-border/50 text-sm">
            <span className="text-muted-foreground"><span className="font-bold text-foreground">{wordCount}</span> palavras</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="text-muted-foreground"><span className="font-bold text-foreground">{readingTime}</span> min leitura</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className={`font-bold flex items-center gap-1 ${getScoreColor(seoScore)}`}>
              SEO: {seoScore}/100
            </span>
          </div>
          
          <Button variant="outline" onClick={() => setPreview(true)}><Eye className="h-4 w-4 mr-2" />Preview</Button>
          <div className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-2 rounded-lg border border-border/50">
            <Switch id="is-published-blog-switch" checked={!!f.is_published} onCheckedChange={(v) => setF({ ...f, is_published: v })} />
            <Label htmlFor="is-published-blog-switch" className="cursor-pointer font-bold">
              {f.is_published ? <span className="text-primary">Publicado</span> : "Rascunho"}
            </Label>
          </div>
          <Button onClick={save} disabled={isSaving}>
            {isSaving ? <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4 mr-2" />}
            Guardar Alterações
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Main Editor Content */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Input 
              value={f.title ?? ""} 
              onChange={(e) => setF({ ...f, title: e.target.value })} 
              placeholder="Escreva um título irresistível..." 
              className="h-auto text-4xl md:text-5xl font-black border-0 px-0 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/30 bg-transparent" 
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-muted-foreground">Resumo do artigo (Exibido nos cartões do blog)</Label>
            <Textarea 
              value={f.excerpt ?? ""} 
              onChange={(e) => setF({ ...f, excerpt: e.target.value })} 
              placeholder="Um breve resumo cativante do que os leitores vão encontrar neste artigo..." 
              className="border-0 px-4 py-3 text-lg text-foreground bg-muted/30 shadow-none focus-visible:ring-1 resize-none min-h-[100px] rounded-xl" 
            />
          </div>

          <div className="prose-editor-container bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="bg-muted/30 border-b border-border px-4 py-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Sparkles className="w-3 h-3 text-primary" /> Editor Avançado de Conteúdo
            </div>
            <div className="p-4 min-h-[500px]">
              <RichEditor 
                value={f.content ?? ""} 
                onChange={(html) => setF({ ...f, content: html })} 
                placeholder="Escreva a sua obra-prima... Suporta H2, H3, Links, Imagens, Listas, Negrito." 
              />
            </div>
          </div>
        </div>

        {/* Sidebar Tools */}
        <aside className="space-y-6">
          <Tabs defaultValue="seo" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-4 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="seo" className="rounded-lg">SEO & IA</TabsTrigger>
              <TabsTrigger value="geral" className="rounded-lg">Publicação</TabsTrigger>
              <TabsTrigger value="media" className="rounded-lg">Média</TabsTrigger>
            </TabsList>
            
            <TabsContent value="seo" className="space-y-6 mt-0">
              {/* Real-time SEO Analyzer */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Sparkles className="w-24 h-24" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> Analisador IA
                  </h3>
                  <span className={`text-2xl font-black ${getScoreColor(seoScore)}`}>{seoScore}</span>
                </div>
                
                <div className="space-y-2.5 pt-2">
                  {checks.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      {c.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      )}
                      <span className={c.passed ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
                <h3 className="font-bold text-foreground border-b border-border/50 pb-2">Palavras-chave</h3>
                <div className="space-y-3">
                  <div>
                    <Label>Focus Keyword (Principal)</Label>
                    <Input 
                      placeholder="Ex: curso de programação" 
                      value={f.primary_keyword ?? ""} 
                      onChange={(e) => setF({ ...f, primary_keyword: e.target.value })} 
                      className="bg-muted/50"
                    />
                  </div>
                  <div>
                    <Label>Keywords Secundárias</Label>
                    <TagInput 
                      value={f.secondary_keywords ?? []} 
                      onChange={(t) => setF({ ...f, secondary_keywords: t })} 
                    />
                  </div>
                </div>
              </div>

              {/* Meta Data */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
                <h3 className="font-bold text-foreground border-b border-border/50 pb-2">Google Meta Tags</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <Label>SEO Title</Label>
                      <span className={`text-xs ${(f.seo_title?.length || 0) > 60 ? "text-red-500" : "text-muted-foreground"}`}>
                        {f.seo_title?.length || 0}/60
                      </span>
                    </div>
                    <Input maxLength={70} value={f.seo_title ?? ""} onChange={(e) => setF({ ...f, seo_title: e.target.value })} className="bg-muted/50" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <Label>SEO Description</Label>
                      <span className={`text-xs ${(f.seo_description?.length || 0) > 160 ? "text-red-500" : "text-muted-foreground"}`}>
                        {f.seo_description?.length || 0}/160
                      </span>
                    </div>
                    <Textarea maxLength={200} rows={3} value={f.seo_description ?? ""} onChange={(e) => setF({ ...f, seo_description: e.target.value })} className="bg-muted/50 resize-none" />
                  </div>
                  <div>
                    <Label>URL Amigável (Slug)</Label>
                    <Input value={f.slug ?? ""} onChange={(e) => setF({ ...f, slug: slugify(e.target.value) })} className="bg-muted/50 font-mono text-xs" />
                  </div>
                </div>
              </div>

              {/* AI & Generative Engine Optimization */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4 shadow-sm">
                <h3 className="font-bold text-primary flex items-center gap-2 border-b border-primary/10 pb-2">
                  <Sparkles className="w-4 h-4" /> Generative Engine Optimization
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-primary-foreground/70 dark:text-primary/80">LLM Summary (Resumo para IA)</Label>
                    <p className="text-xs text-muted-foreground mb-2">Um resumo estruturado para ensinar ChatGPT e Perplexity sobre o que trata este artigo.</p>
                    <Textarea 
                      rows={4} 
                      placeholder="Este artigo detalha o passo-a-passo de..."
                      value={f.llm_summary ?? ""} 
                      onChange={(e) => setF({ ...f, llm_summary: e.target.value })} 
                      className="bg-background border-primary/20 resize-none text-sm" 
                    />
                  </div>
                  <div>
                    <Label className="text-primary-foreground/70 dark:text-primary/80">Key Takeaways (Pontos Chave)</Label>
                    <TagInput 
                      value={f.key_takeaways ?? []} 
                      onChange={(t) => setF({ ...f, key_takeaways: t })} 
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="geral" className="space-y-4 mt-0">
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
                <h3 className="font-bold text-foreground border-b border-border/50 pb-2">Organização</h3>
                <div className="space-y-3">
                  <div>
                    <Label>Categoria</Label>
                    <Input placeholder="Ex: Tecnologia" value={f.category ?? ""} onChange={(e) => setF({ ...f, category: e.target.value })} className="bg-muted/50" />
                  </div>
                  <div>
                    <Label>Tags Padrão</Label>
                    <TagInput value={f.tags ?? []} onChange={(tags) => setF({ ...f, tags })} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
                <h3 className="font-bold text-foreground border-b border-border/50 pb-2">Agendamento</h3>
                <div className="space-y-3">
                  <div>
                    <Label>Agendar publicação para:</Label>
                    <Input 
                      type="datetime-local" 
                      className="bg-muted/50 mt-1"
                      value={f.scheduled_at ? new Date(f.scheduled_at).toISOString().slice(0, 16) : ""} 
                      onChange={(e) => setF({ ...f, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null })} 
                    />
                  </div>
                  {f.scheduled_at && (
                    <div className="text-xs text-amber-500 flex items-center gap-2">
                      <AlertCircle className="w-3 h-3" />
                      Artigo será publicado automaticamente.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4 mt-0">
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
                <h3 className="font-bold text-foreground border-b border-border/50 pb-2">Imagem de Capa (Destacada)</h3>
                <div className="space-y-4">
                  <ImageUpload 
                    bucket="blog-covers" 
                    label="Upload da Imagem" 
                    value={f.cover_url ?? ""} 
                    onChange={(url) => setF({ ...f, cover_url: url })} 
                  />
                  <div>
                    <Label>ALT Text (Texto Alternativo)</Label>
                    <p className="text-xs text-muted-foreground mb-1">Crucial para SEO de imagens e acessibilidade.</p>
                    <Input 
                      placeholder="Descreva a imagem..." 
                      value={f.cover_alt ?? ""} 
                      onChange={(e) => setF({ ...f, cover_alt: e.target.value })} 
                      className="bg-muted/50" 
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

          </Tabs>
        </aside>
      </div>

      {/* Fullscreen Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/80 backdrop-blur-sm p-4 flex justify-center items-start pt-10" onClick={() => setPreview(false)}>
          <article className="w-full max-w-4xl rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-2xl overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
            <Button variant="outline" className="absolute top-4 right-4 z-10 bg-black/50 backdrop-blur-md border-white/20 text-white" onClick={() => setPreview(false)}>
              <XCircle className="w-4 h-4 mr-2" /> Fechar Preview
            </Button>
            
            {/* Magazine Header Preview */}
            <div className="relative w-full h-[400px]">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent z-10" />
              {f.cover_url ? (
                <img src={f.cover_url} alt={f.cover_alt || f.title} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground">Sem Capa</div>
              )}
              
              <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 md:p-12">
                {f.category && (
                  <span className="inline-block rounded bg-primary px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-sm mb-4 w-max">
                    {f.category}
                  </span>
                )}
                <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
                  {f.title || "Título do Artigo"}
                </h1>
                <div className="flex items-center gap-4 text-sm font-medium text-white/60">
                  <span>Hoje</span>
                  <span className="h-1 w-1 rounded-full bg-white/30" />
                  <span>{readingTime} min leitura</span>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-12 pt-6 mx-auto max-w-3xl">
              {f.excerpt && (
                <p className="text-xl text-white/80 leading-relaxed font-light mb-10 border-l-4 border-primary pl-6">
                  {f.excerpt}
                </p>
              )}
              
              {/* Key Takeaways Preview */}
              {(f.key_takeaways ?? []).length > 0 && (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 mb-10">
                  <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" /> Principais Conclusões
                  </h4>
                  <ul className="space-y-2">
                    {(f.key_takeaways as string[]).map((k, i) => (
                      <li key={i} className="flex items-start gap-2 text-white/80">
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /> <span>{k}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="prose prose-invert prose-orange prose-lg max-w-none text-white/70" dangerouslySetInnerHTML={{ __html: f.content ?? "<p>O conteúdo do seu artigo aparecerá aqui...</p>" }} />
            </div>
          </article>
        </div>
      )}
    </div>
  );
}