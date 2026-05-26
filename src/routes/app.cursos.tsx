import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/cursos")({ component: MyCourses });

function MyCourses() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-courses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: enrolls } = await supabase
        .from("enrollments")
        .select("course_id, courses(id, slug, title, description, cover_url, category, instructor)")
        .eq("user_id", user!.id);
      const courseIds = (enrolls ?? []).map((e) => e.course_id);
      if (courseIds.length === 0) return [];
      const { data: lessons } = await supabase
        .from("lessons")
        .select("id, module_id, modules!inner(course_id)")
        .in("modules.course_id", courseIds);
      const { data: progress } = await supabase
        .from("lesson_progress")
        .select("lesson_id, is_completed")
        .eq("user_id", user!.id);
      const completedSet = new Set((progress ?? []).filter((p) => p.is_completed).map((p) => p.lesson_id));
      return (enrolls ?? []).map((e) => {
        const courseLessons = (lessons ?? []).filter((l: any) => l.modules?.course_id === e.course_id);
        const total = courseLessons.length;
        const done = courseLessons.filter((l) => completedSet.has(l.id)).length;
        return { ...e, total, done, percent: total ? Math.round((done / total) * 100) : 0 };
      });
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-secondary">Meus Cursos</h1>
      {isLoading && <div className="text-muted-foreground">A carregar...</div>}
      {!isLoading && (data?.length ?? 0) === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          Você ainda não está inscrito em nenhum curso.
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((row: any) => {
          const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
          if (!course) return null;
          return (
            <Link key={row.course_id} to="/app/curso/$slug" params={{ slug: String(course.slug || row.course_id) }} className="overflow-hidden flex flex-col rounded-2xl border border-border bg-card transition hover:border-primary/40">
              {course.cover_url ? <img src={course.cover_url} alt={course.title} className="h-28 sm:h-40 w-full object-cover" /> : <div className="h-28 sm:h-40 bg-muted" />}
              <div className="p-3 sm:p-5 flex flex-col flex-1">
                <div className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground line-clamp-1">{course.category ?? "Curso"}</div>
                <div className="mt-1 text-sm sm:text-base font-semibold text-secondary line-clamp-2 leading-tight">{course.title}</div>
                {course.instructor && <div className="text-xs sm:text-sm text-muted-foreground mt-1">por {course.instructor}</div>}
                <div className="mt-auto pt-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{row.done} de {row.total} aulas</span>
                    <span>{row.percent}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${row.percent}%` }} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}