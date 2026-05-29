import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { unwrapRelation, safeSlug } from "@/lib/supabase-utils";
import { PlayCircle, BookOpen, Trophy, Sparkles, ArrowRight, Sun, Moon, Play } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero.jpg";

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
      <div className="md:hidden -mx-4 -mt-4 pb-10 overflow-hidden">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="px-5 py-8 pb-14 rounded-b-[2.5rem] shadow-2xl relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${heroBg})` }}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-orange-600/90 mix-blend-multiply" />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute -top-10 -right-10 opacity-20 pointer-events-none mix-blend-overlay">
            <Sparkles className="w-48 h-48 text-white" />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <h1 className="text-3xl font-black text-white drop-shadow-md">Olá, {name} 👋</h1>
              <p className="text-white/90 mt-1 text-sm font-medium">O que vamos aprender hoje?</p>
            </div>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2.5 bg-white/10 rounded-full text-white backdrop-blur-md border border-white/20 shadow-lg transition-transform active:scale-95">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </motion.div>

        {/* Continue Watching */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="px-5 -mt-10 relative z-20">
          {lastCourse ? (
            <Link to="/app/curso/$slug" params={{ slug: safeSlug((lastCourse as any)?.slug, "curso") }} className="group block bg-card/80 backdrop-blur-xl rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/10 transition-all active:scale-[0.98]">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary mb-3">
                <PlayCircle className="h-4 w-4" /> Continuar assistindo
              </div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 line-clamp-1">{(lastCourse as any)?.title ?? "Curso"}</div>
              <div className="text-lg font-bold text-foreground leading-tight line-clamp-2">{(lastLesson as any)?.title ?? ""}</div>
              
              <div className="mt-5 flex items-center gap-4">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted shadow-inner">
                  <div className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]" style={{ width: `${Math.round(Number(lastProgress?.percent || 0))}%` }} />
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary group-active:bg-primary group-active:text-white transition-colors">
                  <Play className="h-4 w-4 ml-0.5 fill-current" />
                </div>
              </div>
            </Link>
          ) : (
            <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/10 text-center">
              <BookOpen className="h-10 w-10 text-primary/30 mx-auto mb-4" />
              <div className="text-base text-foreground font-bold">Nenhum curso em andamento</div>
              <Link to="/app/catalogo" className="mt-4 inline-block text-sm font-bold text-white bg-primary shadow-lg shadow-primary/30 px-6 py-2.5 rounded-full active:scale-95 transition-transform">Explorar Catálogo</Link>
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 px-5 mt-6">
          {[
            { icon: BookOpen, label: "Em andamento", v: String(inProgress), color: "from-blue-500/20 to-blue-600/5" },
            { icon: Trophy, label: "Concluídas", v: String(completed), color: "from-orange-500/20 to-red-600/5" },
          ].map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className={`bg-gradient-to-br ${c.color} bg-card/80 backdrop-blur-md rounded-3xl p-5 border border-white/5 flex flex-col justify-between shadow-lg relative overflow-hidden`}>
              <div className="absolute -right-4 -top-4 opacity-10 mix-blend-overlay"><c.icon className="h-24 w-24" /></div>
              <c.icon className="h-6 w-6 text-foreground/80 mb-3 relative z-10" />
              <div className="relative z-10">
                <div className="text-3xl font-black text-foreground drop-shadow-sm">{c.v}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-1">{c.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recommendations */}
        {recs.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-8">
            <div className="px-5 mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-black text-foreground">Recomendados</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto px-5 pb-6 hide-scrollbar snap-x">
              {recs.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.1 }} className="snap-start shrink-0 w-[240px]">
                  <Link to="/app/curso/$slug" params={{ slug: safeSlug(c.slug, c.id) }} className="overflow-hidden rounded-3xl border border-white/10 bg-card/80 backdrop-blur-sm shadow-xl block transition-transform active:scale-95">
                    <div className="relative h-32 overflow-hidden">
                      {c.cover_url ? <img src={c.cover_url} alt={c.title} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-muted" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                    <div className="p-4">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-primary mb-1 line-clamp-1">{c.category ?? "Curso"}</div>
                      <div className="text-sm font-bold text-foreground line-clamp-2 leading-tight">{c.title}</div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* =========================================================================
          DESKTOP DESIGN 
          ========================================================================= */}
      <div className="hidden md:block space-y-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground drop-shadow-sm">Olá, <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">{name}</span> 👋</h1>
          <p className="mt-2 text-lg text-muted-foreground font-medium">Continue de onde parou e aprenda algo novo hoje.</p>
        </motion.div>

        <section>
          <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground">
            <PlayCircle className="h-6 w-6 text-primary" /> Continuar assistindo
          </motion.h2>
          {lastCourse ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
              <Link to="/app/curso/$slug" params={{ slug: safeSlug((lastCourse as any)?.slug, "curso") }} className="group flex items-center justify-between rounded-[2rem] border border-border/50 bg-gradient-to-r from-card to-card/50 p-8 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-primary/10">
                <div>
                  <div className="text-sm font-bold uppercase tracking-widest text-primary/80 mb-2">{(lastCourse as any)?.title ?? "Curso"}</div>
                  <div className="text-2xl font-bold text-foreground">{(lastLesson as any)?.title ?? ""}</div>
                  <div className="mt-4 h-2 w-72 max-w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]" style={{ width: `${Math.round(Number(lastProgress?.percent || 0))}%` }} />
                  </div>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:shadow-[0_0_20px_rgba(234,88,12,0.4)]">
                  <ArrowRight className="h-6 w-6 text-primary group-hover:text-white" />
                </div>
              </Link>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="rounded-3xl border border-dashed border-border bg-card/50 p-12 text-center text-muted-foreground backdrop-blur-sm">
              <BookOpen className="mx-auto mb-4 h-12 w-12 opacity-20" />
              <p className="text-lg">Ainda não começou nenhum curso. <Link to="/app/cursos" className="font-bold text-primary hover:underline">Ver meus cursos</Link>.</p>
            </motion.div>
          )}
        </section>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: BookOpen, label: "Cursos em andamento", v: String(inProgress), color: "from-blue-500/20 to-blue-600/5" },
            { icon: Trophy, label: "Aulas concluídas", v: String(completed), color: "from-orange-500/20 to-red-600/5" },
            { icon: Sparkles, label: "Recomendações", v: String(recs.length), color: "from-purple-500/20 to-pink-600/5" },
          ].map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className={`relative overflow-hidden rounded-[2rem] border border-border/50 bg-gradient-to-br ${c.color} bg-card/80 p-8 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
              <div className="absolute -right-6 -top-6 opacity-5 mix-blend-overlay"><c.icon className="h-40 w-40" /></div>
              <div className="relative z-10">
                <c.icon className="h-8 w-8 text-foreground/80" />
                <div className="mt-4 text-4xl font-black text-foreground drop-shadow-sm">{c.v}</div>
                <div className="mt-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {recs.length > 0 && (
          <section className="pt-4">
            <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="mb-6 text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-500" /> Recomendado para você
            </motion.h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {recs.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 + i * 0.1 }}>
                  <Link to="/app/curso/$slug" params={{ slug: safeSlug(c.slug, c.id) }} className="group block overflow-hidden rounded-3xl border border-border/50 bg-card shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-primary/40 hover:shadow-2xl">
                    <div className="relative h-40 overflow-hidden">
                      {c.cover_url ? <img src={c.cover_url} alt={c.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" /> : <div className="h-full w-full bg-muted" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    </div>
                    <div className="p-5">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{c.category ?? "Curso"}</div>
                      <div className="font-bold text-foreground leading-snug line-clamp-2">{c.title}</div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}