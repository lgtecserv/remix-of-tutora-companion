import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/blog/$slug")({ component: Article });

function Article() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => (await supabase.from("blog_posts").select("*").eq("slug", slug).eq("is_published", true).maybeSingle()).data,
  });

  if (isLoading) return <div className="text-muted-foreground">A carregar...</div>;
  if (!data) return <div className="text-muted-foreground">Artigo não encontrado.</div>;

  const isHtml = (data.content ?? "").trim().startsWith("<");

  return (
    <article className="mx-auto max-w-3xl">
      <Link to="/app/blog" className="text-sm text-muted-foreground hover:text-primary">← Voltar ao blog</Link>
      {data.cover_url && <img src={data.cover_url} alt="" className="mt-4 max-h-96 w-full rounded-2xl object-cover" />}
      <div className="mt-6 text-xs uppercase tracking-wider text-muted-foreground">{data.category ?? "Artigo"}</div>
      <h1 className="mt-2 text-4xl font-bold text-secondary">{data.title}</h1>
      {data.excerpt && <p className="mt-2 text-lg text-muted-foreground">{data.excerpt}</p>}
      <div className="mt-3 text-sm text-muted-foreground">
        {data.published_at && new Date(data.published_at).toLocaleDateString("pt-PT")}
        {data.reading_minutes ? ` · ${data.reading_minutes} min de leitura` : ""}
      </div>
      {(data.tags ?? []).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(data.tags as string[]).map((t) => <span key={t} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-secondary">#{t}</span>)}
        </div>
      )}
      {isHtml
        ? <div className="prose prose-base mt-8 max-w-none" dangerouslySetInnerHTML={{ __html: data.content ?? "" }} />
        : <div className="mt-8 whitespace-pre-wrap text-secondary">{data.content}</div>}
    </article>
  );
}