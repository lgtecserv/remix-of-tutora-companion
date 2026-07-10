import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/tutor-panel/alunos")({ component: TutorStudents });

function TutorStudents() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["tutor-students", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get all courses by this tutor
      const { data: courses } = await supabase.from("courses").select("id, title").eq("tutor_id", user.id);
      if (!courses || courses.length === 0) return [];
      
      const courseIds = courses.map(c => c.id);

      // Get enrollments for these courses
      const { data: enrolls } = await supabase.from("enrollments")
        .select("user_id, course_id, courses(title)")
        .in("course_id", courseIds);

      if (!enrolls || enrolls.length === 0) return [];

      const studentIds = [...new Set(enrolls.map(e => e.user_id))];

      // Get student profiles
      const { data: profiles } = await supabase.from("profiles").select("*").in("id", studentIds).order("created_at", { ascending: false });

      // Get progress for these students on these courses
      const { data: progress } = await supabase.from("lesson_progress").select("user_id, updated_at, is_completed").in("user_id", studentIds);

      const enrollMap = new Map<string, any[]>();
      enrolls.forEach((e) => { const arr = enrollMap.get(e.user_id) ?? []; arr.push(e); enrollMap.set(e.user_id, arr); });
      
      const lastAccessMap = new Map<string, string>();
      const doneMap = new Map<string, number>();
      (progress ?? []).forEach((p) => {
        const cur = lastAccessMap.get(p.user_id);
        if (!cur || p.updated_at > cur) lastAccessMap.set(p.user_id, p.updated_at);
        if (p.is_completed) doneMap.set(p.user_id, (doneMap.get(p.user_id) ?? 0) + 1);
      });

      return (profiles ?? []).map((p) => ({
        ...p,
        courses: enrollMap.get(p.id) ?? [],
        lastAccess: lastAccessMap.get(p.id),
        lessonsDone: doneMap.get(p.id) ?? 0,
      }));
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Meus Alunos</h1>
      <p className="text-muted-foreground">Alunos matriculados nos seus cursos.</p>
      
      {isLoading && <div className="text-muted-foreground">A carregar...</div>}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-3">Nome</th><th className="px-4 py-3">Cursos</th><th className="px-4 py-3">Aulas concluídas</th><th className="px-4 py-3">Último acesso</th></tr>
          </thead>
          <tbody>
            {(data ?? []).map((s: any) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-foreground">{s.full_name ?? "—"}</td>
                <td className="px-4 py-3">{s.courses.length ? s.courses.map((c: any) => c.courses?.title).filter(Boolean).join(", ") : <span className="text-muted-foreground">—</span>}</td>
                <td className="px-4 py-3">{s.lessonsDone}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.lastAccess ? new Date(s.lastAccess).toLocaleDateString("pt-PT") : "—"}</td>
              </tr>
            ))}
            {!isLoading && (data?.length ?? 0) === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Nenhum aluno ainda.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}