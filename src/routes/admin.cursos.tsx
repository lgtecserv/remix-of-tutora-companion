import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Copy, Trash2, Eye, EyeOff, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/cursos")({ component: AdminCourses });

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function AdminCourses() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => (await supabase.from("courses").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  async function create() {
    if (!title.trim()) return toast.error("Título obrigatório");
    const { data: created, error } = await supabase.from("courses").insert({ title: title.trim(), slug: slugify(title) }).select().single();
    if (error) return toast.error(error.message);
    toast.success("Curso criado — complete os detalhes");
    setOpen(false); setTitle("");
    qc.invalidateQueries({ queryKey: ["admin-courses"] });
    window.location.href = `/admin/cursos/${created.id}`;
  }

  async function togglePublish(c: any) {
    const { error } = await supabase.from("courses").update({ is_published: !c.is_published }).eq("id", c.id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin-courses"] });
  }

  async function duplicate(c: any) {
    const { id, created_at, updated_at, slug, ...rest } = c;
    const newSlug = slug + "-copia-" + Date.now().toString(36);
    const { error } = await supabase.from("courses").insert({ ...rest, slug: newSlug, title: c.title + " (cópia)", is_published: false });
    if (error) toast.error(error.message); else { toast.success("Duplicado"); qc.invalidateQueries({ queryKey: ["admin-courses"] }); }
  }

  async function remove(c: any) {
    if (!confirm(`Excluir o curso "${c.title}"? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("courses").delete().eq("id", c.id);
    if (error) toast.error(error.message); else { toast.success("Curso excluído"); qc.invalidateQueries({ queryKey: ["admin-courses"] }); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-secondary">Cursos</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" />Novo curso</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar curso</DialogTitle></DialogHeader>
            <div><Label>Título do curso *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Marketing Digital para Iniciantes" /></div>
            <p className="text-xs text-muted-foreground">Vais completar os detalhes (capa, preço, currículo) no próximo ecrã.</p>
            <DialogFooter><Button onClick={create}>Criar e continuar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <div className="text-muted-foreground">A carregar...</div>}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-3">Título</th><th className="px-4 py-3">Categoria</th><th className="px-4 py-3">Preço</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Ações</th></tr>
          </thead>
          <tbody>
            {(data ?? []).map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-secondary">{c.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.category ?? "—"}</td>
                <td className="px-4 py-3">{c.is_free ? <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700">Grátis</span> : `${Number(c.price_mzn).toLocaleString("pt-PT")} MT`}</td>
                <td className="px-4 py-3">{c.is_published ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Publicado</span> : <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Rascunho</span>}</td>
                <td className="px-4 py-3"><div className="flex gap-1">
                  <Button variant="ghost" size="icon" asChild><Link to="/admin/cursos/$id" params={{ id: c.id }}><Pencil className="h-4 w-4" /></Link></Button>
                  <Button variant="ghost" size="icon" onClick={() => togglePublish(c)} title={c.is_published ? "Despublicar" : "Publicar"}>{c.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                  <Button variant="ghost" size="icon" onClick={() => duplicate(c)} title="Duplicar"><Copy className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(c)} title="Excluir"><Trash2 className="h-4 w-4" /></Button>
                </div></td>
              </tr>
            ))}
            {!isLoading && (data?.length ?? 0) === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Nenhum curso. Crie o primeiro.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}