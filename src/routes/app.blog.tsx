import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/app/blog")({ component: BlogPage });

function BlogPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => (await supabase.from("blog_posts").select("*").eq("is_published", true).order("published_at", { ascending: false })).data ?? [],
  });
  const categories = useMemo(() => Array.from(new Set((data ?? []).map((p) => p.category).filter(Boolean))) as string[], [data]);
  const filtered = (data ?? []).filter((p) => {
    if (cat && p.category !== cat) return false;
    if (q && !(`${p.title} ${p.excerpt ?? ""}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Blog</h1>
        <p className="text-muted-foreground">Artigos, tutoriais e novidades.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Pesquisar..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <button onClick={() => setCat(null)} className={`rounded-full px-3 py-1 text-sm ${!cat ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>Todos</button>
        {categories.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1 text-sm ${cat === c ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>{c}</button>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <Link key={p.id} to="/app/blog/$slug" params={{ slug: p.slug }} className="overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40">
            {p.cover_url ? <img src={p.cover_url} alt={p.title} className="h-44 w-full object-cover" /> : <div className="h-44 bg-muted" />}
            <div className="p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.category ?? "Artigo"}</div>
              <div className="mt-1 font-semibold text-foreground">{p.title}</div>
              {p.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.excerpt}</p>}
              <div className="mt-3 text-xs text-muted-foreground">
                {p.published_at && new Date(p.published_at).toLocaleDateString("pt-PT")}
                {p.reading_minutes ? ` · ${p.reading_minutes} min de leitura` : ""}
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center text-muted-foreground">Nenhum artigo encontrado.</div>}
      </div>
    </div>
  );
}