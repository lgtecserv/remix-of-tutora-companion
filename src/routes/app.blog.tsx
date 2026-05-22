import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/app/blog")({ component: BlogPage });

function BlogPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data } = await supabase.from("blog_posts").select("*").eq("is_published", true).order("published_at", { ascending: false });
      return data ?? [];
    },
  });
  const categories = Array.from(new Set((data ?? []).map((p) => p.category).filter(Boolean))) as string[];
  const filtered = (data ?? []).filter((p) => {
    if (cat && p.category !== cat) return false;
    if (q && !(`${p.title} ${p.excerpt ?? ""}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });
  const [open, setOpen] = useState<any>(null);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-secondary">Blog</h1>
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Pesquisar..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <button onClick={() => setCat(null)} className={`rounded-full px-3 py-1 text-sm ${!cat ? "bg-primary text-primary-foreground" : "bg-muted text-secondary"}`}>Todos</button>
        {categories.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1 text-sm ${cat === c ? "bg-primary text-primary-foreground" : "bg-muted text-secondary"}`}>{c}</button>
        ))}
      </div>
      {open ? (
        <article className="rounded-2xl border border-border bg-card p-8">
          <button onClick={() => setOpen(null)} className="text-sm text-muted-foreground hover:text-primary">← Voltar</button>
          {open.cover_url && <img src={open.cover_url} alt="" className="mt-4 max-h-80 w-full rounded-xl object-cover" />}
          <h2 className="mt-4 text-2xl font-bold text-secondary">{open.title}</h2>
          <div className="text-sm text-muted-foreground">{open.published_at ? new Date(open.published_at).toLocaleDateString("pt-PT") : ""}</div>
          <div className="prose prose-sm mt-6 max-w-none whitespace-pre-wrap text-secondary">{open.content}</div>
        </article>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <button key={p.id} onClick={() => setOpen(p)} className="text-left overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40">
              {p.cover_url ? <img src={p.cover_url} alt={p.title} className="h-40 w-full object-cover" /> : <div className="h-40 bg-muted" />}
              <div className="p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.category ?? "Artigo"}</div>
                <div className="mt-1 font-semibold text-secondary">{p.title}</div>
                {p.excerpt && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>}
              </div>
            </button>
          ))}
          {filtered.length === 0 && <div className="col-span-full text-center text-muted-foreground">Nenhum artigo encontrado.</div>}
        </div>
      )}
    </div>
  );
}