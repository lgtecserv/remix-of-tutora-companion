import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { PlayCircle, BookOpen, Trophy, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/app/")({ component: StudentDashboard });

function StudentDashboard() {
  const { user } = useAuth();
  const name = (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "aluno";

  const { data } = useQuery({
    queryKey: ["student-dashboard", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [enrolls, progress, recs] = await Promise.all([
        supabase.from("enrollments").select("course_id, courses(id, slug, title, cover_url, category)").eq("user_id", user!.id),
        supabase.from("lesson_progress").select("lesson_id, percent, is_completed, updated_at, lessons(id, title, module_id, modules(course_id, courses(slug, title)))").eq("user_id", user!.id).order("updated_at", { ascending: false }),
        supabase.from("courses").select("id, slug, title, cover_url, category").eq("is_published", true).limit(6),
      ]);
      return {
        enrollments: enrolls.data ?? [],
        progress: progress.data ?? [],
        recommendations: recs.data ?? [],
      };
    },
  });

  const last = data?.progress.find((p) => !p.is_completed) ?? data?.progress[0];
  const enrolledIds = new Set((data?.enrollments ?? []).map((e) => e.course_id));
  const inProgress = data?.enrollments.length ?? 0;
  const completed = data?.progress.filter((p) => p.is_completed).length ?? 0;
  const recs = (data?.recommendations ?? []).filter((c) => !enrolledIds.has(c.id)).slice(0, 4);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-secondary">Olá, {name} 👋</h1>
        <p className="mt-1 text-muted-foreground">Continue de onde parou e aprenda algo novo hoje.</p>
      </div>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-secondary"><PlayCircle className="h-5 w-5 text-primary" />Continuar assistindo</h2>
        {last?.lessons?.modules?.courses ? (
          <Link to="/app/curso/$slug" params={{ slug: last.lessons.modules.courses.slug }} className="flex items-center justify-between rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40">
            <div>
              <div className="text-sm text-muted-foreground">{last.lessons.modules.courses.title}</div>
              <div className="text-lg font-semibold text-secondary">{last.lessons.title}</div>
              <div className="mt-2 h-2 w-64 max-w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${Math.round(Number(last.percent))}%` }} />
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-primary" />
          </Link>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            Ainda não começou nenhum curso. <Link to="/app/cursos" className="text-primary hover:underline">Ver meus cursos</Link>.
          </div>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: BookOpen, label: "Cursos em andamento", v: String(inProgress) },
          { icon: Trophy, label: "Aulas concluídas", v: String(completed) },
          { icon: Sparkles, label: "Recomendações", v: String(recs.length) },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-6">
            <c.icon className="h-6 w-6 text-primary" />
            <div className="mt-3 text-2xl font-bold text-secondary">{c.v}</div>
            <div className="text-sm text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>

      {recs.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-secondary">Recomendado para você</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {recs.map((c) => (
              <div key={c.id} className="overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40">
                {c.cover_url ? <img src={c.cover_url} alt={c.title} className="h-32 w-full object-cover" /> : <div className="h-32 bg-muted" />}
                <div className="p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.category ?? "Curso"}</div>
                  <div className="mt-1 font-semibold text-secondary">{c.title}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}