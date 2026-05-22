import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Lock, Unlock, ChevronUp, ChevronDown, Save } from "lucide-react";
import { toast } from "sonner";
import { extractYouTubeId } from "@/lib/youtube";

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
      return { course, modules: modules ?? [], lessons: lessons ?? [] };
    },
  });

  const [form, setForm] = useState<any>(null);
  useEffect(() => { if (data?.course) setForm(data.course); }, [data?.course]);

  async function saveCourse() {
    const { id: _, created_at, updated_at, ...rest } = form;
    const { error } = await supabase.from("courses").update(rest).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Salvo"); qc.invalidateQueries({ queryKey: ["admin-course", id] }); }
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
      <h1 className="text-3xl font-bold text-secondary">{form.title}</h1>

      <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <h2 className="font-semibold text-secondary">Detalhes do curso</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2"><Label>Título</Label><Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Descrição</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label>Categoria</Label><Input value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          <div><Label>Professor</Label><Input value={form.instructor ?? ""} onChange={(e) => setForm({ ...form, instructor: e.target.value })} /></div>
          <div><Label>Nível</Label><Input value={form.level ?? ""} onChange={(e) => setForm({ ...form, level: e.target.value })} /></div>
          <div><Label>Duração (min)</Label><Input type="number" value={form.duration_minutes ?? 0} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} /></div>
          <div><Label>Preço (MZN)</Label><Input type="number" value={form.price_mzn ?? 0} onChange={(e) => setForm({ ...form, price_mzn: Number(e.target.value) })} /></div>
          <div><Label>URL da capa</Label><Input value={form.cover_url ?? ""} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} /></div>
        </div>
        <Button onClick={saveCourse}><Save className="h-4 w-4" />Salvar detalhes</Button>
      </section>

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
    </div>
  );
}

function ModuleBlock({ module: m, lessons, onRename, onDelete, onMoveUp, onMoveDown, onReload }: any) {
  async function addLesson() {
    const title = prompt("Título da aula:"); if (!title) return;
    const youtube_url = prompt("URL do YouTube (cole o link completo):") ?? "";
    const pos = lessons.length;
    const { error } = await supabase.from("lessons").insert({ module_id: m.id, title, youtube_url, position: pos });
    if (error) toast.error(error.message); else onReload();
  }
  async function deleteLesson(l: any) {
    if (!confirm(`Excluir aula "${l.title}"?`)) return;
    await supabase.from("lessons").delete().eq("id", l.id); onReload();
  }
  async function toggleLock(l: any) {
    await supabase.from("lessons").update({ is_locked: !l.is_locked }).eq("id", l.id); onReload();
  }
  async function editLesson(l: any) {
    const title = prompt("Título:", l.title) ?? l.title;
    const youtube_url = prompt("YouTube URL:", l.youtube_url ?? "") ?? l.youtube_url;
    const description = prompt("Descrição:", l.description ?? "") ?? l.description;
    const attachment_url = prompt("URL do material (opcional):", l.attachment_url ?? "") ?? l.attachment_url;
    await supabase.from("lessons").update({ title, youtube_url, description, attachment_url }).eq("id", l.id); onReload();
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
          return (
            <div key={l.id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
              <span className="flex-1 text-secondary">{l.title} {!yt && <span className="text-xs text-destructive">(vídeo inválido)</span>}</span>
              <Button variant="ghost" size="icon" onClick={() => moveLesson(l, -1)}><ChevronUp className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => moveLesson(l, 1)}><ChevronDown className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => toggleLock(l)} title={l.is_locked ? "Desbloquear" : "Bloquear"}>{l.is_locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}</Button>
              <Button variant="ghost" size="sm" onClick={() => editLesson(l)}>Editar</Button>
              <Button variant="ghost" size="icon" onClick={() => deleteLesson(l)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          );
        })}
        <Button variant="outline" size="sm" onClick={addLesson} className="w-full"><Plus className="h-4 w-4" />Adicionar aula</Button>
      </div>
    </div>
  );
}