import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { unwrapRelation, safeSlug } from "@/lib/supabase-utils";
import { PlayCircle, BookOpen, Trophy, Sparkles, ArrowRight, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export const Route = createFileRoute("/app/")({ component: StudentDashboard });

function StudentDashboard() {
  const { user } = useAuth();
  const name = (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "aluno";
  const { theme, setTheme } = useTheme();

  const { data } = useQuery({
    queryKey: ["student-dashboard", user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
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
      } catch (err) {
        console.error("[StudentDashboard] queryFn error:", err);
        return { enrollments: [], progress: [], recommendations: [] };
      }
    },
  });

  // Safe extraction of "last watched" data
  const lastProgress = data?.progress?.find((p) => !p.is_completed) ?? data?.progress?.[0];
  const lastLesson = lastProgress ? unwrapRelation((lastProgress as any)?.lessons) : null;
  const lastModules = lastLesson ? unwrapRelation((lastLesson as any)?.modules) : null;
  const lastCourse = lastModules ? unwrapRelation((lastModules as any)?.courses) : null;

  const enrolledIds = new Set((data?.enrollments ?? []).map((e) => e.course_id));
  const inProgress = data?.enrollments?.length ?? 0;
  const completed = data?.progress?.filter((p) => p.is_completed)?.length ?? 0;
  const recs = (data?.recommendations ?? []).filter((c) => !enrolledIds.has(c.id)).slice(0, 4);

  return (
    <>
      {/* =========================================================================
          MOBILE DESIGN 
          ========================================================================= */}
      <div className="md:hidden -mx-4 -mt-4 pb-10">
        {/* Header */}
        <div className="bg-primary px-5 py-8 pb-12 rounded-b-[2rem] shadow-lg relative overflow-hidden">
          <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none">
            <Sparkles className="w-48 h-48 text-primary-foreground" />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <h1 className="text-2xl font-bold text-primary-foreground">Olá, {name} 👋</h1>
              <p className="text-primary-foreground/90 mt-1 text-sm">O que vamos aprender hoje?</p>
            </div>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 bg-primary-foreground/20 rounded-full text-primary-foreground backdrop-blur-sm">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Continue Watching */}
        <div className="px-5 -mt-8 relative z-20">
          {lastCourse ? (
            <Link to="/app/curso/$slug" params={{ slug: safeSlug((lastCourse as any)?.slug, "curso") }} className="block bg-card rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-border">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
                <PlayCircle className="h-4 w-4" /> Continuar assistindo
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 line-clamp-1">{(lastCourse as any)?.title ?? "Curso"}</div>
              <div className="text-sm font-semibold text-foreground leading-tight line-clamp-2">{(lastLesson as any)?.title ?? ""}</div>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${Math.round(Number(lastProgress?.percent || 0))}%` }} />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">{Math.round(Number(lastProgress?.percent || 0))}%</span>
              </div>
            </Link>
          ) : (
            <div className="bg-card rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-border text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <div className="text-sm text-foreground font-medium">Nenhum curso em andamento</div>
              <Link to="/app/catalogo" className="mt-3 inline-block text-xs font-bold text-primary bg-primary/10 px-4 py-2 rounded-full">Explorar cursos</Link>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 px-5 mt-6">
          {[
            { icon: BookOpen, label: "Em andamento", v: String(inProgress) },
            { icon: Trophy, label: "Concluídas", v: String(completed) },
          ].map((c) => (
            <div key={c.label} className="bg-card rounded-2xl p-4 border border-border flex flex-col justify-between shadow-sm">
              <c.icon className="h-5 w-5 text-primary mb-2" />
              <div>
                <div className="text-xl font-black text-foreground">{c.v}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{c.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        {recs.length > 0 && (
          <div className="mt-8">
            <div className="px-5 mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Recomendados</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto px-5 pb-4 hide-scrollbar snap-x">
              {recs.map((c) => (
                <Link key={c.id} to="/app/curso/$slug" params={{ slug: safeSlug(c.slug, c.id) }} className="snap-start shrink-0 w-[220px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm block">
                  {c.cover_url ? <img src={c.cover_url} alt={c.title} className="h-28 w-full object-cover" /> : <div className="h-28 bg-muted" />}
                  <div className="p-3">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground line-clamp-1">{c.category ?? "Curso"}</div>
                    <div className="mt-1 text-sm font-semibold text-foreground line-clamp-2 leading-tight">{c.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          DESKTOP DESIGN 
          ========================================================================= */}
      <div className="hidden md:block space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Olá, {name} 👋</h1>
          <p className="mt-1 text-muted-foreground">Continue de onde parou e aprenda algo novo hoje.</p>
        </div>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground"><PlayCircle className="h-5 w-5 text-primary" />Continuar assistindo</h2>
          {lastCourse ? (
            <Link to="/app/curso/$slug" params={{ slug: safeSlug((lastCourse as any)?.slug, "curso") }} className="flex items-center justify-between rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40">
              <div>
                <div className="text-sm text-muted-foreground">{(lastCourse as any)?.title ?? "Curso"}</div>
                <div className="text-lg font-semibold text-foreground">{(lastLesson as any)?.title ?? ""}</div>
                <div className="mt-2 h-2 w-64 max-w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${Math.round(Number(lastProgress?.percent || 0))}%` }} />
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
              <div className="mt-3 text-2xl font-bold text-foreground">{c.v}</div>
              <div className="text-sm text-muted-foreground">{c.label}</div>
            </div>
          ))}
        </div>

        {recs.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Recomendado para você</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {recs.map((c) => (
                <Link key={c.id} to="/app/curso/$slug" params={{ slug: safeSlug(c.slug, c.id) }} className="overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 block">
                  {c.cover_url ? <img src={c.cover_url} alt={c.title} className="h-32 w-full object-cover" /> : <div className="h-32 bg-muted" />}
                  <div className="p-4">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.category ?? "Curso"}</div>
                    <div className="mt-1 font-semibold text-foreground">{c.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}