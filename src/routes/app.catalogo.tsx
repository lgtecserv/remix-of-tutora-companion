import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createCheckoutSession } from "@/actions/checkout";

export const Route = createFileRoute("/app/catalogo")({ component: Catalog });

function Catalog() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "free" | "paid">("all");
  const [cat, setCat] = useState<string | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);

  const { data: courses } = useQuery({
    queryKey: ["catalog"],
    queryFn: async () => (await supabase.from("courses").select("*").eq("is_published", true).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: enrolls } = useQuery({
    queryKey: ["my-enrolls", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("enrollments").select("course_id").eq("user_id", user!.id)).data ?? [],
  });

  const enrolledIds = useMemo(() => new Set((enrolls ?? []).map((e) => e.course_id)), [enrolls]);
  const categories = useMemo(() => Array.from(new Set((courses ?? []).map((c) => c.category).filter(Boolean))) as string[], [courses]);

  const filtered = (courses ?? []).filter((c) => {
    if (q && !c.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "free" && !c.is_free) return false;
    if (filter === "paid" && c.is_free) return false;
    if (cat && c.category !== cat) return false;
    return true;
  });

  async function enrolFree(c: any) {
    if (!user) return;
    const { error } = await supabase.from("enrollments").insert({ user_id: user.id, course_id: c.id });
    if (error && !error.message.includes("duplicate")) return toast.error(error.message);
    toast.success("Acesso liberado!");
    qc.invalidateQueries({ queryKey: ["my-enrolls"] });
    qc.invalidateQueries({ queryKey: ["my-courses"] });
    navigate({ to: "/app/curso/$slug", params: { slug: c.slug } });
  }

  async function handleCheckout(courseId: string) {
    if (!user) {
      toast.error("Precisas de ter sessão iniciada para adquirir o curso.");
      navigate({ to: "/login", search: { redirect: "/app/catalogo" } });
      return;
    }
    
    try {
      setLoadingCheckout(courseId);
      const result = await createCheckoutSession({ data: { courseId } });
      
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        toast.error("Falha ao obter o link de pagamento.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar o pagamento");
    } finally {
      setLoadingCheckout(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Catálogo de cursos</h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">Explore todos os cursos disponíveis e expanda o seu conhecimento.</p>
      </div>
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <Input placeholder="Pesquisar..." value={q} onChange={(e) => setQ(e.target.value)} className="w-full md:max-w-sm shrink-0 h-11 rounded-full px-4" />
        <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar whitespace-nowrap -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:flex-wrap flex-1">
          {(["all", "free", "paid"] as const).map((k) => (
            <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-4 py-2 text-sm shrink-0 transition-colors ${filter === k ? "bg-primary text-primary-foreground shadow-md font-medium" : "bg-muted text-foreground hover:bg-muted/80 border border-border"}`}>{k === "all" ? "Todos" : k === "free" ? "Grátis" : "Pagos"}</button>
          ))}
          <div className="mx-1 h-6 w-px bg-border shrink-0 hidden md:block" />
          <button onClick={() => setCat(null)} className={`rounded-full px-4 py-2 text-sm shrink-0 transition-colors ${!cat ? "bg-primary text-primary-foreground shadow-md font-medium" : "bg-muted text-foreground hover:bg-muted/80 border border-border"}`}>Todas categorias</button>
          {categories.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full px-4 py-2 text-sm shrink-0 transition-colors ${cat === c ? "bg-primary text-primary-foreground shadow-md font-medium" : "bg-muted text-foreground hover:bg-muted/80 border border-border"}`}>{c}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const enrolled = enrolledIds.has(c.id);
          return (
            <div key={c.id} className="overflow-hidden flex flex-col rounded-2xl border border-border bg-card transition hover:border-primary/40">
              {c.cover_url ? <img src={c.cover_url} alt={c.title} className="h-28 sm:h-44 w-full object-cover" /> : <div className="h-28 sm:h-44 bg-muted" />}
              <div className="p-3 sm:p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">
                  <span className="line-clamp-1 mr-1">{c.category ?? "Curso"}</span>
                  {c.is_free
                    ? <span className="rounded-full bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 text-emerald-700 whitespace-nowrap">Grátis</span>
                    : <span className="font-semibold text-primary whitespace-nowrap">{Number(c.price_mzn).toLocaleString("pt-PT")} MT</span>}
                </div>
                <h3 className="mt-2 text-sm sm:text-base font-semibold text-foreground line-clamp-2 leading-tight">{c.title}</h3>
                {c.short_description && <p className="mt-1 hidden sm:block line-clamp-2 text-sm text-muted-foreground">{c.short_description}</p>}
                {c.instructor && <div className="mt-1 text-xs text-muted-foreground">por {c.instructor}</div>}
                <div className="mt-auto pt-4">
                  {enrolled
                    ? <Button className="w-full" onClick={() => navigate({ to: "/app/curso/$slug", params: { slug: c.slug } })}>Continuar</Button>
                    : c.is_free
                      ? <Button className="w-full" onClick={() => enrolFree(c)}>Começar agora</Button>
                      : <Button className="w-full" onClick={() => handleCheckout(c.id)} disabled={loadingCheckout === c.id}>
                          {loadingCheckout === c.id ? "A processar..." : "Adquirir"}
                        </Button>}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">Nenhum curso encontrado.</div>}
      </div>
    </div>
  );
}