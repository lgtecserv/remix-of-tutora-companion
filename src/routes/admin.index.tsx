import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserPlus, DollarSign, TrendingUp, BookOpen, PlayCircle, Trophy, Clock } from "lucide-react";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const [profilesTotal, newProfiles, paymentsAll, paymentsMonth, courses, enrollments, progress] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since30),
        supabase.from("payments").select("amount_mzn, course_id, status").eq("status", "approved"),
        supabase.from("payments").select("amount_mzn").eq("status", "approved").gte("created_at", monthStart),
        supabase.from("courses").select("id, title"),
        supabase.from("enrollments").select("course_id"),
        supabase.from("lesson_progress").select("lesson_id, is_completed, percent"),
      ]);

      const courseMap = new Map((courses.data ?? []).map((c) => [c.id, c.title]));
      const salesByCourse = new Map<string, number>();
      (paymentsAll.data ?? []).forEach((p) => salesByCourse.set(p.course_id, (salesByCourse.get(p.course_id) ?? 0) + Number(p.amount_mzn)));
      const topSelling = [...salesByCourse.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, v]) => ({ title: courseMap.get(id) ?? "?", revenue: v }));

      const watchByCourse = new Map<string, number>();
      (enrollments.data ?? []).forEach((e) => watchByCourse.set(e.course_id, (watchByCourse.get(e.course_id) ?? 0) + 1));
      const topWatched = [...watchByCourse.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, v]) => ({ title: courseMap.get(id) ?? "?", students: v }));

      const totalProgress = progress.data ?? [];
      const completionRate = totalProgress.length ? Math.round((totalProgress.filter((p) => p.is_completed).length / totalProgress.length) * 100) : 0;
      const avgPercent = totalProgress.length ? Math.round(totalProgress.reduce((s, p) => s + Number(p.percent), 0) / totalProgress.length) : 0;

      return {
        totalStudents: profilesTotal.count ?? 0,
        newStudents: newProfiles.count ?? 0,
        revenueTotal: (paymentsAll.data ?? []).reduce((s, p) => s + Number(p.amount_mzn), 0),
        revenueMonth: (paymentsMonth.data ?? []).reduce((s, p) => s + Number(p.amount_mzn), 0),
        topSelling, topWatched, completionRate, avgPercent,
      };
    },
  });

  if (isLoading || !data) return <div className="text-muted-foreground">A carregar...</div>;

  const kpis = [
    { icon: Users, label: "Total de alunos", v: data.totalStudents },
    { icon: UserPlus, label: "Novos (30 dias)", v: data.newStudents },
    { icon: DollarSign, label: "Receita total", v: `${data.revenueTotal.toLocaleString("pt-PT")} MT` },
    { icon: TrendingUp, label: "Receita do mês", v: `${data.revenueMonth.toLocaleString("pt-PT")} MT` },
    { icon: Trophy, label: "Taxa de conclusão", v: `${data.completionRate}%` },
    { icon: Clock, label: "Progresso médio", v: `${data.avgPercent}%` },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Visão geral da plataforma.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-6">
            <k.icon className="h-6 w-6 text-primary" />
            <div className="mt-3 text-2xl font-bold text-foreground">{k.v}</div>
            <div className="text-sm text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section icon={DollarSign} title="Cursos mais vendidos" empty="Nenhuma venda ainda.">
          {data.topSelling.map((r, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
              <span className="text-foreground">{r.title}</span>
              <span className="font-semibold text-primary">{r.revenue.toLocaleString("pt-PT")} MT</span>
            </div>
          ))}
        </Section>
        <Section icon={PlayCircle} title="Cursos mais assistidos" empty="Nenhuma inscrição ainda.">
          {data.topWatched.map((r, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
              <span className="text-foreground">{r.title}</span>
              <span className="font-semibold text-primary">{r.students} alunos</span>
            </div>
          ))}
        </Section>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, empty, children }: any) {
  const arr = Array.isArray(children) ? children : [children];
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground"><Icon className="h-5 w-5 text-primary" />{title}</h2>
      <div className="space-y-2">{arr.length ? arr : <div className="text-sm text-muted-foreground">{empty}</div>}</div>
    </div>
  );
}