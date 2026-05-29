import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserPlus, DollarSign, TrendingUp, BookOpen, PlayCircle, Trophy, Clock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero.jpg";

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
    <div className="space-y-8 pb-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary to-orange-600 px-8 py-14 shadow-2xl">
        <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay" style={{ backgroundImage: `url(${heroBg})` }} />
        <div className="absolute -right-10 -top-10 opacity-20 pointer-events-none mix-blend-overlay">
          <Sparkles className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-black text-white drop-shadow-md">Painel Admin 👋</h1>
          <p className="mt-2 text-white/90 text-sm md:text-lg font-medium max-w-xl">
            Bem-vindo à central de controlo. Aqui acompanha todo o crescimento da plataforma em tempo real.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className="group rounded-3xl border border-border bg-card/80 backdrop-blur-md p-5 sm:p-6 shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-primary/40 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500"><k.icon className="h-28 w-28" /></div>
            <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:bg-primary/20">
              <k.icon className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-foreground drop-shadow-sm">{k.v}</div>
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">{k.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="h-full">
          <Section icon={DollarSign} title="Cursos mais vendidos" empty="Nenhuma venda ainda.">
            {data.topSelling.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-2xl border border-border bg-card/40 p-4 transition-all duration-300 hover:bg-card hover:shadow-md hover:border-primary/20">
                <span className="font-semibold text-foreground text-sm sm:text-base line-clamp-1 mr-2">{r.title}</span>
                <span className="font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full text-[10px] sm:text-xs whitespace-nowrap">{r.revenue.toLocaleString("pt-PT")} MT</span>
              </div>
            ))}
          </Section>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="h-full">
          <Section icon={PlayCircle} title="Cursos mais assistidos" empty="Nenhuma inscrição ainda.">
            {data.topWatched.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-2xl border border-border bg-card/40 p-4 transition-all duration-300 hover:bg-card hover:shadow-md hover:border-primary/20">
                <span className="font-semibold text-foreground text-sm sm:text-base line-clamp-1 mr-2">{r.title}</span>
                <span className="font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full text-[10px] sm:text-xs whitespace-nowrap">{r.students} alunos</span>
              </div>
            ))}
          </Section>
        </motion.div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, empty, children }: any) {
  const arr = Array.isArray(children) ? children : [children];
  return (
    <div className="rounded-[2rem] border border-border bg-card/60 backdrop-blur-sm p-6 sm:p-8 shadow-xl h-full flex flex-col">
      <h2 className="mb-6 flex items-center gap-3 font-bold text-foreground text-lg sm:text-xl"><div className="bg-primary/20 p-2 rounded-xl"><Icon className="h-5 w-5 text-primary" /></div>{title}</h2>
      <div className="space-y-3 flex-1">{arr.length ? arr : <div className="text-sm font-medium text-muted-foreground flex items-center justify-center h-20 bg-muted/30 rounded-2xl border border-dashed border-border">{empty}</div>}</div>
    </div>
  );
}