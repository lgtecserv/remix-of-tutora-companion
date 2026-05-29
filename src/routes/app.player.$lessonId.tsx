import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { extractYouTubeId, extractVimeoId, vimeoEmbedUrl } from "@/lib/youtube";
import LessonComments from "@/components/lesson-comments";
import { 
  Lock, 
  CheckCircle2, 
  Circle, 
  ChevronLeft, 
  ChevronRight, 
  Paperclip, 
  Send,
  Film,
  Play,
  MessageSquare,
  Clock,
  Sparkles,
  PlayCircle,
  BookOpen,
  ArrowLeft,
  Tv
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

export const Route = createFileRoute("/app/player/$lessonId")({ component: CoursePlayer });

declare global {
  interface Window { YT: any; onYouTubeIframeAPIReady?: () => void; }
}

function useYouTubeAPI() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ready) return;
    if (typeof window === "undefined") return;
    if (window.YT?.Player) { setReady(true); return; }
    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!existing) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(s);
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); setReady(true); };
    const i = setInterval(() => { if (window.YT?.Player) { setReady(true); clearInterval(i); } }, 200);
    return () => clearInterval(i);
  }, [ready]);
  return ready;
}

function CoursePlayer() {
  const { lessonId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["course-player", lessonId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: lessonBase } = await supabase.from("lessons").select("module_id, modules(course_id)").eq("id", lessonId).single();
      if (!lessonBase || !lessonBase.modules) return null;
      const courseId = lessonBase.modules.course_id;

      const { data: course } = await supabase.from("courses").select("*").eq("id", courseId).single();
      if (!course) return null;
      const { data: enroll } = await supabase.from("enrollments").select("id").eq("course_id", course.id).eq("user_id", user!.id).maybeSingle();
      const { data: modules } = await supabase.from("modules").select("*").eq("course_id", course.id).order("position");
      const moduleIds = (modules ?? []).map((m) => m.id);
      const { data: lessons } = moduleIds.length
        ? await supabase.from("lessons").select("*").in("module_id", moduleIds).order("position")
        : { data: [] as any[] };
      const { data: progress } = await supabase.from("lesson_progress").select("*").eq("user_id", user!.id);
      return { course, enrolled: !!enroll, modules: modules ?? [], lessons: lessons ?? [], progress: progress ?? [] };
    },
  });

  const flatLessons = useMemo(() => {
    if (!data) return [] as any[];
    return data.modules.flatMap((m) => data.lessons.filter((l) => l.module_id === m.id).map((l) => ({ ...l, _module: m })));
  }, [data]);

  const progressMap = useMemo(() => {
    const map = new Map<string, { percent: number; is_completed: boolean }>();
    (data?.progress ?? []).forEach((p) => map.set(p.lesson_id, { percent: Number(p.percent), is_completed: p.is_completed }));
    return map;
  }, [data]);

  const [currentId, setCurrentId] = useState<string | null>(null);
  useEffect(() => {
    if (lessonId && currentId !== lessonId) {
      setCurrentId(lessonId);
    }
  }, [lessonId, currentId]);

  const currentIndex = flatLessons.findIndex((l) => l.id === currentId);
  const current = currentIndex >= 0 ? flatLessons[currentIndex] : null;
  const prev = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null;

  const [activeTab, setActiveTab] = useState<"about" | "comments">("about");

  function isUnlocked(idx: number) {
    if (idx === 0) return true;
    const prevLesson = flatLessons[idx - 1];
    return progressMap.get(prevLesson.id)?.is_completed === true || !prevLesson.is_locked;
  }

  // Estatísticas de progresso do curso
  const courseProgressPercent = useMemo(() => {
    if (flatLessons.length === 0) return 0;
    const completedCount = flatLessons.filter((l) => progressMap.get(l.id)?.is_completed).length;
    return Math.round((completedCount / flatLessons.length) * 100);
  }, [flatLessons, progressMap]);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4 bg-[#0a0a0c] text-white rounded-2xl border border-neutral-800">
        <Film className="h-12 w-12 text-[#E50914] animate-spin" />
        <p className="text-neutral-400 font-medium animate-pulse">Iniciando a sessão de cinema...</p>
      </div>
    );
  }

  if (!data?.course) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4 bg-[#0a0a0c] text-white rounded-2xl border border-neutral-800">
        <Film className="h-12 w-12 text-neutral-600" />
        <p className="text-neutral-400 font-medium">Ops! Curso não encontrado.</p>
        <Button asChild variant="outline" className="border-neutral-700 hover:bg-neutral-800 text-white"><Link to="/app/cursos">Voltar aos meus cursos</Link></Button>
      </div>
    );
  }

  if (!data.enrolled) {
    if (data.course.is_free) {
      return (
        <div className="flex h-[80vh] flex-col items-center justify-center max-w-2xl mx-auto text-center gap-6 bg-[#0a0a0c] text-white rounded-2xl border border-neutral-800 p-8 shadow-2xl">
          <div className="rounded-full bg-emerald-500/10 p-4 border border-emerald-500/20">
            <Sparkles className="h-10 w-10 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white md:text-3xl">{data.course.title}</h2>
            <p className="mt-3 text-neutral-400 max-w-md mx-auto">Este curso incrível é totalmente gratuito! Faça a sua inscrição agora com apenas um clique e comece a assistir imediatamente.</p>
          </div>
          <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-12 text-base font-semibold transition-all rounded-xl shadow-lg shadow-emerald-950" onClick={async () => {
            const { error } = await supabase.from("enrollments").insert({ user_id: user!.id, course_id: data.course.id });
            if (error && !error.message.includes("duplicate")) return toast.error(error.message);
            toast.success("Inscrição efetuada com sucesso!"); qc.invalidateQueries({ queryKey: ["course-player", lessonId] });
          }}>Começar a assistir grátis</Button>
        </div>
      );
    }
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center max-w-2xl mx-auto text-center gap-6 bg-[#0a0a0c] text-white rounded-2xl border border-neutral-800 p-8 shadow-2xl">
        <div className="rounded-full bg-neutral-900 p-4 border border-neutral-800">
          <Lock className="h-10 w-10 text-[#E50914]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white md:text-3xl">Acesso Restrito</h2>
          <p className="mt-3 text-neutral-400 max-w-md mx-auto">Você ainda não está matriculado neste curso. Explore nosso catálogo para encontrar este e outros cursos exclusivos.</p>
        </div>
        <Button asChild size="lg" className="bg-[#E50914] hover:bg-[#b80710] text-white px-8 h-12 text-base font-semibold rounded-xl"><Link to="/app/catalogo">Explorar Catálogo</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070709] text-neutral-100 rounded-2xl border border-neutral-800/60 shadow-2xl overflow-hidden flex flex-col">
      {/* Top Header Cinema Bar */}
      <div className="bg-[#0c0c0e] border-b border-neutral-800/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/app/cursos" className="group flex items-center justify-center h-10 w-10 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-[#E50914] transition-all text-neutral-400 hover:text-white">
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#E50914] uppercase tracking-widest">
              <Tv className="h-3.5 w-3.5" />
              <span>Netflix Style Player</span>
            </div>
            <h1 className="text-lg font-bold text-white leading-tight line-clamp-1">{data.course.title}</h1>
          </div>
        </div>

        {/* Progress Tracker Bar */}
        <div className="flex items-center gap-4 bg-neutral-900/50 border border-neutral-800/60 px-4 py-2 rounded-xl backdrop-blur-md">
          <div className="text-xs font-medium text-neutral-400">Seu progresso:</div>
          <div className="w-24 bg-neutral-800 h-2 rounded-full overflow-hidden border border-neutral-700/50">
            <div 
              className="bg-gradient-to-r from-[#E50914] to-red-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_#E50914]" 
              style={{ width: `${courseProgressPercent}%` }} 
            />
          </div>
          <span className="text-xs font-bold text-white">{courseProgressPercent}%</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] p-3 md:p-6 flex-1">
        {/* Main Stream Area */}
        <div className="space-y-6">
          {current ? (
            <div className="space-y-4">
              <LessonPlayer
                key={current.id}
                lesson={current}
                initialPercent={progressMap.get(current.id)?.percent ?? 0}
                onProgress={async (percent, completed) => {
                  const wasCompleted = progressMap.get(current.id)?.is_completed;
                  await supabase.from("lesson_progress").upsert({
                    user_id: user!.id, lesson_id: current.id, percent, is_completed: completed, updated_at: new Date().toISOString(),
                  }, { onConflict: "user_id,lesson_id" } as any);
                  qc.invalidateQueries({ queryKey: ["course-player", lessonId] });
                  if (completed && !wasCompleted) {
                    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#E50914', '#10B981', '#ffffff'] });
                    toast.success("Aula concluída! Próxima aula desbloqueada.");
                  }
                }}
              />
              
              {/* Cinema control panel */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0c0c0e] border border-neutral-800/60 p-4 rounded-2xl">
                <Button onClick={() => prev && navigate({ to: "/app/player/$lessonId", params: { lessonId: prev.id } })} disabled={!prev} variant="outline" size="sm" className="h-11 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800/50 border border-neutral-800/40 gap-2">
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </Button>
                
                <div className="flex items-center gap-2">
                  {!progressMap.get(current.id)?.is_completed && (
                    <Button variant="outline" className="h-11 rounded-xl text-emerald-400 hover:text-emerald-300 border-emerald-500/30 hover:bg-emerald-950/20 bg-emerald-950/10 gap-2 font-medium" onClick={async () => {
                      await supabase.from("lesson_progress").upsert({ user_id: user!.id, lesson_id: current.id, percent: 100, is_completed: true, updated_at: new Date().toISOString() }, { onConflict: "user_id,lesson_id" } as any);
                      qc.invalidateQueries({ queryKey: ["course-player", lessonId] });
                      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#E50914', '#10B981', '#ffffff'] });
                      toast.success("Aula marcada como concluída!");
                    }}>
                      <CheckCircle2 className="h-4 w-4" /> Concluir Aula
                    </Button>
                  )}
                  {progressMap.get(current.id)?.is_completed && (
                    <span className="flex items-center gap-1.5 text-emerald-500 bg-emerald-950/30 border border-emerald-500/20 px-3 py-2 rounded-xl text-xs font-semibold">
                      <CheckCircle2 className="h-4 w-4" /> Aula Concluída
                    </span>
                  )}
                </div>

                <Button onClick={() => next && navigate({ to: "/app/player/$lessonId", params: { lessonId: next.id } })} disabled={!next} className="h-11 rounded-xl bg-[#E50914] hover:bg-[#b80710] disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-semibold gap-2 border-none">
                  Próxima <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="aspect-video rounded-2xl border border-dashed border-neutral-800 bg-[#0c0c0e]/50 flex flex-col items-center justify-center text-neutral-400 gap-3 shadow-inner">
              <Film className="h-12 w-12 text-neutral-700 animate-pulse" />
              <span className="font-semibold text-neutral-500">Este curso ainda não tem aulas cadastradas.</span>
            </div>
          )}

          {/* Interactive Netflix Tabs */}
          {current && (
            <div className="bg-[#0c0c0e] border border-neutral-800/60 rounded-2xl overflow-hidden shadow-xl">
              {/* Tab Header */}
              <div className="flex border-b border-neutral-800/80 bg-neutral-900/40 p-2 gap-2">
                <button 
                  onClick={() => setActiveTab("about")} 
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl transition-all ${
                    activeTab === "about" 
                      ? "bg-neutral-800 text-white shadow-md border-b-2 border-b-[#E50914]" 
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800/30"
                  }`}
                >
                  <PlayCircle className="h-4 w-4" />
                  Sobre a Aula
                </button>
                <button 
                  onClick={() => setActiveTab("comments")} 
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl transition-all relative ${
                    activeTab === "comments" 
                      ? "bg-neutral-800 text-white shadow-md border-b-2 border-b-[#E50914]" 
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800/30"
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  Comunidade & Dúvidas
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "about" ? (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                        <span>{current._module?.title || "Módulo"}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Aula {currentIndex + 1}</span>
                      </div>
                      <h2 className="text-xl font-bold text-white">{current.title}</h2>
                    </div>

                    {current.description ? (
                      <div className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap bg-neutral-900/30 p-4 rounded-xl border border-neutral-850">
                        {current.description}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500 italic">Sem descrição detalhada para esta aula.</p>
                    )}

                    {current.attachment_url && (
                      <div className="pt-4 border-t border-neutral-800/80">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">Materiais complementares</h4>
                        <a 
                          href={current.attachment_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-sm font-medium text-emerald-400 hover:bg-neutral-850 hover:border-emerald-500/50 hover:text-emerald-300 transition-all shadow-md group"
                        >
                          <Paperclip className="h-5 w-5 text-emerald-500 group-hover:rotate-12 transition-transform" />
                          <span>Baixar Material Complementar (PDF / Arquivo)</span>
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <LessonComments lessonId={current.id} courseInstructorId={data?.course?.instructor_id} />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Netflix Playlist Sidebar */}
        <aside className="bg-[#0c0c0e] border border-neutral-800/60 rounded-2xl p-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-8rem)] lg:overflow-auto flex flex-col shadow-2xl">
          <div className="pb-3 border-b border-neutral-800/80 mb-4 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#E50914]" />
              Conteúdo do Curso
            </h3>
            <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded-full border border-neutral-800">
              {flatLessons.length} Aulas
            </span>
          </div>

          <div className="space-y-5 overflow-y-auto flex-1 pr-1 custom-scrollbar">
            {data.modules.map((m) => {
              const moduleLessons = flatLessons.filter((l) => l.module_id === m.id);
              if (moduleLessons.length === 0) return null;
              
              return (
                <div key={m.id} className="space-y-2">
                  <div className="text-xs font-bold text-white px-2 py-1 bg-neutral-900/80 border-l-2 border-neutral-700 rounded-r-md leading-tight line-clamp-2">
                    {m.title}
                  </div>
                  
                  <div className="space-y-1">
                    {moduleLessons.map((l) => {
                      const idx = flatLessons.findIndex((x) => x.id === l.id);
                      const unlocked = isUnlocked(idx);
                      const p = progressMap.get(l.id);
                      const active = l.id === lessonId;
                      const hasLyt = extractYouTubeId(l.youtube_url);
                      const hasVim = extractVimeoId(l.youtube_url);
                      
                      return (
                        <button
                          key={l.id}
                          disabled={!unlocked}
                          onClick={() => navigate({ to: "/app/player/$lessonId", params: { lessonId: l.id } })}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs transition-all relative border overflow-hidden",
                            active 
                              ? "bg-[#E50914]/10 text-white font-semibold border-[#E50914] shadow-[0_0_12px_rgba(229,9,20,0.1)]" 
                              : unlocked 
                                ? "hover:bg-neutral-800/40 text-neutral-300 hover:text-white border-transparent" 
                                : "text-neutral-500/60 cursor-not-allowed border-transparent bg-neutral-950/20"
                          )}
                        >
                          {/* Active Border Accent */}
                          {active && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E50914]" />
                          )}

                          {/* Status Icon */}
                          <div className="flex-shrink-0">
                            {!unlocked ? (
                              <Lock className="h-4 w-4 text-neutral-600" />
                            ) : p?.is_completed ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-500/10 drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]" />
                            ) : active ? (
                              <Play className="h-4 w-4 text-[#E50914] fill-[#E50914]" />
                            ) : (
                              <Circle className="h-4 w-4 text-neutral-600 group-hover:text-neutral-400" />
                            )}
                          </div>

                          {/* Title & Info */}
                          <div className="flex-1 min-w-0">
                            <div className="truncate font-medium leading-tight">{l.title}</div>
                            <div className="text-[10px] text-neutral-500 mt-1 flex items-center gap-1.5">
                              {hasLyt ? (
                                <span className="bg-red-500/10 text-red-400 px-1 py-[1px] rounded border border-red-500/10 font-bold">YT</span>
                              ) : hasVim ? (
                                <span className="bg-blue-500/10 text-blue-400 px-1 py-[1px] rounded border border-blue-500/10 font-bold">VIM</span>
                              ) : (
                                <span className="bg-emerald-500/10 text-emerald-400 px-1 py-[1px] rounded border border-emerald-500/10 font-bold">LOCAL</span>
                              )}
                              {p && !p.is_completed && p.percent > 0 && (
                                <span className="text-amber-500 font-semibold">{Math.round(p.percent)}% assistido</span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}

function useVimeoAPI() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ready) return;
    if (typeof window === "undefined") return;
    if ((window as any).Vimeo?.Player) { setReady(true); return; }
    const existing = document.querySelector('script[src="https://player.vimeo.com/api/player.js"]');
    if (!existing) {
      const s = document.createElement("script");
      s.src = "https://player.vimeo.com/api/player.js";
      s.onload = () => setReady(true);
      document.body.appendChild(s);
    } else {
      existing.addEventListener('load', () => setReady(true));
      if ((window as any).Vimeo?.Player) setReady(true);
    }
  }, [ready]);
  return ready;
}

function LessonPlayer({ lesson, initialPercent, onProgress }: { lesson: any; initialPercent: number; onProgress: (percent: number, completed: boolean) => void }) {
  const videoId = extractYouTubeId(lesson.youtube_url);
  const vimeoId = extractVimeoId(lesson.youtube_url);
  const isLocalVideo = !videoId && !vimeoId && lesson.youtube_url?.startsWith("http");
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const completedRef = useRef(initialPercent >= 90);
  const lastLoggedPctRef = useRef<number>(initialPercent);
  const ytReady = useYouTubeAPI();
  const vimeoReady = useVimeoAPI();
  const vimeoRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // YouTube logic
  useEffect(() => {
    if (!ytReady || !videoId || !containerRef.current) return;
    completedRef.current = initialPercent >= 90;
    lastLoggedPctRef.current = initialPercent;
    
    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId,
      playerVars: { modestbranding: 1, rel: 0, autoplay: 1 },
      events: {
        onStateChange: (e: any) => {
          if (e.data === window.YT.PlayerState.PLAYING) {
            intervalRef.current = setInterval(() => {
              const p = playerRef.current;
              if (!p?.getDuration) return;
              const dur = p.getDuration(); const cur = p.getCurrentTime();
              if (!dur) return;
              const pct = Math.min(100, (cur / dur) * 100);
              
              if (!completedRef.current && pct >= 90) {
                completedRef.current = true;
                lastLoggedPctRef.current = pct;
                onProgress(pct, true);
              } else {
                const roundedPct = Math.floor(pct);
                if (roundedPct % 5 === 0 && Math.abs(roundedPct - lastLoggedPctRef.current) >= 5) {
                  lastLoggedPctRef.current = roundedPct;
                  onProgress(pct, completedRef.current);
                }
              }
            }, 2000);
          } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
        },
      },
    });
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      try { playerRef.current?.destroy?.(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytReady, videoId]);

  // Vimeo logic
  useEffect(() => {
    if (!vimeoReady || !vimeoId || !vimeoRef.current) return;
    completedRef.current = initialPercent >= 90;
    lastLoggedPctRef.current = initialPercent;

    const player = new (window as any).Vimeo.Player(vimeoRef.current);
    player.on('timeupdate', (data: any) => {
      const pct = Math.min(100, data.percent * 100);
      if (!completedRef.current && pct >= 90) {
        completedRef.current = true;
        lastLoggedPctRef.current = pct;
        onProgress(pct, true);
      } else {
        const roundedPct = Math.floor(pct);
        if (roundedPct % 5 === 0 && Math.abs(roundedPct - lastLoggedPctRef.current) >= 5) {
          lastLoggedPctRef.current = roundedPct;
          onProgress(pct, completedRef.current);
        }
      }
    });
    return () => {
      try { player.destroy(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vimeoReady, vimeoId]);

  // Local/direct video logic
  function handleLocalTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;
    const dur = video.duration;
    const cur = video.currentTime;
    if (!dur) return;
    const pct = Math.min(100, (cur / dur) * 100);
    
    if (!completedRef.current && pct >= 90) {
      completedRef.current = true;
      lastLoggedPctRef.current = pct;
      onProgress(pct, true);
    } else {
      const roundedPct = Math.floor(pct);
      if (roundedPct % 5 === 0 && Math.abs(roundedPct - lastLoggedPctRef.current) >= 5) {
        lastLoggedPctRef.current = roundedPct;
        onProgress(pct, completedRef.current);
      }
    }
  }

  if (!videoId && !vimeoId && !isLocalVideo) {
    return (
      <div className="aspect-video rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-neutral-400 gap-3">
        <Film className="h-10 w-10 text-neutral-600 animate-pulse" />
        <span>Vídeo não configurado para esta aula.</span>
      </div>
    );
  }

  return (
    <div className="aspect-video overflow-hidden rounded-2xl bg-black border border-neutral-800/60 shadow-2xl relative group">
      {videoId ? (
        <div ref={containerRef} className="h-full w-full" />
      ) : vimeoId ? (
        <iframe
          ref={vimeoRef}
          src={vimeoEmbedUrl(lesson.youtube_url)!}
          className="h-full w-full"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        ></iframe>
      ) : (
        <video
          ref={videoRef}
          src={lesson.youtube_url}
          className="h-full w-full object-contain"
          controls
          autoPlay
          onTimeUpdate={handleLocalTimeUpdate}
        />
      )}
    </div>
  );
}