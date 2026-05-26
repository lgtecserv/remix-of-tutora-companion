import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/blog")({ component: AdminBlog });

function AdminBlog() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "scheduled">("all");
  const { data } = useQuery({ queryKey: ["admin-blog"], queryFn: async () => (await supabase.from("blog_posts").select("*").order("created_at", { ascending: false })).data ?? [] });

  async function createNew() {
    const { data: created, error } = await supabase.from("blog_posts").insert({ title: "Novo artigo", slug: "novo-artigo-" + Date.now().toString(36), is_published: false }).select().single();
    if (error) return toast.error(error.message);
    navigate({ to: "/admin/blog/$id", params: { id: created.id } });
  }
  async function togglePub(p: any) { await supabase.from("blog_posts").update({ is_published: !p.is_published, published_at: !p.is_published ? new Date().toISOString() : null }).eq("id", p.id); qc.invalidateQueries({ queryKey: ["admin-blog"] }); }
  async function remove(p: any) { if (!confirm("Excluir?")) return; await supabase.from("blog_posts").delete().eq("id", p.id); qc.invalidateQueries({ queryKey: ["admin-blog"] }); }

  const filtered = (data ?? []).filter((p: any) => {
    if (q && !p.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "published" && !p.is_published) return false;
    if (filter === "draft" && (p.is_published || p.scheduled_at)) return false;
    if (filter === "scheduled" && !p.scheduled_at) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Blog</h1>
        <Button onClick={createNew}><Plus className="h-4 w-4" />Novo artigo</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Pesquisar..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        {([["all","Todos"],["published","Publicados"],["draft","Rascunhos"],["scheduled","Agendados"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-3 py-1 text-sm ${filter === k ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>{l}</button>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-3">Título</th><th className="px-4 py-3">Categoria</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Ações</th></tr></thead>
          <tbody>
            {filtered.map((p: any) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-foreground">{p.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.category ?? "—"}</td>
                <td className="px-4 py-3">{p.is_published ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Publicado</span> : p.scheduled_at ? <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700">Agendado</span> : <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Rascunho</span>}</td>
                <td className="px-4 py-3"><div className="flex gap-1">
                  <Button variant="ghost" size="sm" asChild><Link to="/admin/blog/$id" params={{ id: p.id }}>Editar</Link></Button>
                  <Button variant="ghost" size="icon" onClick={() => togglePub(p)}>{p.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(p)}><Trash2 className="h-4 w-4" /></Button>
                </div></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Nenhum artigo.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}