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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Lock, Unlock, ChevronUp, ChevronDown, Save, Pencil } from "lucide-react";
import { toast } from "sonner";
import { extractYouTubeId, youTubeThumb, extractVimeoId } from "@/lib/youtube";
import { ImageUpload } from "@/components/image-upload";
import { VideoUpload } from "@/components/video-upload";
import { TagInput } from "@/components/tag-input";
import { StringList } from "@/components/string-list";

export const Route = createFileRoute("/admin/cursos/$id")({ component: EditCourse });

function EditCourse() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-course", id],
    queryFn: async () => {
      const { data: course } = await supabase.from("courses").select("*").eq("id", id).maybeSingle();
      const { data: modules } = await supabase.from("modules").select("*").eq("course_id", id).order("position");
      const moduleIds = (modules ?? []).map((m) => m.id);
      const { data: lessons } = moduleIds.length
        ? await supabase.from("lessons").select("*").in("module_id", moduleIds).order("position")
        : { data: [] as any[] };
      const { data: instructors } = await supabase.from("instructors").select("*").order("name");
      return { course, modules: modules ?? [], lessons: lessons ?? [], instructors: instructors ?? [] };
    },
  });

  const [form, setForm] = useState<any>(null);
  useEffect(() => { if (data?.course) setForm(data.course); }, [data?.course]);

  async function saveCourse() {
    const { id: _, created_at, updated_at, ...rest } = form;
    if (!rest.title?.trim()) return toast.error("Título obrigatório");
    if (!rest.slug?.trim()) rest.slug = rest.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (rest.is_free) rest.price_mzn = 0;
    const { error } = await supabase.from("courses").update(rest).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Salvo"); qc.invalidateQueries({ queryKey: ["admin-course", id] }); qc.invalidateQueries({ queryKey: ["admin-courses"] }); }
  }

  async function togglePublish() {
    const next = !form.is_published;
    setForm({ ...form, is_published: next });
    const { error } = await supabase.from("courses").update({ is_published: next }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(next ? "Publicado" : "Despublicado"); qc.invalidateQueries({ queryKey: ["admin-course", id] }); }
  }

  async function addModule() {
    const title = prompt("Nome do módulo:"); if (!title) return;
    const pos = (data?.modules.length ?? 0);
    const { error } = await supabase.from("modules").insert({ course_id: id, title, position: pos });
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin-course", id] });
  }
  async function renameModule(m: any) {
    const title = prompt("Renomear módulo:", m.title); if (!title) return;
    await supabase.from("modules").update({ title }).eq("id", m.id);
    qc.invalidateQueries({ queryKey: ["admin-course", id] });
  }
  async function deleteModule(m: any) {
    if (!confirm(`Excluir módulo "${m.title}" e todas suas aulas?`)) return;
    await supabase.from("lessons").delete().in("id", (data?.lessons ?? []).filter((l) => l.module_id === m.id).map((l) => l.id));
    await supabase.from("modules").delete().eq("id", m.id);
    qc.invalidateQueries({ queryKey: ["admin-course", id] });
  }
  async function moveModule(m: any, dir: -1 | 1) {
    const sorted = [...(data?.modules ?? [])].sort((a, b) => a.position - b.position);
    const i = sorted.findIndex((x) => x.id === m.id);
    const j = i + dir; if (j < 0 || j >= sorted.length) return;
    await Promise.all([
      supabase.from("modules").update({ position: sorted[j].position }).eq("id", m.id),
      supabase.from("modules").update({ position: m.position }).eq("id", sorted[j].id),
    ]);
    qc.invalidateQueries({ queryKey: ["admin-course", id] });
  }

  if (!form) return <div className="text-muted-foreground">A carregar...</div>;

  return (
    <div className="space-y-6">
      <Link to="/admin/cursos" className="text-sm text-muted-foreground hover:text-primary">← Voltar para cursos</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-secondary">{form.title}</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-secondary">
            <Switch id="is-published-switch" checked={!!form.is_published} onCheckedChange={togglePublish} />
            <Label htmlFor="is-published-switch" className="cursor-pointer font-medium">{form.is_published ? "Publicado" : "Rascunho"}</Label>
          </div>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="curriculum">Currículo</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
              <h2 className="font-semibold text-secondary">Informações do curso</h2>
              <div className="grid gap-3">
                <div><Label>Título *</Label><Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Slug (URL)</Label><Input value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
                <div><Label>Subtítulo</Label><Input value={form.short_description ?? ""} onChange={(e) => setForm({ ...form, short_description: e.target.value })} placeholder="Frase curta apresentando o curso" /></div>
                <div><Label>Descrição completa</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={6} /></div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>Categoria</Label>
                    <Input value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                  </div>
                  <div>
                    <Label>Instrutor</Label>
                    <Select value={form.instructor_id ?? "none"} onValueChange={(v) => setForm({ ...form, instructor_id: v === "none" ? null : v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum / Padrão</SelectItem>
                        {(data?.instructors ?? []).map((i: any) => (
                          <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Nível</Label>
                    <Select value={form.level ?? "Iniciante"} onValueChange={(v) => setForm({ ...form, level: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Iniciante">Iniciante</SelectItem>
                        <SelectItem value="Intermédio">Intermédio</SelectItem>
                        <SelectItem value="Avançado">Avançado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Idioma</Label>
                    <Select value={form.language ?? "Português"} onValueChange={(v) => setForm({ ...form, language: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Português">Português</SelectItem>
                        <SelectItem value="Inglês">Inglês</SelectItem>
                        <SelectItem value="Espanhol">Espanhol</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Duração estimada (min)</Label><Input type="number" min={0} value={form.duration_minutes ?? 0} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} /></div>
                </div>
                <div><Label>Público-alvo</Label><Input value={form.target_audience ?? ""} onChange={(e) => setForm({ ...form, target_audience: e.target.value })} placeholder="Ex.: Empreendedores, criadores de conteúdo..." /></div>
                <div><Label>Tags</Label><TagInput value={form.tags ?? []} onChange={(tags) => setForm({ ...form, tags })} /></div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 pt-2">
                <div>
                  <Label className="mb-2 block">O que vais aprender</Label>
                  <StringList value={form.what_you_learn ?? []} onChange={(v) => setForm({ ...form, what_you_learn: v })} placeholder="Resultado / habilidade" />
                </div>
                <div>
                  <Label className="mb-2 block">Requisitos</Label>
                  <StringList value={form.requirements ?? []} onChange={(v) => setForm({ ...form, requirements: v })} placeholder="Pré-requisito" />
                </div>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
                <ImageUpload bucket="course-covers" label="Capa do curso" value={form.cover_url ?? ""} onChange={(url) => setForm({ ...form, cover_url: url })} />
              </div>
              <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
                <h3 className="text-sm font-semibold text-secondary">Preço</h3>
                <div className="flex items-center justify-between text-sm">
                  <Label htmlFor="is-free-switch" className="cursor-pointer font-medium">Curso gratuito</Label>
                  <Switch id="is-free-switch" checked={!!form.is_free} onCheckedChange={(v) => setForm({ ...form, is_free: v, price_mzn: v ? 0 : form.price_mzn })} />
                </div>
                {!form.is_free && (
                  <div>
                    <Label>Preço (MZN)</Label>
                    <Input type="number" min={0} value={form.price_mzn ?? 0} onChange={(e) => setForm({ ...form, price_mzn: Number(e.target.value) })} />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Cursos gratuitos publicados ficam acessíveis a qualquer aluno com 1 clique.</p>
                <div className="flex items-center justify-between text-sm mt-2 border-t border-border pt-4">
                  <Label htmlFor="has-cert-switch" className="cursor-pointer font-medium">Oferece Certificado?</Label>
                  <Switch id="has-cert-switch" checked={!!form.has_certificate} onCheckedChange={(v) => setForm({ ...form, has_certificate: v })} />
                </div>
              </div>
              <Button onClick={saveCourse} className="w-full"><Save className="h-4 w-4" />Salvar curso</Button>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="curriculum" className="space-y-4">
          <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-secondary">Módulos e aulas</h2>
              <Button onClick={addModule}><Plus className="h-4 w-4" />Novo módulo</Button>
            </div>
            {(data?.modules ?? []).map((m) => (
              <ModuleBlock key={m.id} module={m} lessons={(data?.lessons ?? []).filter((l) => l.module_id === m.id)}
                onRename={() => renameModule(m)} onDelete={() => deleteModule(m)}
                onMoveUp={() => moveModule(m, -1)} onMoveDown={() => moveModule(m, 1)}
                onReload={() => qc.invalidateQueries({ queryKey: ["admin-course", id] })} />
            ))}
            {(data?.modules ?? []).length === 0 && <div className="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">Nenhum módulo. Adicione o primeiro.</div>}
          </section>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <section className="rounded-2xl border border-border bg-card p-6 space-y-3 max-w-2xl">
            <h2 className="font-semibold text-secondary">SEO</h2>
            <p className="text-xs text-muted-foreground">A capa será usada como imagem de partilha automaticamente.</p>
            <div><Label>Slug</Label><Input value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            <Button onClick={saveCourse}><Save className="h-4 w-4" />Salvar</Button>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ModuleBlock({ module: m, lessons, onRename, onDelete, onMoveUp, onMoveDown, onReload }: any) {
  const [editing, setEditing] = useState<any>(null);

  async function deleteLesson(l: any) {
    if (!confirm(`Excluir aula "${l.title}"?`)) return;
    await supabase.from("lessons").delete().eq("id", l.id); onReload();
  }
  async function toggleLock(l: any) {
    await supabase.from("lessons").update({ is_locked: !l.is_locked }).eq("id", l.id); onReload();
  }
  async function moveLesson(l: any, dir: -1 | 1) {
    const sorted = [...lessons].sort((a: any, b: any) => a.position - b.position);
    const i = sorted.findIndex((x: any) => x.id === l.id);
    const j = i + dir; if (j < 0 || j >= sorted.length) return;
    await Promise.all([
      supabase.from("lessons").update({ position: sorted[j].position }).eq("id", l.id),
      supabase.from("lessons").update({ position: l.position }).eq("id", sorted[j].id),
    ]);
    onReload();
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <button onClick={onRename} className="flex-1 text-left font-semibold text-secondary hover:text-primary">{m.title}</button>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onMoveUp}><ChevronUp className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={onMoveDown}><ChevronDown className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        {lessons.map((l: any) => {
          const yt = extractYouTubeId(l.youtube_url);
          const vm = extractVimeoId(l.youtube_url);
          const isLocal = !yt && !vm && l.youtube_url?.startsWith("http");
          return (
            <div key={l.id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
              <span className="flex-1 text-secondary">
                {l.title}{" "}
                {!yt && !vm && !isLocal && <span className="text-xs text-destructive">(vídeo inválido)</span>}
                {vm && <span className="text-xs text-blue-500 font-semibold">(Vimeo)</span>}
                {isLocal && <span className="text-xs text-emerald-500 font-semibold">(Vídeo Local/Upload)</span>}
              </span>
              <Button variant="ghost" size="icon" onClick={() => moveLesson(l, -1)}><ChevronUp className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => moveLesson(l, 1)}><ChevronDown className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => toggleLock(l)} title={l.is_locked ? "Desbloquear" : "Bloquear"}>{l.is_locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}</Button>
              <Button variant="ghost" size="icon" onClick={() => setEditing(l)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => deleteLesson(l)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          );
        })}
        <Button variant="outline" size="sm" onClick={() => setEditing({ module_id: m.id, title: "", youtube_url: "", description: "", attachment_url: "", is_locked: false, position: lessons.length })} className="w-full"><Plus className="h-4 w-4" />Adicionar aula</Button>
      </div>
      {editing && <LessonDialog lesson={editing} onClose={() => setEditing(null)} onSaved={onReload} />}
    </div>
  );
}

function LessonDialog({ lesson, onClose, onSaved }: { lesson: any; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<any>(lesson);
  const [videoSource, setVideoSource] = useState<"youtube" | "vimeo" | "local">(
    extractYouTubeId(lesson.youtube_url) ? "youtube" : extractVimeoId(lesson.youtube_url) ? "vimeo" : "local"
  );
  const yt = extractYouTubeId(f.youtube_url);
  const vm = extractVimeoId(f.youtube_url);
  const thumb = youTubeThumb(f.youtube_url);

  async function save() {
    if (!f.title?.trim()) return toast.error("Título obrigatório");
    if (videoSource === "youtube" && !yt) return toast.error("URL do YouTube inválido");
    if (videoSource === "vimeo" && !vm) return toast.error("URL do Vimeo inválido");
    if (videoSource === "local" && !f.youtube_url?.trim()) return toast.error("Por favor, faça upload de um vídeo ou insira um link de vídeo");
    
    const payload: any = { 
      title: f.title.trim(), 
      youtube_url: f.youtube_url ? f.youtube_url.trim() : "", 
      description: f.description ?? "", 
      attachment_url: f.attachment_url ?? "", 
      duration_minutes: f.duration_minutes ?? 0,
      is_locked: !!f.is_locked, 
      module_id: f.module_id, 
      position: f.position ?? 0 
    };
    
    let error;
    if (f.id) ({ error } = await supabase.from("lessons").update(payload).eq("id", f.id));
    else ({ error } = await supabase.from("lessons").insert(payload));
    if (error) return toast.error(error.message);
    toast.success("Aula salva"); onSaved(); onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{f.id ? "Editar aula" : "Nova aula"}</DialogTitle></DialogHeader>
        <div className="space-y-4 max-h-[65vh] overflow-y-auto px-1 py-2">
          <div><Label>Título *</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          
          <div className="space-y-1.5">
            <Label>Origem do Vídeo</Label>
            <div className="flex gap-2 bg-muted/50 p-1 rounded-lg border border-border">
              <Button
                type="button"
                variant={videoSource === "youtube" ? "default" : "ghost"}
                size="sm"
                className="flex-1 transition-all"
                onClick={() => {
                  setVideoSource("youtube");
                  if (!extractYouTubeId(f.youtube_url)) setF({ ...f, youtube_url: "" });
                }}
              >
                YouTube
              </Button>
              <Button
                type="button"
                variant={videoSource === "vimeo" ? "default" : "ghost"}
                size="sm"
                className="flex-1 transition-all"
                onClick={() => {
                  setVideoSource("vimeo");
                  if (!extractVimeoId(f.youtube_url)) setF({ ...f, youtube_url: "" });
                }}
              >
                Vimeo
              </Button>
              <Button
                type="button"
                variant={videoSource === "local" ? "default" : "ghost"}
                size="sm"
                className="flex-1 transition-all"
                onClick={() => {
                  setVideoSource("local");
                  if (extractYouTubeId(f.youtube_url) || extractVimeoId(f.youtube_url)) setF({ ...f, youtube_url: "" });
                }}
              >
                Upload / Vídeo Local
              </Button>
            </div>
          </div>

          {videoSource === "youtube" ? (
            <div>
              <Label>URL do YouTube *</Label>
              <Input value={f.youtube_url ?? ""} onChange={(e) => setF({ ...f, youtube_url: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
              {f.youtube_url && (
                yt
                  ? <div className="mt-2 flex items-center gap-3 rounded-lg border border-border p-2">
                      {thumb && <img src={thumb} alt="" className="h-16 w-28 rounded object-cover" />}
                      <div className="text-xs"><div className="text-emerald-600 font-medium">✓ Vídeo detectado</div><div className="text-muted-foreground">ID: {yt}</div></div>
                    </div>
                  : <p className="mt-1 text-xs text-destructive">URL inválido. Aceita formatos: youtube.com/watch?v=, youtu.be/, embed/, shorts/.</p>
              )}
            </div>
          ) : videoSource === "vimeo" ? (
            <div>
              <Label>URL do Vimeo *</Label>
              <Input value={f.youtube_url ?? ""} onChange={(e) => setF({ ...f, youtube_url: e.target.value })} placeholder="https://vimeo.com/..." />
              {f.youtube_url && (
                vm
                  ? <div className="mt-2 text-xs text-emerald-600 font-medium">✓ Vídeo detectado (ID: {vm})</div>
                  : <p className="mt-1 text-xs text-destructive">URL inválido. Ex: https://vimeo.com/12345678</p>
              )}
            </div>
          ) : (
            <div>
              <VideoUpload 
                value={f.youtube_url ?? ""} 
                onChange={(url) => setF({ ...url ? f : { ...f, youtube_url: url }, youtube_url: url })} 
                label="Vídeo Aula (Upload / Link Direto)"
              />
            </div>
          )}

          <div><Label>Descrição</Label><Textarea value={f.description ?? ""} onChange={(e) => setF({ ...f, description: e.target.value })} rows={3} /></div>
          <div><Label>Material complementar (URL)</Label><Input value={f.attachment_url ?? ""} onChange={(e) => setF({ ...f, attachment_url: e.target.value })} placeholder="PDF, link..." /></div>
          <div><Label>Duração da Aula (minutos, opcional)</Label><Input type="number" min={0} value={f.duration_minutes ?? 0} onChange={(e) => setF({ ...f, duration_minutes: Number(e.target.value) })} /></div>
          <div className="flex items-center gap-2 text-sm">
            <Switch id="is-locked-switch" checked={!!f.is_locked} onCheckedChange={(v) => setF({ ...f, is_locked: v })} />
            <Label htmlFor="is-locked-switch" className="cursor-pointer font-medium">Aula bloqueada (só liberada após concluir a anterior)</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save}>Salvar aula</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}